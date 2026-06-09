from rest_framework import serializers
from django.utils import timezone
from .models import Reservation, Paiement, QRCodeReservation, Annulation


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
    type_chambre_nom = serializers.CharField(source='type_chambre.nom', read_only=True)
    nb_nuits = serializers.ReadOnlyField()
    nb_adultes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Reservation
        fields = ('id', 'numero', 'hotel_id', 'hotel_nom', 'hotel_ville', 'type_chambre_nom',
                  'nom_client', 'prenom_client', 'email_client', 'telephone_client',
                  'date_arrivee', 'date_depart', 'nb_nuits', 'nb_adultes', 'prix_total',
                  'statut', 'date_creation')


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
        validated_data['prix_total'] = chambre.prix_nuit * nb_nuits
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
        fields = ('id', 'motif', 'statut', 'montant_rembourse', 'date_demande', 'date_traitement')
        read_only_fields = ('id', 'statut', 'montant_rembourse', 'date_demande', 'date_traitement')
