from rest_framework import serializers

from .models import CategorieService, ServiceProximite


class CategorieServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieService
        fields = ('id', 'code', 'nom', 'icone', 'ordre')


class ServiceProximiteSerializer(serializers.ModelSerializer):
    # distance_km est attaché dynamiquement à l'instance par la vue (pas un champ du modèle),
    # au même principe que _distance_km dans hotels/views.py pour le tri des hôtels.
    distance_km = serializers.FloatField(read_only=True)
    itineraire_url = serializers.SerializerMethodField()

    class Meta:
        model = ServiceProximite
        fields = ('id', 'nom', 'adresse', 'ville', 'horaires', 'distance_km', 'itineraire_url')

    def get_itineraire_url(self, obj):
        return f'https://www.google.com/maps/dir/?api=1&destination={obj.latitude},{obj.longitude}'
