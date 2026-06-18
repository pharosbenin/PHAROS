from django.db.models import Q, Exists, OuterRef, Count, Subquery, IntegerField, F
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import EstGestionnaire, EstAdmin, EstNonSuspendu, EstHotelValide
from .models import Hotel, TypeChambre, PhotoHotel, PhotoChambre, PlatMenu, CommandeRestaurant, LigneCommande, Promotion
from .serializers import (
    HotelListeSerializer, HotelDetailSerializer, HotelCreerSerializer,
    HotelAdminSerializer, TypeChambreSerializer, TypeChambreEcrireSerializer,
    PhotoHotelSerializer, PhotoChambreSerializer, PlatMenuSerializer,
    CommandeRestaurantSerializer, LigneCommandeCreerSerializer, StatutCommandeSerializer,
    PromotionSerializer,
)


# --- Vues publiques ---

class RechercheHotels(generics.ListAPIView):
    serializer_class = HotelListeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from evenements.models import MiseEnAvantHotel
        qs = Hotel.objects.filter(statut='valide')
        params = self.request.query_params
        if ville := params.get('ville'):
            qs = qs.filter(ville__icontains=ville)
        if q := params.get('q'):
            qs = qs.filter(Q(nom__icontains=q) | Q(description__icontains=q) | Q(quartier__icontains=q))
        if prix_max := params.get('prix_max'):
            qs = qs.filter(types_chambres__prix_nuit__lte=prix_max).distinct()
        if capacite := params.get('capacite'):
            qs = qs.filter(types_chambres__capacite__gte=capacite).distinct()

        # Boost événement : hôtels PRO avec MiseEnAvantHotel active remontent en tête
        today = timezone.now().date()
        boost_actif = MiseEnAvantHotel.objects.filter(
            hotel=OuterRef('pk'),
            est_actif=True,
            date_boost_debut__lte=today,
            date_boost_fin__gte=today,
        )
        qs = qs.annotate(est_booste=Exists(boost_actif))
        return qs.order_by('-est_booste', '-type_abonnement', '-note_moyenne')


@api_view(['GET'])
@permission_classes([AllowAny])
def villes_disponibles(request):
    villes = (
        Hotel.objects
        .exclude(ville__isnull=True)
        .exclude(ville__exact='')
        .values_list('ville', flat=True)
        .distinct()
        .order_by('ville')
    )
    return Response(sorted(set(villes), key=lambda v: v.lower()))


@api_view(['GET'])
@permission_classes([AllowAny])
def detail_hotel(request, pk):
    try:
        hotel = Hotel.objects.get(pk=pk, statut='valide')
    except Hotel.DoesNotExist:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    # Rafraîchir est_disponible pour chaque chambre : couvre les dates dépassées
    # et les annulations récentes sans attendre une action explicite.
    from reservations.views import _recompute_disponibilite
    for chambre in hotel.types_chambres.all():
        _recompute_disponibilite(chambre)
    return Response(HotelDetailSerializer(hotel).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def chambres_hotel(request, pk):
    try:
        hotel = Hotel.objects.get(pk=pk, statut='valide')
    except Hotel.DoesNotExist:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    date_arrivee = request.query_params.get('date_arrivee')
    date_depart = request.query_params.get('date_depart')

    if date_arrivee and date_depart:
        # Filtre par chevauchement réel sur les dates demandées
        from datetime import date as date_type
        from reservations.models import Reservation
        from django.db.models import Count, OuterRef, Subquery, IntegerField
        try:
            d_arrivee = date_type.fromisoformat(date_arrivee)
            d_depart = date_type.fromisoformat(date_depart)
        except ValueError:
            return Response({'detail': 'Dates invalides.'}, status=status.HTTP_400_BAD_REQUEST)

        nb_reservations = Reservation.objects.filter(
            type_chambre=OuterRef('pk'),
            statut__in=['payee', 'confirmee', 'en_cours', 'confirme_client', 'confirme_hotel'],
            date_arrivee__lt=d_depart,
            date_depart__gte=d_arrivee,
        ).values('type_chambre').annotate(n=Count('id')).values('n')

        chambres = TypeChambre.objects.filter(hotel=hotel).annotate(
            nb_overlap=Subquery(nb_reservations, output_field=IntegerField())
        ).filter(
            Q(nb_overlap__isnull=True) | Q(nb_overlap__lt=F('nombre_chambres'))
        )
    else:
        chambres = TypeChambre.objects.filter(hotel=hotel, est_disponible=True)

    return Response(TypeChambreSerializer(chambres, many=True).data)


# --- Vues Gestionnaire ---

class MesHotels(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu]

    def get_serializer_class(self):
        return HotelCreerSerializer if self.request.method == 'POST' else HotelListeSerializer

    def get_queryset(self):
        return Hotel.objects.filter(gestionnaire=self.request.user)


class DetailModifierHotel(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu]
    serializer_class = HotelCreerSerializer

    def get_queryset(self):
        return Hotel.objects.filter(gestionnaire=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return HotelDetailSerializer
        return HotelCreerSerializer


class MesTypesChambre(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide]

    def get_serializer_class(self):
        return TypeChambreEcrireSerializer if self.request.method == 'POST' else TypeChambreSerializer

    def get_queryset(self):
        hotel_pk = self.kwargs['hotel_pk']
        return TypeChambre.objects.filter(hotel__pk=hotel_pk, hotel__gestionnaire=self.request.user)

    def perform_create(self, serializer):
        from django.shortcuts import get_object_or_404
        hotel = get_object_or_404(Hotel, pk=self.kwargs['hotel_pk'], gestionnaire=self.request.user)
        serializer.save(hotel=hotel)


class DetailModifierTypeChambre(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return TypeChambreSerializer
        return TypeChambreEcrireSerializer

    def get_queryset(self):
        return TypeChambre.objects.filter(hotel__gestionnaire=self.request.user)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def ajouter_photo_hotel(request, hotel_pk):
    from django.shortcuts import get_object_or_404
    hotel = get_object_or_404(Hotel, pk=hotel_pk, gestionnaire=request.user)
    serializer = PhotoHotelSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(hotel=hotel)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def supprimer_photo_hotel(request, hotel_pk, photo_pk):
    from django.shortcuts import get_object_or_404
    hotel = get_object_or_404(Hotel, pk=hotel_pk, gestionnaire=request.user)
    photo = get_object_or_404(PhotoHotel, pk=photo_pk, hotel=hotel)
    if photo.image:
        photo.image.delete(save=False)
    photo.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide])
def ajouter_photo_chambre(request, hotel_pk, chambre_pk):
    from django.shortcuts import get_object_or_404
    hotel = get_object_or_404(Hotel, pk=hotel_pk, gestionnaire=request.user)
    chambre = get_object_or_404(TypeChambre, pk=chambre_pk, hotel=hotel)
    serializer = PhotoChambreSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(type_chambre=chambre)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide])
