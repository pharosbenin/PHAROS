from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import EstAdmin
from .models import EvenementNational, MiseEnAvantHotel
from .serializers import EvenementSerializer, MiseEnAvantSerializer


# --- Public ---

@api_view(['GET'])
@permission_classes([AllowAny])
def evenements_actifs(request):
    today = timezone.now().date()
    qs = EvenementNational.objects.filter(est_actif=True, date_fin__gte=today)
    ville = request.query_params.get('ville')
    if ville:
        qs = [e for e in qs if ville in e.villes_concernees]
    return Response(EvenementSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def detail_evenement(request, pk):
    try:
        evt = EvenementNational.objects.get(pk=pk)
    except EvenementNational.DoesNotExist:
        return Response({'detail': 'Événement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    # Hôtels mis en avant pendant cet événement
    mises_en_avant = MiseEnAvantHotel.objects.filter(evenement=evt, est_actif=True)
    hotels_boostes = [m.hotel_id for m in mises_en_avant]

    from hotels.models import Hotel
    from hotels.serializers import HotelListeSerializer
    hotels = Hotel.objects.filter(
        statut='valide',
        ville__in=evt.villes_concernees
    ).order_by('-type_abonnement', '-note_moyenne')

    data = EvenementSerializer(evt).data
    data['hotels'] = HotelListeSerializer(hotels, many=True).data
    return Response(data)


# --- Admin ---

class GestionEvenements(generics.ListCreateAPIView):
    serializer_class = EvenementSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = EvenementNational.objects.all()


class DetailEvenementAdmin(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EvenementSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = EvenementNational.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def mettre_en_avant_hotel(request):
    serializer = MiseEnAvantSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
