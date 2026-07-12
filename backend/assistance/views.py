from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from evenements.utils import distance_km
from reservations.models import Reservation

from .models import CategorieService, ServiceProximite
from .serializers import CategorieServiceSerializer, ServiceProximiteSerializer

# Rayon de recherche fixe, côté backend uniquement (non paramétrable par le client).
RAYON_RECHERCHE_KM = 15

# Rayon de secours : utilisé uniquement si AUCUNE catégorie n'a de service dans le rayon
# normal (cas des zones rurales peu couvertes par OpenStreetMap, ex. Tanguiéta).
RAYON_SECOURS_KM = 50

# Statuts couvrant un séjour actif : paiement confirmé jusqu'à la fin du séjour (inclus),
# jamais pour une réservation en attente de paiement, annulée ou remboursée.
STATUTS_SEJOUR_ACTIF = ['payee', 'confirmee', 'en_cours', 'confirme_hotel', 'confirme_client', 'terminee']


class CategoriesActives(generics.ListAPIView):
    serializer_class = CategorieServiceSerializer
    permission_classes = [AllowAny]
    queryset = CategorieService.objects.filter(actif=True)


def _categories_dans_rayon(hotel_lat, hotel_lon, rayon_km):
    """Retourne les catégories actives ayant au moins un service actif dans le rayon donné,
    triées par distance croissante. Aucune requête réseau : filtre sur les données déjà en base."""
    categories_par_bloc = []
    for categorie in CategorieService.objects.filter(actif=True).order_by('ordre'):
        services_proches = []
        for service in ServiceProximite.objects.filter(categorie=categorie, actif=True):
            d = distance_km(hotel_lat, hotel_lon, float(service.latitude), float(service.longitude))
            if d <= rayon_km:
                service.distance_km = round(d, 2)
                services_proches.append(service)

        # Une catégorie sans service à proximité ne s'affiche pas.
        if not services_proches:
            continue

        services_proches.sort(key=lambda s: s.distance_km)
        categories_par_bloc.append({
            'categorie': CategorieServiceSerializer(categorie).data,
            'services': ServiceProximiteSerializer(services_proches, many=True).data,
        })
    return categories_par_bloc


def _autorise(reservation, request):
    """Client authentifié propriétaire, admin, ou email correspondant à la réservation
    (invité ou compte) — même principe que _proprietaire_autorise dans reservations/views.py."""
    if request.user.is_authenticated and request.user.role == 'admin':
        return True
    if request.user.is_authenticated and reservation.client == request.user:
        return True
    email = (request.query_params.get('email') or '').strip().lower()
    if email:
        return email == reservation.email_client.lower()
    if request.user.is_authenticated:
        return request.user.email.lower() == reservation.email_client.lower()
    return False


@api_view(['GET'])
@permission_classes([AllowAny])
def mon_sejour(request, numero_reservation):
    try:
        reservation = Reservation.objects.select_related('hotel').get(numero=numero_reservation)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    # 1) Autorisation
    if not _autorise(reservation, request):
        return Response({'detail': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    # 2) Statut de réservation = séjour actif
    if reservation.statut not in STATUTS_SEJOUR_ACTIF:
        return Response(
            {'detail': "L'assistance voyageur n'est disponible que pour un séjour actif."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # 3) Coordonnées GPS valides sur l'hôtel
    hotel = reservation.hotel
    if hotel.latitude is None or hotel.longitude is None:
        return Response(
            {'detail': "Localisation de l'hôtel non disponible."},
            status=status.HTTP_404_NOT_FOUND,
        )

    hotel_lat, hotel_lon = float(hotel.latitude), float(hotel.longitude)

    categories_par_bloc = _categories_dans_rayon(hotel_lat, hotel_lon, RAYON_RECHERCHE_KM)
    rayon_utilise = RAYON_RECHERCHE_KM
    rayon_etendu = False

    # Repli : uniquement si AUCUNE catégorie n'a de résultat dans le rayon normal
    # (pas si certaines catégories seulement sont vides).
    if not categories_par_bloc:
        categories_par_bloc = _categories_dans_rayon(hotel_lat, hotel_lon, RAYON_SECOURS_KM)
        if categories_par_bloc:
            rayon_utilise = RAYON_SECOURS_KM
            rayon_etendu = True

    return Response({
        'hotel_nom': hotel.nom,
        'hotel_ville': hotel.ville,
        'rayon_km': RAYON_RECHERCHE_KM,
        'rayon_utilise': rayon_utilise,
        'rayon_etendu': rayon_etendu,
        'categories': categories_par_bloc,
    })
