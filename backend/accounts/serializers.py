from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password2',
                  'role', 'telephone')
        extra_kwargs = {
            'email': {'required': True},
            'telephone': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        if attrs.get('role') == 'admin':
            raise serializers.ValidationError({"role": "Vous ne pouvez pas créer un compte administrateur."})
        return attrs

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class ProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'telephone', 'photo_profil', 'est_suspendu', 'date_joined')
        read_only_fields = ('id', 'role', 'est_suspendu', 'date_joined')


class ModifierProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'telephone', 'photo_profil')


class ChangerMotDePasseSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True, validators=[validate_password])
    confirmer_mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['nouveau_mot_de_passe'] != attrs['confirmer_mot_de_passe']:
            raise serializers.ValidationError({"nouveau_mot_de_passe": "Les mots de passe ne correspondent pas."})
        return attrs


class UtilisateurAdminSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()
    hotel_nom = serializers.SerializerMethodField()
    type_abonnement = serializers.SerializerMethodField()
    statut = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'nom_complet',
                  'role', 'telephone', 'est_suspendu', 'is_active', 'date_joined',
                  'hotel_nom', 'type_abonnement', 'statut')
        read_only_fields = ('id', 'date_joined')

    def get_nom_complet(self, obj):
        return obj.nom_complet

    def get_hotel_nom(self, obj):
        if obj.role == 'gestionnaire':
            from hotels.models import Hotel
            hotel = Hotel.objects.filter(gestionnaire=obj).first()
            return hotel.nom if hotel else None
        return None

    def get_type_abonnement(self, obj):
        if obj.role == 'gestionnaire':
            from hotels.models import Hotel
            hotel = Hotel.objects.filter(gestionnaire=obj).first()
            return hotel.type_abonnement if hotel else None
        return None

    def get_statut(self, obj):
        return 'suspendu' if obj.est_suspendu else 'actif'
