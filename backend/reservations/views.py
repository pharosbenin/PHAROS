import uuid
from decimal import Decimal
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import EstAdmin, EstGestionnaire, EstNonSuspendu, EstHotelValide
from .models import Reservation, Paiement, QRCodeReservation, Annulation
from .serializers import (
    ReservationListeSerializer, ReservationDetailSerializer,
    ReservationCreerSerializer, InitierPaiementSerializer,
    AnnulationSerializer, PaiementSerializer,
)


# --- Création de réservation (clients connectés uniquement) ---

@api_view(['POST'])
@permission_classes([IsAuthenticated, EstNonSuspendu])
def creer_reservation(request):
    if request.user.role in ('gestionnaire', 'admin'):
        return Response(
            {'detail': 'Les gestionnaires et administrateurs ne peuvent pas effectuer de réservations.'},
            status=status.HTTP_403_FORBIDDEN
        )
    serializer = ReservationCreerSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        reservation = serializer.save()
        return Response(ReservationDetailSerializer(reservation).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def detail_reservation(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    # Accès : client connecté ou email correspondant
    if request.user.is_authenticated:
        if reservation.client != request.user and request.user.role not in ('admin', 'gestionnaire'):
            return Response({'detail': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
    return Response(ReservationDetailSerializer(reservation).data)


# --- Paiement ---

@api_view(['POST'])
@permission_classes([AllowAny])
def initier_paiement(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero, statut='en_attente')
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable ou déjà traitée.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = InitierPaiementSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    hotel = reservation.hotel
    taux = Decimal('0.015') if hotel.type_abonnement == 'pro' else Decimal('0.03')
    montant = reservation.prix_total
    montant_commission = round(montant * taux, 2)
    montant_hotel = round(montant - montant_commission, 2)

    # Simuler le paiement (intégration FedaPay/Kkiapay à faire)
    paiement, _ = Paiement.objects.update_or_create(
        reservation=reservation,
        defaults={
            'montant': montant,
            'montant_commission': montant_commission,
            'montant_hotel': montant_hotel,
            'methode': serializer.validated_data['methode'],
            'numero_telephone': serializer.validated_data.get('numero_telephone', ''),
            'statut': 'reussi',
            'reference_externe': str(uuid.uuid4()),
            'date_paiement': timezone.now(),
        }
    )

    reservation.statut = 'payee'
    reservation.save(update_fields=['statut'])

    # Générer QR code
    QRCodeReservation.objects.get_or_create(reservation=reservation)

    # Enregistrer commission
    from commissions.models import Commission
    Commission.objects.get_or_create(
        paiement=paiement,
        defaults={
            'hotel': hotel,
            'montant_brut': montant,
            'taux': taux,
            'montant_commission': montant_commission,
            'montant_hotel': montant_hotel,
            'statut': 'calcule',
        }
    )

    return Response({
        'message': 'Paiement effectué avec succès.',
        'reservation': ReservationDetailSerializer(reservation).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def qrcode_reservation(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero)
        qr = reservation.qrcode
    except (Reservation.DoesNotExist, QRCodeReservation.DoesNotExist):
        return Response({'detail': 'QR Code introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    from .serializers import QRCodeSerializer
    return Response(QRCodeSerializer(qr).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstHotelValide])
def scanner_qrcode(request):
    code = request.data.get('code')
    if not code:
        return Response({'detail': 'Code QR requis.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        qr = QRCodeReservation.objects.get(code=code)
    except QRCodeReservation.DoesNotExist:
        return Response({'detail': 'QR Code invalide.'}, status=status.HTTP_404_NOT_FOUND)
    if qr.est_utilise:
        return Response({'detail': 'Ce QR Code a déjà été utilisé.', 'reservation': ReservationDetailSerializer(qr.reservation).data})
    # Vérifier que l'hôtel appartient au gestionnaire
    if qr.reservation.hotel.gestionnaire != request.user:
        return Response({'detail': 'Ce QR Code n\'appartient pas à votre hôtel.'}, status=status.HTTP_403_FORBIDDEN)
    qr.est_utilise = True
    qr.date_utilisation = timezone.now()
    qr.save()
    qr.reservation.statut = 'en_cours'
    qr.reservation.save(update_fields=['statut'])
    return Response({'message': 'Check-in effectué.', 'reservation': ReservationDetailSerializer(qr.reservation).data})


# --- Double confirmation du séjour (Escrow) ---

def _verifier_fenetre_confirmation(reservation):
    """Retourne True si on est dans la fenêtre de confirmation (≥ 5h avant le départ)."""
    from datetime import datetime, time, timedelta
    depart_dt = timezone.make_aware(datetime.combine(reservation.date_depart, time.min))
    return timezone.now() >= depart_dt - timedelta(hours=5)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstNonSuspendu])
def confirmer_sejour_client(request, numero):
    """Le client confirme que son séjour s'est bien passé."""
    try:
        reservation = Reservation.objects.get(numero=numero)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if reservation.client != request.user:
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    if reservation.statut not in ('payee', 'confirmee', 'en_cours', 'confirme_hotel'):
        return Response({'detail': 'Ce séjour ne peut pas être confirmé dans son état actuel.'}, status=status.HTTP_400_BAD_REQUEST)

    if not _verifier_fenetre_confirmation(reservation):
        return Response({'detail': f'Vous pourrez confirmer votre séjour 5h avant votre date de départ ({reservation.date_depart.strftime("%d/%m/%Y")}).'}, status=status.HTTP_400_BAD_REQUEST)

    if reservation.statut == 'confirme_hotel':
        # L'hôtel a déjà confirmé → les deux ont confirmé → fonds libérés
        reservation.statut = 'terminee'
        reservation.save(update_fields=['statut'])
        return Response({'message': 'Séjour confirmé. Les fonds sont maintenant transférés à l\'hôtel.', 'statut': 'terminee'})

    reservation.statut = 'confirme_client'
    reservation.save(update_fields=['statut'])
    return Response({'message': 'Votre confirmation a été enregistrée. En attente de la confirmation de l\'hôtel.', 'statut': 'confirme_client'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide])
def confirmer_sejour_hotel(request, numero):
    """L'hôtelier confirme que le séjour s'est bien passé."""
    try:
        reservation = Reservation.objects.get(numero=numero, hotel__gestionnaire=request.user)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if reservation.statut not in ('payee', 'confirmee', 'en_cours', 'confirme_client'):
        return Response({'detail': 'Ce séjour ne peut pas être confirmé dans son état actuel.'}, status=status.HTTP_400_BAD_REQUEST)

    if not _verifier_fenetre_confirmation(reservation):
        return Response({'detail': f'La confirmation n\'est disponible qu\'à partir de 5h avant la date de départ ({reservation.date_depart.strftime("%d/%m/%Y")}).'}, status=status.HTTP_400_BAD_REQUEST)

    if reservation.statut == 'confirme_client':
        # Le client a déjà confirmé → les deux ont confirmé → fonds libérés
        reservation.statut = 'terminee'
        reservation.save(update_fields=['statut'])
        return Response({'message': 'Séjour confirmé. Les fonds sont maintenant transférés.', 'statut': 'terminee'})

    reservation.statut = 'confirme_hotel'
    reservation.save(update_fields=['statut'])
    return Response({'message': 'Votre confirmation a été enregistrée. En attente de la confirmation du client.', 'statut': 'confirme_hotel'})


# --- Annulation ---

@api_view(['POST'])
@permission_classes([IsAuthenticated, EstNonSuspendu])
def demander_annulation(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    if reservation.client != request.user and request.user.role not in ('admin', 'gestionnaire'):
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
    if reservation.statut in ('terminee', 'annulee', 'remboursee'):
        return Response({'detail': 'Cette réservation ne peut plus être annulée.'}, status=status.HTTP_400_BAD_REQUEST)
    if hasattr(reservation, 'annulation'):
        return Response({'detail': 'Une demande d\'annulation existe déjà.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = AnnulationSerializer(data=request.data)
    if serializer.is_valid():
        role = request.user.role if request.user.role in ('gestionnaire', 'admin') else 'client'
        annulation = serializer.save(reservation=reservation, demandeur=request.user, demande_par=role)
        reservation.statut = 'annulee'
        reservation.save(update_fields=['statut'])
        return Response(AnnulationSerializer(annulation).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Espace client ---

class MesReservations(generics.ListAPIView):
    serializer_class = ReservationListeSerializer
    permission_classes = [IsAuthenticated, EstNonSuspendu]

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        return Reservation.objects.filter(
            Q(client=user) | Q(email_client=user.email)
        ).distinct()


# --- Espace gestionnaire ---

class ReservationsHotel(generics.ListAPIView):
    serializer_class = ReservationListeSerializer
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide]

    def get_queryset(self):
        qs = Reservation.objects.filter(hotel__gestionnaire=self.request.user)
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs


# --- Admin ---

class ToutesReservations(generics.ListAPIView):
    serializer_class = ReservationListeSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = Reservation.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs
