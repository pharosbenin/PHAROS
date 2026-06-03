from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser


# ============================================================
# SERIALIZER INSCRIPTION COMMERCANT
# ============================================================
class InscriptionCommercantSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'first_name', 'last_name',
            'telephone', 'email',
            'ifu', 'rccm',
            'adresse', 'ville', 'quartier',
            'document_ifu', 'photo_identite',
            'password', 'password2',
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.role = 'commercant'
        user.statut = 'en_attente'
        user.set_password(password)
        user.save()
        return user


# ============================================================
# SERIALIZER INSCRIPTION SOCIETE DE TRANSPORT
# ============================================================
class InscriptionSocieteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'nom_societe', 'nom_responsable',
            'telephone', 'email',
            'ville', 'quartier',
            'ifu', 'rccm',
            'carte_transporteur', 'assurance',
            'nombre_camions', 'type_camion_principal', 'corridors_couverts',
            'password', 'password2',
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.role = 'societe'
        user.statut = 'en_attente'
        user.set_password(password)
        user.save()
        return user


# ============================================================
# SERIALIZER INSCRIPTION TRANSPORTEUR INDEPENDANT
# ============================================================
class InscriptionTransporteurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'first_name', 'last_name',
            'telephone', 'email',
            'type_vehicule', 'numero_immatriculation',
            'capacite_chargement', 'numero_permis',
            'assurance_vehicule', 'photo_permis', 'photo_vehicule',
            'adresse', 'ville', 'quartier',
            'password', 'password2',
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.role = 'transporteur'
        user.statut = 'en_attente'
        user.set_password(password)
        user.save()
        return user


# ============================================================
# SERIALIZER CONNEXION
# ============================================================
class ConnexionSerializer(serializers.Serializer):
    identifiant = serializers.CharField()
    password = serializers.CharField(write_only=True)


# ============================================================
# SERIALIZER PROFIL UTILISATEUR
# ============================================================
class ProfilUtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'telephone', 'statut', 'ville', 'quartier',
            'adresse', 'date_inscription'
        ]
        read_only_fields = ['role', 'statut', 'date_inscription']


# ============================================================
# SERIALIZER PROFIL PUBLIC TRANSPORTEUR
# ============================================================
class ProfilPublicTransporteurSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'role', 'statut', 'ville',
            'type_vehicule', 'capacite_chargement',
            'nom_societe', 'nombre_camions',
            'corridors_couverts', 'date_inscription'
        ]


# ============================================================
# SERIALIZER VALIDATION COMPTE (ADMIN)
# ============================================================
class ValidationCompteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'statut', 'telephone', 'ville', 'quartier',
            # Commerçant
            'ifu', 'rccm', 'document_ifu', 'photo_identite',
            # Société
            'nom_societe', 'nom_responsable', 'nombre_camions',
            'type_camion_principal', 'corridors_couverts',
            'carte_transporteur', 'assurance',
            # Transporteur
            'type_vehicule', 'numero_immatriculation', 'capacite_chargement',
            'numero_permis', 'assurance_vehicule', 'photo_permis', 'photo_vehicule',
            # Dates
            'date_inscription',
        ]

    def update(self, instance, validated_data):
        instance.statut = validated_data.get('statut', instance.statut)
        instance.save()
        return instance