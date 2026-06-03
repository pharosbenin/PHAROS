from rest_framework import serializers
from .models import Evaluation


# ============================================================
# SERIALIZER CREATION EVALUATION (Commerçant)
# ============================================================
class CreationEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = [
            'demande',
            'note',
            'commentaire',
            'ponctualite',
            'qualite_service',
            'communication',
        ]

    def validate_note(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("La note doit être entre 1 et 5.")
        return value

    def validate(self, data):
        demande = data.get('demande')
        request = self.context.get('request')

        # Vérifier que la demande appartient au commerçant
        if demande.commercant != request.user:
            raise serializers.ValidationError(
                "Vous ne pouvez évaluer que vos propres demandes."
            )

        # Vérifier que la demande est livrée
        if demande.statut != 'livree':
            raise serializers.ValidationError(
                "Vous ne pouvez évaluer qu'une livraison confirmée."
            )

        # Vérifier qu'une évaluation n'existe pas déjà
        if Evaluation.objects.filter(demande=demande).exists():
            raise serializers.ValidationError(
                "Vous avez déjà évalué cette livraison."
            )

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        demande = validated_data['demande']
        validated_data['commercant'] = request.user
        validated_data['transporteur'] = demande.transporteur
        return super().create(validated_data)


# ============================================================
# SERIALIZER DETAIL EVALUATION
# ============================================================
class DetailEvaluationSerializer(serializers.ModelSerializer):
    commercant_nom = serializers.SerializerMethodField()
    transporteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Evaluation
        fields = [
            'id',
            'demande',
            'commercant',
            'commercant_nom',
            'transporteur',
            'transporteur_nom',
            'note',
            'commentaire',
            'ponctualite',
            'qualite_service',
            'communication',
            'date_evaluation',
        ]

    def get_commercant_nom(self, obj):
        return f"{obj.commercant.first_name} {obj.commercant.last_name}"

    def get_transporteur_nom(self, obj):
        if obj.transporteur.role == 'societe':
            return obj.transporteur.nom_societe or obj.transporteur.username
        return f"{obj.transporteur.first_name} {obj.transporteur.last_name}"


# ============================================================
# SERIALIZER STATISTIQUES TRANSPORTEUR
# ============================================================
class StatistiquesTransporteurSerializer(serializers.Serializer):
    transporteur_id = serializers.IntegerField()
    transporteur_nom = serializers.CharField()
    note_moyenne = serializers.FloatField()
    nombre_evaluations = serializers.IntegerField()
    nombre_livraisons = serializers.IntegerField()
    taux_reussite = serializers.FloatField()
    evaluations = DetailEvaluationSerializer(many=True)