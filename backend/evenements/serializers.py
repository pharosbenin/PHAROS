from rest_framework import serializers
from .models import EvenementNational, MiseEnAvantHotel, PointInteret


class EvenementSerializer(serializers.ModelSerializer):
    est_en_cours = serializers.ReadOnlyField()
    est_a_venir = serializers.ReadOnlyField()

    class Meta:
        model = EvenementNational
        fields = ('id', 'nom', 'description', 'categorie', 'date_debut', 'date_fin',
                  'region', 'villes_concernees', 'est_actif', 'image',
                  'latitude', 'longitude',
                  'est_en_cours', 'est_a_venir', 'date_creation')
        read_only_fields = ('id', 'date_creation')


class MiseEnAvantSerializer(serializers.ModelSerializer):
    hotel_nom = serializers.CharField(source='hotel.nom', read_only=True)
    evenement_nom = serializers.CharField(source='evenement.nom', read_only=True)

    class Meta:
        model = MiseEnAvantHotel
        fields = ('id', 'evenement', 'evenement_nom', 'hotel', 'hotel_nom',
                  'position_boost', 'date_boost_debut', 'date_boost_fin', 'est_actif')


class PointInteretSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointInteret
        fields = ('id', 'nom', 'ville', 'description', 'categorie',
                  'latitude', 'longitude', 'photo', 'actif')
