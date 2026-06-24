from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import EstAdmin
from .models import EvenementNational, MiseEnAvantHotel, PointInteret
from .serializers import EvenementSerializer, MiseEnAvantSerializer, PointInteretSerializer


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


@api_view(['GET'])
@permission_classes([AllowAny])
def points_interet_ville(request, ville):
    today = timezone.now().date()

    lieux = PointInteret.objects.filter(ville__iexact=ville, actif=True)
    lieux_data = [
        {
            'id': p.id,
            'type': 'lieu',
            'nom': p.nom,
            'description': p.description,
            'categorie': p.categorie,
            'latitude': float(p.latitude),
            'longitude': float(p.longitude),
            'photo': request.build_absolute_uri(p.photo.url) if p.photo else None,
        }
        for p in lieux
    ]

    evenements = EvenementNational.objects.filter(
        est_actif=True,
        date_fin__gte=today,
        latitude__isnull=False,
        longitude__isnull=False,
    )
    evenements = [e for e in evenements if ville.lower() in [v.lower() for v in e.villes_concernees]]
    evenements_data = [
        {
            'id': e.id,
            'type': 'evenement',
            'nom': e.nom,
            'description': e.description,
            'categorie': e.categorie,
            'latitude': float(e.latitude),
            'longitude': float(e.longitude),
            'photo': request.build_absolute_uri(e.image.url) if e.image else None,
        }
        for e in evenements
    ]

    return Response(lieux_data + evenements_data)


# --- Admin ---

class GestionEvenements(generics.ListCreateAPIView):
    serializer_class = EvenementSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = EvenementNational.objects.all()

    def perform_create(self, serializer):
        evenement = serializer.save()
        self._sync_mises_en_avant(evenement)

    def _sync_mises_en_avant(self, evenement):
        from hotels.models import Hotel
        hotels_pro = Hotel.objects.filter(
            statut='valide',
            ville__in=evenement.villes_concernees,
            type_abonnement='pro',
        ).order_by('-note_moyenne')
        for i, hotel in enumerate(hotels_pro):
            MiseEnAvantHotel.objects.update_or_create(
                evenement=evenement,
                hotel=hotel,
                defaults={
                    'position_boost': i,
                    'date_boost_debut': evenement.date_debut,
                    'date_boost_fin': evenement.date_fin,
                    'est_actif': True,
                }
            )


class DetailEvenementAdmin(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EvenementSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = EvenementNational.objects.all()

    def perform_update(self, serializer):
        evenement = serializer.save()
        # Re-sync si les villes ou les dates ont changé
        MiseEnAvantHotel.objects.filter(evenement=evenement).delete()
        from hotels.models import Hotel
        hotels_pro = Hotel.objects.filter(
            statut='valide',
            ville__in=evenement.villes_concernees,
            type_abonnement='pro',
        ).order_by('-note_moyenne')
        for i, hotel in enumerate(hotels_pro):
            MiseEnAvantHotel.objects.create(
                evenement=evenement,
                hotel=hotel,
                position_boost=i,
                date_boost_debut=evenement.date_debut,
                date_boost_fin=evenement.date_fin,
                est_actif=True,
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def mettre_en_avant_hotel(request):
    serializer = MiseEnAvantSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
