from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import EstAdmin, EstGestionnaire, EstClient, EstNonSuspendu, EstHotelValide
from .models import Avis, SignalementAvis
from .serializers import (
    AvisSerializer, AvisCreerSerializer, RepondreAvisSerializer,
    SignalementSerializer, SignalementDetailSerializer
)


@api_view(['GET'])
@permission_classes([AllowAny])
def avis_hotel(request, hotel_pk):
    avis = Avis.objects.filter(hotel_id=hotel_pk, est_approuve=True).select_related('client')
    return Response(AvisSerializer(avis, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstClient, EstNonSuspendu])
def creer_avis(request):
    serializer = AvisCreerSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        avis = serializer.save()
        return Response(AvisSerializer(avis).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide])
def repondre_avis(request, pk):
    try:
        avis = Avis.objects.get(pk=pk, hotel__gestionnaire=request.user)
    except Avis.DoesNotExist:
        return Response({'detail': 'Avis introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = RepondreAvisSerializer(data=request.data)
    if serializer.is_valid():
        avis.reponse_gestionnaire = serializer.validated_data['reponse']
        avis.date_reponse = timezone.now()
        avis.save(update_fields=['reponse_gestionnaire', 'date_reponse'])
        return Response(AvisSerializer(avis).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstNonSuspendu])
def signaler_avis(request, pk):
    try:
        avis = Avis.objects.get(pk=pk)
    except Avis.DoesNotExist:
        return Response({'detail': 'Avis introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    data = {**request.data, 'avis': avis.pk}
    serializer = SignalementSerializer(data=data)
    if serializer.is_valid():
        serializer.save(signale_par=request.user)
        return Response({'message': 'Signalement enregistré.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Gestionnaire ---

class AvisMonHotel(generics.ListAPIView):
    serializer_class = AvisSerializer
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide]

    def get_queryset(self):
        return Avis.objects.filter(hotel__gestionnaire=self.request.user)


# --- Admin ---

class TousLesAvis(generics.ListAPIView):
    serializer_class = AvisSerializer
    permission_classes = [IsAuthenticated, EstAdmin]

    def get_queryset(self):
        qs = Avis.objects.all().select_related('client', 'hotel')
        approuve = self.request.query_params.get('approuve')
        if approuve is not None:
            qs = qs.filter(est_approuve=approuve.lower() == 'true')
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def approuver_avis(request, pk):
    try:
        avis = Avis.objects.get(pk=pk)
    except Avis.DoesNotExist:
        return Response({'detail': 'Avis introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    avis.est_approuve = not avis.est_approuve
    avis.save(update_fields=['est_approuve'])
    action = 'approuvé' if avis.est_approuve else 'retiré'
    return Response({'message': f'Avis {action}.', 'est_approuve': avis.est_approuve})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, EstAdmin])
def supprimer_avis(request, pk):
    try:
        avis = Avis.objects.get(pk=pk)
    except Avis.DoesNotExist:
        return Response({'detail': 'Avis introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    hotel = avis.hotel
    avis.delete()
    hotel.recalculer_note()
    return Response(status=status.HTTP_204_NO_CONTENT)


class SignalementsAdmin(generics.ListAPIView):
    serializer_class = SignalementDetailSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = SignalementAvis.objects.filter(est_traite=False).select_related(
        'avis', 'avis__hotel', 'avis__client', 'signale_par'
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def traiter_signalement(request, pk):
    try:
        signalement = SignalementAvis.objects.get(pk=pk)
    except SignalementAvis.DoesNotExist:
        return Response({'detail': 'Signalement introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    signalement.est_traite = True
    signalement.save(update_fields=['est_traite'])
    return Response({'message': 'Signalement marqué comme traité.'})
