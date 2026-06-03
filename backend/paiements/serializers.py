from rest_framework import serializers
from .models import Paiement


class CreationPaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Paiement
        fields = [
            'demande',
            'montant',
            'operateur',
            'numero_telephone',
        ]
        # Montant devient optionnel car on le récupère depuis la négociation
        extra_kwargs = {
            'montant': {'required': False}
        }

    def validate(self, data):
        demande = data.get('demande')
        request = self.context.get('request')

        # Vérifier que la demande appartient au commerçant
        if demande.commercant != request.user:
            raise serializers.ValidationError(
                "Vous ne pouvez payer que vos propres demandes."
            )

        # Vérifier que la demande est attribuée
        if demande.statut not in ['attribuee', 'en_transit']:
            raise serializers.ValidationError(
                "Le paiement ne peut être effectué que pour une demande attribuée."
            )

        # Vérifier qu'un paiement n'existe pas déjà
        if Paiement.objects.filter(demande=demande).exists():
            raise serializers.ValidationError(
                "Un paiement existe déjà pour cette demande."
            )

        # Récupérer le prix depuis la négociation automatiquement
        try:
            offre       = demande.offres.filter(statut='acceptee').first()
            negociation = offre.negociation if offre else None
            if negociation and negociation.prix_final_convenu:
                data['montant'] = negociation.prix_final_convenu
        except Exception:
            pass  # Si pas de négociation, le commerçant saisit le montant manuellement

        # Vérifier que le montant est bien défini à la fin
        if not data.get('montant'):
            raise serializers.ValidationError(
                "Le montant est obligatoire si aucune négociation n'est trouvée."
            )

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        demande = validated_data['demande']
        validated_data['commercant']  = request.user
        validated_data['transporteur'] = demande.transporteur
        validated_data['statut']       = 'bloque'
        return super().create(validated_data)


class DetailPaiementSerializer(serializers.ModelSerializer):
    commercant_nom   = serializers.SerializerMethodField()
    transporteur_nom = serializers.SerializerMethodField()
    statut_display   = serializers.CharField(
        source='get_statut_display', read_only=True
    )
    operateur_display = serializers.CharField(
        source='get_operateur_display', read_only=True
    )
    demande_info = serializers.SerializerMethodField()

    class Meta:
        model  = Paiement
        fields = [
            'id',
            'demande',
            'demande_info',
            'commercant',
            'commercant_nom',
            'transporteur',
            'transporteur_nom',
            'montant',
            'operateur',
            'operateur_display',
            'numero_telephone',
            'reference_transaction',
            'statut',
            'statut_display',
            'motif_remboursement',
            'date_creation',
            'date_blocage',
            'date_liberation',
            'date_remboursement',
        ]

    def get_commercant_nom(self, obj):
        return f"{obj.commercant.first_name} {obj.commercant.last_name}"

    def get_transporteur_nom(self, obj):
        if obj.transporteur.role == 'societe':
            return obj.transporteur.nom_societe or obj.transporteur.username
        return f"{obj.transporteur.first_name} {obj.transporteur.last_name}"

    def get_demande_info(self, obj):
        return {
            "id":               obj.demande.id,
            "ville_depart":     obj.demande.ville_depart,
            "ville_destination": obj.demande.ville_destination,
            "statut":           obj.demande.statut,
        }