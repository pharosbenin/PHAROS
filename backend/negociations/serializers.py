from rest_framework import serializers
from .models import Negociation, MessageNegociation


class MessageNegociationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MessageNegociation
        fields = [
            'id',
            'auteur_type',
            'action',
            'montant',
            'message',
            'date_envoi',
        ]


class NegociationSerializer(serializers.ModelSerializer):
    messages         = MessageNegociationSerializer(many=True, read_only=True)
    # Infos utiles pour le frontend sans qu'il fasse d'appels supplémentaires
    prix_initial     = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    nom_transporteur = serializers.SerializerMethodField()
    nom_commercant   = serializers.SerializerMethodField()
    demande_id       = serializers.SerializerMethodField()
    trajet           = serializers.SerializerMethodField()

    class Meta:
        model  = Negociation
        fields = [
            'id',
            'statut',
            'prix_initial',
            'prix_transporteur',
            'prix_commercant',
            'prix_final_convenu',
            'nom_transporteur',
            'nom_commercant',
            'demande_id',
            'trajet',
            'date_creation',
            'date_modification',
            'messages',
        ]
        read_only_fields = [
            'statut',
            'prix_final_convenu',
            'date_creation',
            'date_modification',
        ]

    def get_nom_transporteur(self, obj):
        u = obj.offre.transporteur
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_nom_commercant(self, obj):
        u = obj.offre.demande.commercant
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_demande_id(self, obj):
        return obj.offre.demande.id

    def get_trajet(self, obj):
        d = obj.offre.demande
        return f"{d.ville_depart} → {d.ville_destination}"