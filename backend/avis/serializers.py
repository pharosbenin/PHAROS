from rest_framework import serializers
from .models import Avis, SignalementAvis


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

    def validate(self, attrs):
        request = self.context['request']
        reservation = attrs.get('reservation')
        if reservation:
            if reservation.hotel != attrs['hotel']:
                raise serializers.ValidationError({'reservation': "Cette réservation ne correspond pas à cet hôtel."})
            if reservation.client != request.user:
                raise serializers.ValidationError({'reservation': "Cette réservation ne vous appartient pas."})
            if reservation.statut != 'terminee':
                raise serializers.ValidationError({'reservation': "Vous ne pouvez laisser un avis qu'après votre séjour."})
        if Avis.objects.filter(client=request.user, hotel=attrs['hotel'], reservation=reservation).exists():
            raise serializers.ValidationError("Vous avez déjà laissé un avis pour cet hôtel.")
        return attrs

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)


class RepondreAvisSerializer(serializers.Serializer):
    reponse = serializers.CharField()


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
