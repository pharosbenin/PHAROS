from rest_framework import serializers
from .models import Hotel, TypeChambre, PhotoHotel, PhotoChambre, PlatMenu, CommandeRestaurant, LigneCommande


class PhotoHotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoHotel
        fields = ('id', 'image', 'legende', 'est_principale', 'ordre')


class PhotoChambreSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoChambre
        fields = ('id', 'image', 'legende', 'ordre')


class TypeChambreSerializer(serializers.ModelSerializer):
    photos = PhotoChambreSerializer(many=True, read_only=True)

    class Meta:
        model = TypeChambre
        fields = ('id', 'hotel', 'nom', 'description', 'capacite', 'prix_nuit',
                  'prix_weekend', 'superficie', 'nombre_chambres', 'equipements',
                  'est_disponible', 'photos', 'date_creation')
        read_only_fields = ('id', 'date_creation')


class TypeChambreEcrireSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeChambre
        fields = ('id', 'nom', 'description', 'capacite', 'prix_nuit', 'prix_weekend',
                  'superficie', 'nombre_chambres', 'equipements', 'est_disponible')
        read_only_fields = ('id',)


class HotelListeSerializer(serializers.ModelSerializer):
    photo_principale = serializers.ImageField(read_only=True)
    gestionnaire_nom = serializers.CharField(source='gestionnaire.nom_complet', read_only=True)
    prix_min = serializers.SerializerMethodField()
    etoiles = serializers.SerializerMethodField()

    def get_prix_min(self, obj):
        chambre = obj.types_chambres.filter(est_disponible=True).order_by('prix_nuit').first()
        return float(chambre.prix_nuit) if chambre else None

    def get_etoiles(self, obj):
        # Basé sur la note moyenne : 0-2→0, 2-3→2, 3-4→3, 4-4.5→4, 4.5+→5
        note = float(obj.note_moyenne or 0)
        if note >= 4.5: return 5
        if note >= 4.0: return 4
        if note >= 3.0: return 3
        if note >= 2.0: return 2
        return 0

    class Meta:
        model = Hotel
        fields = ('id', 'nom', 'adresse', 'ville', 'quartier', 'telephone',
                  'type_abonnement', 'statut', 'note_moyenne', 'nombre_avis',
                  'photo_principale', 'gestionnaire_nom', 'prix_min', 'etoiles')


class HotelDetailSerializer(serializers.ModelSerializer):
    photos = PhotoHotelSerializer(many=True, read_only=True)
    types_chambres = TypeChambreSerializer(many=True, read_only=True)
    gestionnaire_nom = serializers.CharField(source='gestionnaire.nom_complet', read_only=True)

    class Meta:
        model = Hotel
        fields = ('id', 'nom', 'description', 'adresse', 'ville', 'quartier',
                  'telephone', 'email', 'site_web', 'latitude', 'longitude',
                  'type_abonnement', 'statut', 'note_moyenne', 'nombre_avis',
                  'photo_principale', 'photos', 'types_chambres',
                  'gestionnaire_nom', 'date_creation')


class HotelCreerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ('id', 'nom', 'description', 'adresse', 'ville', 'quartier',
                  'telephone', 'email', 'site_web', 'latitude', 'longitude',
                  'photo_principale', 'document_registre')
        read_only_fields = ('id',)

    def create(self, validated_data):
        validated_data['gestionnaire'] = self.context['request'].user
        return super().create(validated_data)


class PlatMenuSerializer(serializers.ModelSerializer):
    categorie_display = serializers.CharField(source='get_categorie_display', read_only=True)

    class Meta:
        model = PlatMenu
        fields = ('id', 'nom', 'categorie', 'categorie_display', 'description', 'prix', 'photo', 'est_disponible', 'date_creation')
        read_only_fields = ('id', 'date_creation', 'categorie_display')


class LigneCommandeSerializer(serializers.ModelSerializer):
    sous_total = serializers.ReadOnlyField()

    class Meta:
        model = LigneCommande
        fields = ('id', 'plat', 'nom_plat', 'prix_unitaire', 'quantite', 'sous_total')


class LigneCommandeCreerSerializer(serializers.Serializer):
    plat_id = serializers.IntegerField()
    quantite = serializers.IntegerField(min_value=1, max_value=20)


class CommandeRestaurantSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    reservation_numero = serializers.CharField(source='reservation.numero', read_only=True)
    client_nom = serializers.CharField(source='reservation.client.nom_complet', read_only=True)

    class Meta:
        model = CommandeRestaurant
        fields = ('id', 'reservation_numero', 'client_nom', 'hotel_nom', 'statut', 'statut_display',
                  'notes', 'montant_total', 'lignes', 'date_commande', 'date_modification')
        read_only_fields = ('id', 'statut', 'statut_display', 'montant_total',
                            'date_commande', 'date_modification', 'hotel_nom',
                            'reservation_numero', 'client_nom')


class StatutCommandeSerializer(serializers.Serializer):
    statut = serializers.ChoiceField(choices=CommandeRestaurant.STATUTS)


class HotelAdminSerializer(serializers.ModelSerializer):
    gestionnaire_email = serializers.EmailField(source='gestionnaire.email', read_only=True)
    gestionnaire_nom = serializers.CharField(source='gestionnaire.nom_complet', read_only=True)
    gestionnaire_telephone = serializers.CharField(source='gestionnaire.telephone', read_only=True)

    class Meta:
        model = Hotel
        fields = ('id', 'nom', 'description', 'adresse', 'ville', 'quartier',
                  'telephone', 'email', 'statut', 'type_abonnement',
                  'note_moyenne', 'nombre_avis', 'gestionnaire_email',
                  'gestionnaire_nom', 'gestionnaire_telephone',
                  'document_registre', 'motif_rejet', 'date_creation')
        read_only_fields = ('id', 'date_creation')
