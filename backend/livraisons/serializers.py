from rest_framework import serializers
from .models import Livraison


# ============================================================
# SERIALIZER DETAIL LIVRAISON
# ============================================================
class DetailLivraisonSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    confirmation_display = serializers.CharField(source='get_confirmation_display', read_only=True)
    transporteur_nom = serializers.SerializerMethodField()
    commercant_nom = serializers.SerializerMethodField()
    demande_info = serializers.SerializerMethodField()

    class Meta:
        model = Livraison
        fields = [
            'id',
            'demande',
            'demande_info',
            'transporteur',
            'transporteur_nom',
            'commercant',
            'commercant_nom',
            'statut',
            'statut_display',
            'confirmation',
            'confirmation_display',
            'note_confirmation',
            'date_creation',
            'date_chargement',
            'date_transit',
            'date_livraison',
            'date_confirmation',
        ]

    def get_transporteur_nom(self, obj):
        return f"{obj.transporteur.first_name} {obj.transporteur.last_name}"

    def get_commercant_nom(self, obj):
        return f"{obj.commercant.first_name} {obj.commercant.last_name}"

    def get_demande_info(self, obj):
        return {
            "id": obj.demande.id,
            "ville_depart": obj.demande.ville_depart,
            "ville_destination": obj.demande.ville_destination,
            "tonnage": str(obj.demande.tonnage),
            "type_marchandise": obj.demande.type_marchandise,
        }


# ============================================================
# SERIALIZER MISE A JOUR STATUT (Transporteur)
# ============================================================
class MiseAJourStatutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Livraison
        fields = ['statut']

    def validate_statut(self, value):
        instance = self.instance
        # Ordre des statuts
        ordre = ['en_attente', 'en_chargement', 'en_transit', 'livre', 'litige']

        if value == 'litige':
            return value

        idx_actuel = ordre.index(instance.statut)
        idx_nouveau = ordre.index(value)

        if idx_nouveau <= idx_actuel:
            raise serializers.ValidationError(
                "Vous ne pouvez pas revenir à un statut précédent."
            )
        return value


# ============================================================
# SERIALIZER CONFIRMATION LIVRAISON (Commerçant)
# ============================================================
class ConfirmationLivraisonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Livraison
        fields = ['confirmation', 'note_confirmation']

    def validate_confirmation(self, value):
        if value not in ['dans_les_delais', 'hors_delai', 'probleme_signale']:
            raise serializers.ValidationError("Confirmation invalide.")
        return value