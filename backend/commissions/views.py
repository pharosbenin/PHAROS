from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import EstAdmin, EstGestionnaire, EstNonSuspendu
from hotels.models import Hotel
from .models import Abonnement, Commission, DemandeUpgradePro
from .serializers import AbonnementSerializer, CommissionSerializer, DemandeUpgradeProSerializer


# --- Gestionnaire ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def mon_abonnement(request):
    try:
        hotel = Hotel.objects.get(gestionnaire=request.user)
    except Hotel.DoesNotExist:
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
    try:
        hotel = Hotel.objects.get(gestionnaire=request.user, statut='valide')
    except Hotel.DoesNotExist:
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
    try:
        hotel = Hotel.objects.get(gestionnaire=request.user)
    except Hotel.DoesNotExist:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    commissions = Commission.objects.filter(hotel=hotel)
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
        qs = Commission.objects.all()
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
    queryset = Abonnement.objects.all()


class DemandesUpgrade(generics.ListAPIView):
    serializer_class = DemandeUpgradeProSerializer
    permission_classes = [IsAuthenticated, EstAdmin]

    def get_queryset(self):
        statut = self.request.query_params.get('statut', 'en_attente')
        return DemandeUpgradePro.objects.filter(statut=statut)


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
