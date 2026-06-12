from rest_framework import serializers
from django.utils import timezone
from .models import Reservation, Paiement, QRCodeReservation, Annulation, Modification


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = ('id', 'montant', 'montant_commission', 'montant_hotel',
                  'methode', 'statut', 'reference_externe', 'date_paiement')
        read_only_fields = ('id', 'montant_commission', 'montant_hotel', 'statut', 'date_paiement')


class QRCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRCodeReservation
        fields = ('code', 'image', 'est_utilise', 'date_utilisation')


class ReservationListeSerializer(serializers.ModelSerializer):
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    hotel_ville = serializers.CharField(source='hotel.ville', read_only=True)
    hotel_id = serializers.IntegerField(source='hotel.id', read_only=True)
    hotel_taux_annulation = serializers.IntegerField(source='hotel.taux_annulation', read_only=True)
    hotel_taux_modification = serializers.IntegerField(source='hotel.taux_modification', read_only=True)
    type_chambre_nom = serializers.CharField(source='type_chambre.nom', read_only=True)
    type_chambre_id = serializers.IntegerField(source='type_chambre.id', read_only=True)
    nb_nuits = serializers.ReadOnlyField()
    nb_adultes = serializers.IntegerField(read_only=True)
    date_paiement = serializers.SerializerMethodField()
    annulation_info = serializers.SerializerMethodField()
    a_soumis_avis = serializers.SerializerMethodField()

    def get_date_paiement(self, obj):
        try:
            if obj.paiement and obj.paiement.date_paiement:
                return obj.paiement.date_paiement.isoformat()
        except Exception:
            pass
        return None

    def get_annulation_info(self, obj):
        try:
            a = obj.annulation
            frais = float(a.frais_annulation)
            commission = float(a.commission_plateforme)
            return {
                'frais': frais,
                'commission': commission,
                'montant_rembourse': float(a.montant_rembourse),
                'hotel_recoit': round(frais - commission, 2),
                'motif': a.motif,
            }
        except Exception:
            return None

    def get_a_soumis_avis(self, obj):
        try:
            return obj.avis is not None
        except Exception:
            return False

    def get_commission_taux(self, obj):
        return 5 if obj.hotel.type_abonnement == 'pro' else 3

    commission_taux = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = ('id', 'numero', 'hotel_id', 'hotel_nom', 'hotel_ville',
                  'hotel_taux_annulation', 'hotel_taux_modification',
                  'type_chambre_id', 'type_chambre_nom',
                  'nom_client', 'prenom_client', 'email_client', 'telephone_client',
                  'date_arrivee', 'date_depart', 'nb_nuits', 'nb_adultes', 'prix_total',
                  'statut', 'avis_disponible', 'a_soumis_avis',
                  'date_creation', 'date_paiement', 'annulation_info', 'commission_taux')


class ReservationDetailSerializer(serializers.ModelSerializer):
    hotel_id = serializers.IntegerField(source='hotel.id', read_only=True)
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    hotel_ville = serializers.CharField(source='hotel.ville', read_only=True)
    type_chambre_nom = serializers.CharField(source='type_chambre.nom', read_only=True)
    nb_nuits = serializers.ReadOnlyField()
    paiement = PaiementSerializer(read_only=True)
    qrcode = QRCodeSerializer(read_only=True)

    class Meta:
        model = Reservation
        fields = ('id', 'numero', 'hotel_id', 'hotel_nom', 'hotel_ville', 'type_chambre_nom',
                  'nom_client', 'prenom_client', 'email_client', 'telephone_client',
                  'date_arrivee', 'date_depart', 'nb_nuits', 'nb_adultes', 'nb_enfants',
                  'prix_total', 'statut', 'notes', 'paiement', 'qrcode', 'date_creation')


class ReservationCreerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ('hotel', 'type_chambre', 'nom_client', 'prenom_client',
                  'email_client', 'telephone_client', 'date_arrivee', 'date_depart',
                  'nb_adultes', 'nb_enfants', 'notes')

    def validate(self, attrs):
        if attrs['date_arrivee'] < timezone.now().date():
            raise serializers.ValidationError({'date_arrivee': "La date d'arrivée ne peut pas être dans le passé."})
        if attrs['date_depart'] <= attrs['date_arrivee']:
            raise serializers.ValidationError({'date_depart': "La date de départ doit être après la date d'arrivée."})
        chambre = attrs['type_chambre']
        if chambre.hotel != attrs['hotel']:
            raise serializers.ValidationError({'type_chambre': "Cette chambre n'appartient pas à cet hôtel."})
        if not chambre.est_disponible:
            raise serializers.ValidationError({'type_chambre': "Cette chambre n'est plus disponible."})
        return attrs

    def create(self, validated_data):
        chambre = validated_data['type_chambre']
        date_arrivee = validated_data['date_arrivee']
        date_depart = validated_data['date_depart']
        nb_nuits = (date_depart - date_arrivee).days
        # Appliquer le prix promo si une promotion est active à la date d'arrivée
        from hotels.models import Promotion
        promo = Promotion.objects.filter(
            type_chambre=chambre,
            est_active=True,
            date_debut__lte=date_arrivee,
            date_fin__gte=date_arrivee,
        ).first()
        prix_nuit = promo.prix_promo if promo else chambre.prix_nuit
        validated_data['prix_total'] = prix_nuit * nb_nuits
        if self.context['request'].user.is_authenticated:
            validated_data['client'] = self.context['request'].user
        return super().create(validated_data)


class InitierPaiementSerializer(serializers.Serializer):
    methode = serializers.ChoiceField(choices=Paiement.METHODES)
    numero_telephone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['methode'] in ('mtn', 'moov') and not attrs.get('numero_telephone'):
            raise serializers.ValidationError({'numero_telephone': "Le numéro est requis pour Mobile Money."})
        return attrs


class AnnulationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annulation
        fields = ('id', 'motif', 'statut', 'montant_rembourse', 'frais_annulation',
                  'commission_plateforme', 'date_demande', 'date_traitement')
        read_only_fields = ('id', 'statut', 'date_demande')


class ModificationSerializer(serializers.Serializer):
    type_chambre_nouveau = serializers.IntegerField(required=False, allow_null=True)
    date_arrivee_nouvelle = serializers.DateField(required=False, allow_null=True)
    date_depart_nouvelle = serializers.DateField(required=False, allow_null=True)

    def validate_type_chambre_nouveau(self, value):
        if value is None:
            return None
        from hotels.models import TypeChambre
        try:
            return TypeChambre.objects.get(pk=value)
        except TypeChambre.DoesNotExist:
            raise serializers.ValidationError("Type de chambre introuvable.")

    def validate(self, attrs):
        from django.utils import timezone
        date_arrivee = attrs.get('date_arrivee_nouvelle')
        date_depart = attrs.get('date_depart_nouvelle')
        if bool(date_arrivee) != bool(date_depart):
            raise serializers.ValidationError("Les deux dates (arrivée et départ) doivent être fournies ensemble.")
        if date_arrivee and date_depart:
            if date_arrivee < timezone.now().date():
                raise serializers.ValidationError({'date_arrivee_nouvelle': "La date d'arrivée ne peut pas être dans le passé."})
            if date_depart <= date_arrivee:
                raise serializers.ValidationError({'date_depart_nouvelle': "La date de départ doit être après la date d'arrivée."})
        if not attrs.get('type_chambre_nouveau') and not date_arrivee:
            raise serializers.ValidationError("Veuillez modifier la chambre ou les dates.")
        return attrs


class ModificationDetailSerializer(serializers.ModelSerializer):
    type_chambre_ancien_nom = serializers.CharField(source='type_chambre_ancien.nom', read_only=True)
    type_chambre_nouveau_nom = serializers.CharField(source='type_chambre_nouveau.nom', read_only=True)

    class Meta:
        model = Modification
        fields = ('id', 'sens', 'type_chambre_ancien_nom', 'type_chambre_nouveau_nom',
                  'prix_ancien', 'prix_nouveau', 'difference',
                  'frais_modification', 'commission_plateforme',
                  'montant_rembourse', 'montant_supplementaire',
                  'date_demande')
