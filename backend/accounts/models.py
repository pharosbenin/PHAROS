from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):

    # ============================================================
    # ROLES
    # ============================================================
    ROLE_CHOICES = [
        ('commercant', 'Commerçant / Expéditeur'),
        ('societe', 'Société de transport'),
        ('transporteur', 'Transporteur indépendant'),
        ('admin', 'Administrateur'),
    ]

    # ============================================================
    # STATUTS
    # ============================================================
    STATUT_CHOICES = [
        ('en_attente', 'En attente de validation'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
        ('suspendu', 'Suspendu'),
    ]

    # ============================================================
    # CHAMPS COMMUNS A TOUS
    # ============================================================
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    telephone = models.CharField(max_length=20, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    adresse = models.CharField(max_length=255, blank=True, null=True)
    ville = models.CharField(max_length=100, blank=True, null=True)
    quartier = models.CharField(max_length=100, blank=True, null=True)

    # ============================================================
    # CHAMPS COMMERCANT
    # ============================================================
    ifu = models.CharField(max_length=100, blank=True, null=True)
    rccm = models.CharField(max_length=100, blank=True, null=True)  # optionnel
    document_ifu = models.FileField(upload_to='documents/ifu/', blank=True, null=True)
    photo_identite = models.FileField(upload_to='documents/identite/', blank=True, null=True)  # optionnel

    # ============================================================
    # CHAMPS SOCIETE DE TRANSPORT
    # ============================================================
    nom_societe = models.CharField(max_length=200, blank=True, null=True)
    nom_responsable = models.CharField(max_length=200, blank=True, null=True)
    nombre_camions = models.PositiveIntegerField(blank=True, null=True)
    type_camion_principal = models.CharField(max_length=100, blank=True, null=True)
    corridors_couverts = models.TextField(blank=True, null=True)
    carte_transporteur = models.FileField(upload_to='documents/carte_transporteur/', blank=True, null=True)
    assurance = models.FileField(upload_to='documents/assurance/', blank=True, null=True)

    # ============================================================
    # CHAMPS TRANSPORTEUR INDEPENDANT
    # ============================================================
    type_vehicule = models.CharField(max_length=100, blank=True, null=True)
    numero_immatriculation = models.CharField(max_length=50, blank=True, null=True)
    capacite_chargement = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
    numero_permis = models.CharField(max_length=100, blank=True, null=True)
    assurance_vehicule = models.FileField(upload_to='documents/assurance/', blank=True, null=True)
    photo_permis = models.FileField(upload_to='documents/permis/', blank=True, null=True)
    photo_vehicule = models.FileField(upload_to='documents/vehicules/', blank=True, null=True)

    # ============================================================
    # DATES
    # ============================================================
    date_inscription = models.DateTimeField(auto_now_add=True)
    date_validation = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"