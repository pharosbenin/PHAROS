from rest_framework import serializers
from .models import Demande


# ============================================================
# SERIALIZER CREATION DEMANDE (Commerçant)
# ============================================================
class CreationDemandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Demande
        fields = [
            'id',
            'type_marchandise',
            'description_marchandise',
            'tonnage',
            'ville_depart',
            'ville_destination',
            'adresse_depart',
            'adresse_destination',
            'date_depart_souhaitee',
            'delai_livraison',
            'niveau_urgence',
           
        ]

    def validate(self, data):
        # Vérifier que la ville de départ est différente de la destination
        if data['ville_depart'] == data['ville_destination']:
            raise serializers.ValidationError(
                "La ville de départ et la destination ne peuvent pas être identiques."
            )
        return data

    def create(self, validated_data):
        # Le commerçant est automatiquement l'utilisateur connecté
        request = self.context.get('request')
        validated_data['commercant'] = request.user
        validated_data['statut'] = 'publiee'
        return super().create(validated_data)


# ============================================================
# SERIALIZER LISTE DES DEMANDES (Transporteur)
# ============================================================
class ListeDemandesSerializer(serializers.ModelSerializer):
    commercant_nom = serializers.SerializerMethodField()
    ville_depart_display = serializers.CharField(source='get_ville_depart_display', read_only=True)
    ville_destination_display = serializers.CharField(source='get_ville_destination_display', read_only=True)
    type_marchandise_display = serializers.CharField(source='get_type_marchandise_display', read_only=True)
    urgence_display = serializers.CharField(source='get_niveau_urgence_display', read_only=True)

    class Meta:
        model = Demande
        fields = [
            'id',
            'commercant_nom',
            'type_marchandise',
            'type_marchandise_display',
            'tonnage',
            'ville_depart',
            'ville_depart_display',
            'ville_destination',
            'ville_destination_display',
            'date_depart_souhaitee',
            'delai_livraison',
            'niveau_urgence',
            'urgence_display',
           
            'statut',
            'date_creation',
        ]

    def get_commercant_nom(self, obj):
        return f"{obj.commercant.first_name} {obj.commercant.last_name}"


# ============================================================
# SERIALIZER DETAIL DEMANDE
# ============================================================
class DetailDemandeSerializer(serializers.ModelSerializer):
    commercant_nom = serializers.SerializerMethodField()
    transporteur_nom = serializers.SerializerMethodField()
    ville_depart_display = serializers.CharField(source='get_ville_depart_display', read_only=True)
    ville_destination_display = serializers.CharField(source='get_ville_destination_display', read_only=True)

    class Meta:
        model = Demande
        fields = '__all__'

    def get_commercant_nom(self, obj):
        return f"{obj.commercant.first_name} {obj.commercant.last_name}"

    def get_transporteur_nom(self, obj):
        if obj.transporteur:
            return f"{obj.transporteur.first_name} {obj.transporteur.last_name}"
        return None


# ============================================================
# SERIALIZER MES DEMANDES (Commerçant)
# ============================================================
class MesDemandesSerializer(serializers.ModelSerializer):
    ville_depart_display = serializers.CharField(source='get_ville_depart_display', read_only=True)
    ville_destination_display = serializers.CharField(source='get_ville_destination_display', read_only=True)
    transporteur_nom = serializers.SerializerMethodField()

    class Meta:
        model = Demande
        fields = [
            'id',
            'type_marchandise',
            'tonnage',
            'ville_depart',
            'ville_depart_display',
            'ville_destination',
            'ville_destination_display',
            'date_depart_souhaitee',
            'niveau_urgence',
            
            'statut',
            'transporteur_nom',
            'date_creation',
        ]

    def get_transporteur_nom(self, obj):
        if obj.transporteur:
            return f"{obj.transporteur.first_name} {obj.transporteur.last_name}"
        return None