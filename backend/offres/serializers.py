from rest_framework import serializers
from django.db.models import Avg
from .models import Offre


# ============================================================
# SERIALIZER DETAIL OFFRE
# ============================================================
class DetailOffreSerializer(serializers.ModelSerializer):
    transporteur_nom = serializers.SerializerMethodField()
    transporteur_note = serializers.SerializerMethodField()
    transporteur_stats = serializers.SerializerMethodField()
    demande_info = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Offre
        fields = [
            'id',
            'demande',
            'demande_info',
            'transporteur',
            'transporteur_nom',
            'transporteur_note',
            'transporteur_stats',
            'statut',
            'statut_display',
            'prix_propose',
            'delai_propose',
            'message',
            'date_soumission',
            'date_acceptation',
        ]

    def get_transporteur_nom(self, obj):
        if obj.transporteur.role == 'societe':
            return obj.transporteur.nom_societe or obj.transporteur.username
        return f"{obj.transporteur.first_name} {obj.transporteur.last_name}"

    def get_transporteur_note(self, obj):
        from evaluations.models import Evaluation
        stats = Evaluation.objects.filter(
            transporteur=obj.transporteur
        ).aggregate(note_moyenne=Avg('note'))
        return round(stats['note_moyenne'] or 0, 2)

    def get_transporteur_stats(self, obj):
        # Statistiques du transporteur pour aider le commerçant à choisir
        from demandes.models import Demande as DemandeModel
        total = DemandeModel.objects.filter(
            transporteur=obj.transporteur,
            statut__in=['livree', 'litige']
        ).count()
        reussies = DemandeModel.objects.filter(
            transporteur=obj.transporteur,
            statut='livree'
        ).count()
        taux = round((reussies / total * 100), 2) if total > 0 else 0
        return {
            "nombre_missions": reussies,
            "taux_reussite": taux,
        }

    def get_demande_info(self, obj):
        return {
            "id": obj.demande.id,
            "ville_depart": obj.demande.ville_depart,
            "ville_destination": obj.demande.ville_destination,
            "tonnage": str(obj.demande.tonnage),
            "type_marchandise": obj.demande.type_marchandise,
            "statut": obj.demande.statut,
        }


# ============================================================
# SERIALIZER MES OFFRES (Transporteur)
# ============================================================
class MesOffresSerializer(serializers.ModelSerializer):
    demande_info = serializers.SerializerMethodField()
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    transporteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Offre
        fields = [
            'id',
            'demande_info',
            'transporteur_nom',
            'statut',
            'statut_display',
            'prix_propose',
            'delai_propose',
            'message',
            'date_soumission',
            'date_acceptation',
        ]

    def get_transporteur_nom(self, obj):
        if obj.transporteur.role == 'societe':
            return obj.transporteur.nom_societe or obj.transporteur.username
        return f"{obj.transporteur.first_name} {obj.transporteur.last_name}"

    def get_demande_info(self, obj):
        return {
            "id": obj.demande.id,
            "ville_depart": obj.demande.ville_depart,
            "ville_destination": obj.demande.ville_destination,
            "tonnage": str(obj.demande.tonnage),
            "type_marchandise": obj.demande.type_marchandise,
            "statut": obj.demande.statut,
        }