def supprimer_photo_chambre(request, hotel_pk, chambre_pk, photo_pk):
    from django.shortcuts import get_object_or_404
    hotel = get_object_or_404(Hotel, pk=hotel_pk, gestionnaire=request.user)
    chambre = get_object_or_404(TypeChambre, pk=chambre_pk, hotel=hotel)
    photo = get_object_or_404(PhotoChambre, pk=photo_pk, type_chambre=chambre)
    if photo.image:
        photo.image.delete(save=False)
    photo.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- Promotions (Pro uniquement) ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def promotions_hotel(request, hotel_pk):
    from django.shortcuts import get_object_or_404
    hotel = get_object_or_404(Hotel, pk=hotel_pk, gestionnaire=request.user)
    if hotel.type_abonnement != 'pro':
        return Response({'detail': "Les promotions sont réservées aux hôtels Partenaire Pro."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        promos = Promotion.objects.filter(type_chambre__hotel=hotel).select_related('type_chambre')
        return Response(PromotionSerializer(promos, many=True).data)

    serializer = PromotionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    chambre = serializer.validated_data['type_chambre']
    if chambre.hotel != hotel:
        return Response({'detail': "Cette chambre n'appartient pas à votre hôtel."}, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu])
def supprimer_promotion(request, hotel_pk, promo_pk):
    from django.shortcuts import get_object_or_404
    hotel = get_object_or_404(Hotel, pk=hotel_pk, gestionnaire=request.user)
    promo = get_object_or_404(Promotion, pk=promo_pk, type_chambre__hotel=hotel)
    promo.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- Restauration (menu) ---

class PlatsMenu(generics.ListCreateAPIView):
    serializer_class = PlatMenuSerializer
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide]

    def get_queryset(self):
        hotel_pk = self.kwargs['hotel_pk']
        return PlatMenu.objects.filter(hotel__pk=hotel_pk, hotel__gestionnaire=self.request.user)

    def perform_create(self, serializer):
        from django.shortcuts import get_object_or_404
        hotel = get_object_or_404(Hotel, pk=self.kwargs['hotel_pk'], gestionnaire=self.request.user)
        serializer.save(hotel=hotel)


class DetailModifierPlat(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlatMenuSerializer
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide]

    def get_queryset(self):
        return PlatMenu.objects.filter(hotel__gestionnaire=self.request.user)


# --- Vues Admin ---

