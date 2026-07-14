from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.db.models import Sum
from accounts.permissions import EstAdmin, EstGestionnaire, EstNonSuspendu
from hotels.models import Hotel
from .models import Abonnement, Commission, DemandeUpgradePro, Retrait
from .serializers import (AbonnementSerializer, CommissionSerializer,
                          DemandeUpgradeProSerializer, RetraitSerializer, RetraitAdminSerializer)


def _solde_disponible(hotel):
    """Solde = montant_hotel de toutes les réservations terminées - retraits approuvés."""
    # On se base sur reservation.statut='terminee' plutôt que commission.statut
    # pour ne pas dépendre de _finaliser_sejour ayant correctement mis à jour commission.statut
    gagne = Commission.objects.filter(
        hotel=hotel,
        paiement__reservation__statut='terminee'
    ).aggregate(t=Sum('montant_hotel'))['t'] or 0
    retire = Retrait.objects.filter(hotel=hotel, statut='approuve').aggregate(t=Sum('montant'))['t'] or 0
    return float(gagne) - float(retire)


# --- Gestionnaire ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def mon_abonnement(request):
    hotel_id = request.query_params.get('hotel_id')
    if hotel_id:
        hotel = Hotel.objects.filter(pk=hotel_id, gestionnaire=request.user).first()
    else:
        hotel = Hotel.objects.filter(gestionnaire=request.user).first()
    if not hotel:
        return Response({'detail': 'Vous n\'avez pas encore d\'hôtel enregistré.'}, status=status.HTTP_404_NOT_FOUND)

    abonnement = Abonnement.objects.filter(hotel=hotel, statut='actif').first()
    demande_en_cours = DemandeUpgradePro.objects.filter(hotel=hotel, statut='en_attente').exists()

    data = {
        'type_actuel': hotel.type_abonnement,
        'demande_en_cours': demande_en_cours,
        'avantages_pro': [
            'Accès à toutes les fonctionnalités premium PHAROS',
            'Vos chambres apparaissent en priorité dans les résultats',
            'Badge "Hôtel Pro" visible par les clients',
            'Mise en avant pendant les événements nationaux',
            'Statistiques avancées et support prioritaire',
        ]
    }
    if abonnement:
        data['abonnement'] = AbonnementSerializer(abonnement).data
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def upgrader_pro(request):
    hotel_id = request.data.get('hotel_id')
    if hotel_id:
        hotel = Hotel.objects.filter(pk=hotel_id, gestionnaire=request.user, statut='valide').first()
    else:
        hotel = Hotel.objects.filter(gestionnaire=request.user, statut='valide').first()
    if not hotel:
        return Response({'detail': 'Hôtel validé introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if hotel.type_abonnement == 'pro':
        return Response({'detail': 'Votre hôtel est déjà en abonnement Pro.'}, status=status.HTTP_400_BAD_REQUEST)

    if DemandeUpgradePro.objects.filter(hotel=hotel, statut='en_attente').exists():
        return Response({'detail': 'Une demande est déjà en cours de traitement.'}, status=status.HTTP_400_BAD_REQUEST)

    DemandeUpgradePro.objects.create(hotel=hotel)

    return Response({
        'message': 'Demande envoyée. L\'administrateur va traiter votre demande sous peu.',
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def mes_commissions(request):
    hotel_id = request.query_params.get('hotel_id')
    if hotel_id:
        hotel = Hotel.objects.filter(pk=hotel_id, gestionnaire=request.user).first()
    else:
        hotel = Hotel.objects.filter(gestionnaire=request.user).first()
    if not hotel:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    commissions = Commission.objects.filter(hotel=hotel).select_related('hotel', 'paiement__reservation')
    total = sum(c.montant_hotel for c in commissions)
    return Response({
        'commissions': CommissionSerializer(commissions, many=True).data,
        'total_revenus': total,
    })


# --- Admin ---

class ToutesCommissions(generics.ListAPIView):
    serializer_class = CommissionSerializer
    permission_classes = [IsAuthenticated, EstAdmin]

    def get_queryset(self):
        qs = Commission.objects.select_related('hotel', 'paiement__reservation')
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        qs = self.get_queryset()
        response.data = {
            'commissions': response.data,
            'total_commission_pharos': sum(c.montant_commission for c in qs),
            'total_verse_hotels': sum(c.montant_hotel for c in qs),
        }
        return response


class TousAbonnements(generics.ListAPIView):
    serializer_class = AbonnementSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = Abonnement.objects.select_related('hotel')


class DemandesUpgrade(generics.ListAPIView):
    serializer_class = DemandeUpgradeProSerializer
    permission_classes = [IsAuthenticated, EstAdmin]

    def get_queryset(self):
        statut = self.request.query_params.get('statut', 'en_attente')
        return DemandeUpgradePro.objects.filter(statut=statut).select_related('hotel__gestionnaire', 'traite_par')


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def approuver_upgrade(request, pk):
    try:
        demande = DemandeUpgradePro.objects.get(pk=pk, statut='en_attente')
    except DemandeUpgradePro.DoesNotExist:
        return Response({'detail': 'Demande introuvable ou déjà traitée.'}, status=status.HTTP_404_NOT_FOUND)

    hotel = demande.hotel

    abonnement = Abonnement.objects.create(
        hotel=hotel,
        type_abonnement='pro',
        taux_commission=0.05,
        date_debut=timezone.now().date(),
        statut='actif',
        montant_paye=0,
    )

    demande.statut = 'approuve'
    demande.date_traitement = timezone.now()
    demande.traite_par = request.user
    demande.save()

    return Response({
        'message': f'{hotel.nom} est maintenant en abonnement Pro.',
        'abonnement': AbonnementSerializer(abonnement).data,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def mes_retraits(request):
    hotel_id = request.query_params.get('hotel_id') or request.data.get('hotel_id')
    if hotel_id:
        hotel = Hotel.objects.filter(pk=hotel_id, gestionnaire=request.user).first()
    else:
        hotel = Hotel.objects.filter(gestionnaire=request.user).first()
    if not hotel:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        retraits = Retrait.objects.filter(hotel=hotel)
        solde = _solde_disponible(hotel)
        en_attente_count = retraits.filter(statut='en_attente').count()
        return Response({
            'solde_disponible': round(solde, 2),
            'retraits': RetraitSerializer(retraits, many=True).data,
            'en_attente_count': en_attente_count,
        })

    # POST — soumettre une demande de retrait
    montant = request.data.get('montant')
    methode = request.data.get('methode')
    numero = request.data.get('numero_telephone', '').strip()

    if not montant or not methode or not numero:
        return Response({'detail': 'Montant, méthode et numéro de téléphone requis.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        montant = float(montant)
    except (ValueError, TypeError):
        return Response({'detail': 'Montant invalide.'}, status=status.HTTP_400_BAD_REQUEST)
    if montant <= 0:
        return Response({'detail': 'Le montant doit être supérieur à 0.'}, status=status.HTTP_400_BAD_REQUEST)

    solde = _solde_disponible(hotel)
    if montant > solde:
        return Response({'detail': f'Solde insuffisant. Disponible : {round(solde):,} FCFA.'}, status=status.HTTP_400_BAD_REQUEST)

    if Retrait.objects.filter(hotel=hotel, statut='en_attente').exists():
        return Response({'detail': 'Une demande de retrait est déjà en cours de traitement.'}, status=status.HTTP_400_BAD_REQUEST)

    if methode not in ('mtn', 'moov', 'carte'):
        return Response({'detail': 'Méthode invalide. Choisissez mtn, moov ou carte.'}, status=status.HTTP_400_BAD_REQUEST)
    if methode in ('mtn', 'moov'):
        if len(numero) != 10 or not numero.startswith('0'):
            return Response({'detail': 'Numéro Mobile Money invalide (10 chiffres, commençant par 0).'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        numero_clean = numero.replace(' ', '').replace('-', '')
        if not numero_clean.isdigit() or len(numero_clean) != 16:
            return Response({'detail': 'Numéro de carte bancaire invalide (16 chiffres).'}, status=status.HTTP_400_BAD_REQUEST)
        numero = numero_clean

    retrait = Retrait.objects.create(
        hotel=hotel,
        demandeur=request.user,
        montant=montant,
        methode=methode,
        numero_telephone=numero,
    )

    from accounts.models import Notification
    Notification.objects.create(
        destinataire=request.user,
        type='info',
        titre='Demande de retrait reçue',
        message=f'Votre demande de retrait de {int(montant):,} FCFA via {retrait.get_methode_display()} a été soumise. '
                f'Elle sera traitée sous 24-48h.',
    )

    return Response({
        'message': 'Demande de retrait soumise avec succès. Traitement sous 24-48h.',
        'retrait': RetraitSerializer(retrait).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def rejeter_upgrade(request, pk):
    try:
        demande = DemandeUpgradePro.objects.get(pk=pk, statut='en_attente')
    except DemandeUpgradePro.DoesNotExist:
        return Response({'detail': 'Demande introuvable ou déjà traitée.'}, status=status.HTTP_404_NOT_FOUND)

    demande.statut = 'rejete'
    demande.date_traitement = timezone.now()
    demande.traite_par = request.user
    demande.message_admin = request.data.get('message', '')
    demande.save()

    return Response({'message': 'Demande rejetée.'})


# --- Admin Retraits ---

class TousRetraits(generics.ListAPIView):
    serializer_class = RetraitAdminSerializer
    permission_classes = [IsAuthenticated, EstAdmin]

    def get_queryset(self):
        statut = self.request.query_params.get('statut', 'en_attente')
        qs = Retrait.objects.select_related('hotel__gestionnaire')
        if statut != 'tous':
            qs = qs.filter(statut=statut)
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data = {
            'retraits': response.data,
            'en_attente_count': Retrait.objects.filter(statut='en_attente').count(),
        }
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def approuver_retrait(request, pk):
    try:
        retrait = Retrait.objects.get(pk=pk, statut='en_attente')
    except Retrait.DoesNotExist:
        return Response({'detail': 'Demande introuvable ou déjà traitée.'}, status=status.HTTP_404_NOT_FOUND)

    solde = _solde_disponible(retrait.hotel)
    if float(retrait.montant) > solde:
        return Response({'detail': f'Solde insuffisant pour approuver. Disponible : {round(solde):,} FCFA.'}, status=status.HTTP_400_BAD_REQUEST)

    retrait.statut = 'approuve'
    retrait.date_traitement = timezone.now()
    retrait.traite_par = request.user
    retrait.save()

    from accounts.models import Notification
    Notification.objects.create(
        destinataire=retrait.hotel.gestionnaire,
        type='info',
        titre='Retrait approuvé',
        message=f'Votre demande de retrait de {int(retrait.montant):,} FCFA via {retrait.get_methode_display()} '
                f'({retrait.numero_telephone}) a été approuvée. Les fonds seront transférés sous peu.',
    )

    return Response({
        'message': f'Retrait de {int(retrait.montant):,} FCFA approuvé.',
        'retrait': RetraitAdminSerializer(retrait).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def rejeter_retrait(request, pk):
    try:
        retrait = Retrait.objects.get(pk=pk, statut='en_attente')
    except Retrait.DoesNotExist:
        return Response({'detail': 'Demande introuvable ou déjà traitée.'}, status=status.HTTP_404_NOT_FOUND)

    motif = request.data.get('motif', '').strip()
    if not motif:
        return Response({'detail': 'Un motif de rejet est requis.'}, status=status.HTTP_400_BAD_REQUEST)

    retrait.statut = 'rejete'
    retrait.motif_rejet = motif
    retrait.date_traitement = timezone.now()
    retrait.traite_par = request.user
    retrait.save()

    from accounts.models import Notification
    Notification.objects.create(
        destinataire=retrait.hotel.gestionnaire,
        type='info',
        titre='Demande de retrait rejetée',
        message=f'Votre demande de retrait de {int(retrait.montant):,} FCFA a été rejetée.\nMotif : {motif}',
    )

    return Response({'message': 'Demande de retrait rejetée.', 'retrait': RetraitAdminSerializer(retrait).data})
