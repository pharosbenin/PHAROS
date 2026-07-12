from django.db.models import Q
from rest_framework import serializers
from reservations.models import Reservation
from .models import Avis, SignalementAvis, SignalementContenu, SignalementHotel

# Statuts qui ferment la fenêtre de signalement d'un hôtel : réservation pas encore payée,
# ou déjà terminée/annulée/remboursée — il ne reste alors plus de séjour "en cours" à signaler.
STATUTS_NON_SIGNALABLES = ('en_attente', 'terminee', 'annulee', 'remboursee')


def _est_proprietaire(reservation, user):
    """Vérifie qu'un utilisateur est bien le propriétaire d'une réservation.
    Accepte les réservations invité dont l'email correspond au compte connecté."""
    if reservation.client is not None:
        return reservation.client == user
    return reservation.email_client.lower() == user.email.lower()


def _a_reservation_active(hotel, user):
    """Vérifie que l'utilisateur a une réservation active (payée, pas encore terminée ni annulée) dans cet hôtel."""
    return Reservation.objects.filter(
        Q(client=user) | Q(client__isnull=True, email_client__iexact=user.email),
        hotel=hotel,
    ).exclude(statut__in=STATUTS_NON_SIGNALABLES).exists()


class AvisSerializer(serializers.ModelSerializer):
    client_nom = serializers.SerializerMethodField()
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)

    class Meta:
        model = Avis
        fields = ('id', 'client_nom', 'hotel', 'hotel_nom', 'note', 'commentaire', 'est_approuve',
                  'reponse_gestionnaire', 'date_reponse', 'date_avis')
        read_only_fields = ('id', 'est_approuve', 'reponse_gestionnaire', 'date_reponse', 'date_avis')

    def get_client_nom(self, obj):
        if obj.client:
            return obj.client.nom_complet
        return 'Anonyme'


class AvisCreerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avis
        fields = ('hotel', 'reservation', 'note', 'commentaire')
        extra_kwargs = {'reservation': {'required': True, 'allow_null': False}}

    def validate(self, attrs):
        request = self.context['request']
        reservation = attrs['reservation']
        if reservation.hotel != attrs['hotel']:
            raise serializers.ValidationError({'reservation': "Cette réservation ne correspond pas à cet hôtel."})
        if not _est_proprietaire(reservation, request.user):
            raise serializers.ValidationError({'reservation': "Cette réservation ne vous appartient pas."})
        if reservation.statut != 'terminee':
            raise serializers.ValidationError({'reservation': "Vous ne pouvez laisser un avis qu'après votre séjour."})
        if Avis.objects.filter(client=request.user, hotel=attrs['hotel'], reservation=reservation).exists():
            raise serializers.ValidationError("Vous avez déjà laissé un avis pour cet hôtel.")
        return attrs

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        validated_data['est_approuve'] = True
        return super().create(validated_data)


class RepondreAvisSerializer(serializers.Serializer):
    reponse = serializers.CharField()


class SignalementContenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignalementContenu
        fields = ('reservation', 'hotel', 'avis_initial', 'explication')

    def validate(self, attrs):
        request = self.context['request']
        reservation = attrs.get('reservation')
        if reservation and not _est_proprietaire(reservation, request.user):
            raise serializers.ValidationError({'reservation': "Cette réservation ne vous appartient pas."})
        return attrs

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)


class SignalementContenuAdminSerializer(serializers.ModelSerializer):
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    client_nom = serializers.SerializerMethodField()

    class Meta:
        model = SignalementContenu
        fields = ('id', 'hotel_nom', 'client_nom', 'avis_initial', 'explication', 'statut', 'date_signalement')

    def get_client_nom(self, obj):
        return obj.client.nom_complet if obj.client else 'Anonyme'


class SignalementHotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignalementHotel
        fields = ('hotel', 'motif', 'description')

    def validate_hotel(self, hotel):
        if not _a_reservation_active(hotel, self.context['request'].user):
            raise serializers.ValidationError(
                "Vous ne pouvez signaler que l'établissement d'une réservation en cours (payée et pas encore terminée)."
            )
        return hotel

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)


class SignalementHotelAdminSerializer(serializers.ModelSerializer):
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    client_nom = serializers.SerializerMethodField()
    motif_display = serializers.CharField(source='get_motif_display', read_only=True)

    class Meta:
        model = SignalementHotel
        fields = ('id', 'hotel_nom', 'client_nom', 'motif', 'motif_display', 'description', 'statut', 'date_signalement')

    def get_client_nom(self, obj):
        return obj.client.nom_complet if obj.client else 'Anonyme'


class SignalementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SignalementAvis
        fields = ('id', 'avis', 'motif', 'description', 'date_signalement')
        read_only_fields = ('id', 'date_signalement')


class SignalementDetailSerializer(serializers.ModelSerializer):
    avis_id = serializers.IntegerField(source='avis.id', read_only=True)
    avis_commentaire = serializers.CharField(source='avis.commentaire', read_only=True)
    avis_note = serializers.IntegerField(source='avis.note', read_only=True)
    avis_client_nom = serializers.SerializerMethodField()
    hotel_nom = serializers.CharField(source='avis.hotel.nom', read_only=True)
    signale_par_nom = serializers.SerializerMethodField()
    motif_display = serializers.CharField(source='get_motif_display', read_only=True)

    class Meta:
        model = SignalementAvis
        fields = ('id', 'avis_id', 'hotel_nom', 'avis_client_nom', 'avis_note', 'avis_commentaire',
                  'motif', 'motif_display', 'description', 'date_signalement', 'signale_par_nom', 'est_traite')

    def get_avis_client_nom(self, obj):
        if obj.avis.client:
            return obj.avis.client.nom_complet
        return 'Anonyme'

    def get_signale_par_nom(self, obj):
        if obj.signale_par:
            return obj.signale_par.nom_complet
        return 'Système'
