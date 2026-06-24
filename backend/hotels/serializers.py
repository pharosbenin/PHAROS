import re
from rest_framework import serializers
from .models import Hotel, TypeChambre, PhotoHotel, PhotoChambre, PlatMenu, CommandeRestaurant, LigneCommande, Promotion


class PhotoHotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoHotel
        fields = ('id', 'image', 'legende', 'est_principale', 'ordre')


class PhotoChambreSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoChambre
        fields = ('id', 'image', 'legende', 'ordre')


class PromotionSerializer(serializers.ModelSerializer):
    est_en_cours = serializers.ReadOnlyField()
    chambre_nom = serializers.CharField(source='type_chambre.nom', read_only=True)
    prix_original = serializers.DecimalField(source='type_chambre.prix_nuit', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Promotion
        fields = ('id', 'type_chambre', 'chambre_nom', 'prix_original', 'titre',
                  'prix_promo', 'date_debut', 'date_fin', 'est_active', 'est_en_cours', 'date_creation')
        read_only_fields = ('id', 'date_creation', 'est_en_cours', 'chambre_nom', 'prix_original')

    def validate(self, attrs):
        if attrs.get('date_fin') and attrs.get('date_debut'):
            if attrs['date_fin'] < attrs['date_debut']:
                raise serializers.ValidationError({'date_fin': "La date de fin doit être après la date de début."})
        if attrs.get('prix_promo') and attrs.get('type_chambre'):
            if attrs['prix_promo'] >= attrs['type_chambre'].prix_nuit:
                raise serializers.ValidationError({'prix_promo': "Le prix promo doit être inférieur au prix normal."})
        return attrs


class TypeChambreSerializer(serializers.ModelSerializer):
    photos = PhotoChambreSerializer(many=True, read_only=True)
    promotion_active = serializers.SerializerMethodField()
    occupation_actuelle = serializers.SerializerMethodField()

    def get_promotion_active(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        promo = obj.promotions.filter(
            est_active=True, date_debut__lte=today, date_fin__gte=today
        ).first()
        if promo:
            return {
                'id': promo.id,
                'titre': promo.titre,
                'prix_promo': float(promo.prix_promo),
                'date_fin': promo.date_fin.isoformat(),
            }
        return None

    def get_occupation_actuelle(self, obj):
        from django.utils import timezone
        from reservations.models import Reservation
        today = timezone.now().date()
        # Prochaine réservation active à partir d'aujourd'hui
        res = Reservation.objects.filter(
            type_chambre=obj,
            statut__in=['payee', 'confirmee', 'en_cours', 'confirme_client', 'confirme_hotel'],
            date_depart__gt=today,
        ).order_by('date_arrivee').first()
        if res:
            return {
                'date_arrivee': res.date_arrivee.isoformat(),
                'date_depart': res.date_depart.isoformat(),
            }
        return None

    class Meta:
        model = TypeChambre
        fields = ('id', 'hotel', 'nom', 'description', 'capacite', 'prix_nuit',
                  'prix_weekend', 'superficie', 'nombre_chambres', 'equipements',
                  'est_disponible', 'photos', 'promotion_active', 'occupation_actuelle', 'date_creation')
        read_only_fields = ('id', 'date_creation')


class TypeChambreEcrireSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeChambre
        fields = ('id', 'nom', 'description', 'capacite', 'prix_nuit', 'prix_weekend',
                  'superficie', 'nombre_chambres', 'equipements', 'est_disponible')
        read_only_fields = ('id',)


class HotelListeSerializer(serializers.ModelSerializer):
    photo_principale = serializers.SerializerMethodField()
    gestionnaire_nom = serializers.CharField(source='gestionnaire.nom_complet', read_only=True)
    etoiles = serializers.SerializerMethodField()

    def get_photo_principale(self, obj):
        premiere_photo = obj.photos.first()
        if premiere_photo:
            return premiere_photo.image.url
        return obj.photo_principale.url if obj.photo_principale else None

    def get_etoiles(self, obj):
        note = float(obj.note_moyenne or 0)
        if note >= 4.5: return 5
        if note >= 4.0: return 4
        if note >= 3.0: return 3
        if note >= 2.0: return 2
        return 0

    def to_representation(self, instance):
        data = super().to_representation(instance)
        from django.utils import timezone
        today = timezone.now().date()
        prix_min = None
        prix_min_original = None
        a_promotion = False
        for chambre in instance.types_chambres.filter(est_disponible=True):
            prix = float(chambre.prix_nuit)
            promo = chambre.promotions.filter(
                est_active=True, date_debut__lte=today, date_fin__gte=today
            ).first()
            prix_eff = float(promo.prix_promo) if promo else prix
            if prix_min is None or prix_eff < prix_min:
                prix_min = prix_eff
                prix_min_original = prix if promo else None
                a_promotion = bool(promo)
        data['prix_min'] = prix_min
        data['prix_min_original'] = prix_min_original
        data['a_promotion'] = a_promotion
        data['capacite_max'] = max(
            (c.capacite for c in instance.types_chambres.all()), default=0
        )
        data['est_booste'] = getattr(instance, 'est_booste', False)
        dist = getattr(instance, '_distance_km', None)
        if dist is not None and dist < 9999:
            data['distance_km'] = round(dist, 2)
        else:
            data['distance_km'] = None
        return data

    class Meta:
        model = Hotel
        fields = ('id', 'nom', 'adresse', 'ville', 'quartier', 'telephone',
                  'type_abonnement', 'type_etablissement', 'equipements', 'statut',
                  'note_moyenne', 'nombre_avis', 'photo_principale', 'gestionnaire_nom',
                  'etoiles', 'taux_annulation', 'taux_modification', 'delai_gratuit')


def valider_telephone_benin(value):
    if value and not re.fullmatch(r'0[0-9]{9}', value):
        raise serializers.ValidationError("Numéro invalide. 10 chiffres requis, commençant par 0.")


class HotelDetailSerializer(serializers.ModelSerializer):
    photos = PhotoHotelSerializer(many=True, read_only=True)
    types_chambres = TypeChambreSerializer(many=True, read_only=True)
    gestionnaire_nom = serializers.CharField(source='gestionnaire.nom_complet', read_only=True)
    telephone = serializers.CharField(required=False, allow_blank=True, validators=[valider_telephone_benin])

    class Meta:
        model = Hotel
        fields = ('id', 'nom', 'description', 'adresse', 'ville', 'quartier',
                  'telephone', 'email', 'site_web', 'latitude', 'longitude',
                  'type_abonnement', 'type_etablissement', 'equipements', 'statut',
                  'note_moyenne', 'nombre_avis', 'photo_principale', 'photos',
                  'types_chambres', 'gestionnaire_nom', 'date_creation',
                  'taux_annulation', 'taux_modification', 'delai_gratuit')


class HotelCreerSerializer(serializers.ModelSerializer):
    telephone = serializers.CharField(required=False, allow_blank=True, validators=[valider_telephone_benin])

    class Meta:
        model = Hotel
        fields = ('id', 'nom', 'description', 'adresse', 'ville', 'quartier',
                  'telephone', 'email', 'site_web', 'latitude', 'longitude',
                  'type_etablissement', 'equipements',
                  'taux_annulation', 'taux_modification', 'delai_gratuit',
                  'photo_principale', 'document_registre', 'document_identite')
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
    photos = PhotoHotelSerializer(many=True, read_only=True)

    class Meta:
        model = Hotel
        fields = ('id', 'nom', 'description', 'adresse', 'ville', 'quartier',
                  'telephone', 'email', 'statut', 'type_abonnement',
                  'note_moyenne', 'nombre_avis', 'gestionnaire_email',
                  'gestionnaire_nom', 'gestionnaire_telephone',
                  'photo_principale', 'photos',
                  'document_registre', 'document_identite',
                  'motif_rejet', 'date_creation')
        read_only_fields = ('id', 'date_creation')