class ListeHotelsAdmin(generics.ListAPIView):
    serializer_class = HotelAdminSerializer
    permission_classes = [IsAuthenticated, EstAdmin]

    def get_queryset(self):
        qs = Hotel.objects.all().order_by('-date_creation')
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def valider_hotel(request, pk):
    try:
        hotel = Hotel.objects.get(pk=pk)
    except Hotel.DoesNotExist:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    hotel.statut = 'valide'
    hotel.motif_rejet = ''
    hotel.save(update_fields=['statut', 'motif_rejet'])
    return Response({'message': f'Hôtel "{hotel.nom}" validé avec succès.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def rejeter_hotel(request, pk):
    try:
        hotel = Hotel.objects.get(pk=pk)
    except Hotel.DoesNotExist:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    motif = request.data.get('motif', '')
    hotel.statut = 'rejete'
    hotel.motif_rejet = motif
    hotel.save(update_fields=['statut', 'motif_rejet'])
    return Response({'message': f'Hôtel "{hotel.nom}" rejeté.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def suspendre_hotel(request, pk):
    try:
        hotel = Hotel.objects.get(pk=pk)
    except Hotel.DoesNotExist:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    hotel.statut = 'suspendu' if hotel.statut != 'suspendu' else 'valide'
    hotel.save(update_fields=['statut'])
    return Response({'message': f'Hôtel {hotel.statut}.', 'statut': hotel.statut})


# --- Menu public ---

@api_view(['GET'])
@permission_classes([AllowAny])
def menu_hotel_public(request, pk):
    """Menu public d'un hôtel (plats disponibles uniquement)."""
    try:
        hotel = Hotel.objects.get(pk=pk, statut='valide')
    except Hotel.DoesNotExist:
        return Response({'detail': 'Hôtel introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    plats = PlatMenu.objects.filter(hotel=hotel, est_disponible=True)
    return Response({
        'hotel_id': hotel.pk,
        'hotel_nom': hotel.nom,
        'a_restauration': plats.exists(),
        'plats': PlatMenuSerializer(plats, many=True).data,
    })


# --- Commandes restaurant (client) ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, EstNonSuspendu])
def commandes_reservation(request, numero):
    """GET : commandes d'une réservation. POST : créer une commande."""
    from reservations.models import Reservation
    from django.shortcuts import get_object_or_404

    reservation = get_object_or_404(Reservation, numero=numero)

    # Seul le client de la réservation peut accéder
    if reservation.client != request.user and reservation.email_client != request.user.email:
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    # La réservation doit être active
    statuts_actifs = ('payee', 'confirmee', 'en_cours', 'confirme_hotel', 'confirme_client')
    if reservation.statut not in statuts_actifs:
        return Response({'detail': 'Vous ne pouvez commander que pendant un séjour actif.'}, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'GET':
        commandes = CommandeRestaurant.objects.filter(reservation=reservation)
        return Response(CommandeRestaurantSerializer(commandes, many=True).data)

    # POST — créer une commande
    lignes_data = request.data.get('lignes', [])
    notes = request.data.get('notes', '')

    if not lignes_data:
        return Response({'detail': 'Aucun plat sélectionné.'}, status=status.HTTP_400_BAD_REQUEST)

    # Valider les lignes
    serializer = LigneCommandeCreerSerializer(data=lignes_data, many=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Vérifier que tous les plats appartiennent à l'hôtel de la réservation
    ids_plats = [l['plat_id'] for l in serializer.validated_data]
    plats = PlatMenu.objects.filter(id__in=ids_plats, hotel=reservation.hotel, est_disponible=True)
    if plats.count() != len(ids_plats):
        return Response({'detail': 'Un ou plusieurs plats sont invalides ou indisponibles.'}, status=status.HTTP_400_BAD_REQUEST)

    plats_map = {p.id: p for p in plats}
    montant_total = sum(plats_map[l['plat_id']].prix * l['quantite'] for l in serializer.validated_data)

    commande = CommandeRestaurant.objects.create(
        reservation=reservation,
        hotel=reservation.hotel,
        notes=notes,
        montant_total=montant_total,
    )
    for ligne in serializer.validated_data:
        plat = plats_map[ligne['plat_id']]
        LigneCommande.objects.create(
            commande=commande,
            plat=plat,
            nom_plat=plat.nom,
            prix_unitaire=plat.prix,
            quantite=ligne['quantite'],
        )

    return Response(CommandeRestaurantSerializer(commande).data, status=status.HTTP_201_CREATED)


# --- Commandes restaurant (gestionnaire) ---

class CommandesHotel(generics.ListAPIView):
    serializer_class = CommandeRestaurantSerializer
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide]

    def get_queryset(self):
        hotel_pk = self.kwargs['hotel_pk']
        qs = CommandeRestaurant.objects.filter(
            hotel__pk=hotel_pk, hotel__gestionnaire=self.request.user
        )
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide])
def maj_statut_commande(request, pk):
    try:
        commande = CommandeRestaurant.objects.get(pk=pk, hotel__gestionnaire=request.user)
    except CommandeRestaurant.DoesNotExist:
        return Response({'detail': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = StatutCommandeSerializer(data=request.data)
    if serializer.is_valid():
        commande.statut = serializer.validated_data['statut']
        commande.save(update_fields=['statut'])
        return Response(CommandeRestaurantSerializer(commande).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
