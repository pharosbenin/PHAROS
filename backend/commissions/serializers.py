from rest_framework import serializers
from .models import Abonnement, Commission, DemandeUpgradePro


class AbonnementSerializer(serializers.ModelSerializer):
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    type_display = serializers.CharField(source='get_type_abonnement_display', read_only=True)

    class Meta:
        model = Abonnement
        fields = ('id', 'hotel', 'hotel_nom', 'type_abonnement', 'type_display',
                  'taux_commission', 'date_debut', 'date_fin', 'statut',
                  'montant_paye', 'date_creation')
        read_only_fields = ('id', 'taux_commission', 'date_creation')


class CommissionSerializer(serializers.ModelSerializer):
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    reservation_numero = serializers.CharField(source='paiement.reservation.numero', read_only=True)

    class Meta:
        model = Commission
        fields = ('id', 'hotel_nom', 'reservation_numero', 'montant_brut', 'taux',
                  'montant_commission', 'montant_hotel', 'statut', 'date_calcul', 'date_versement')


class DemandeUpgradeProSerializer(serializers.ModelSerializer):
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    hotel_ville = serializers.CharField(source='hotel.ville', read_only=True)
    gestionnaire_nom = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    traite_par_nom = serializers.SerializerMethodField()

    class Meta:
        model = DemandeUpgradePro
        fields = ('id', 'hotel', 'hotel_nom', 'hotel_ville', 'gestionnaire_nom',
                  'statut', 'statut_display', 'date_demande', 'date_traitement',
                  'traite_par_nom', 'message_admin')
        read_only_fields = fields

    def get_gestionnaire_nom(self, obj):
        g = obj.hotel.gestionnaire
        return f"{g.first_name} {g.last_name}".strip() or g.email

    def get_traite_par_nom(self, obj):
        if not obj.traite_par:
            return None
        u = obj.traite_par
        return f"{u.first_name} {u.last_name}".strip() or u.email
