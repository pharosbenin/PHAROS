from django.contrib.auth.models import AbstractUser
from django.db import models


class Notification(models.Model):
    TYPES = [
        ('annulation', 'Annulation'),
        ('modification', 'Modification'),
        ('info', 'Information'),
    ]

    destinataire = models.ForeignKey(
        'accounts.CustomUser', on_delete=models.CASCADE, related_name='notifications'
    )
    type = models.CharField(max_length=20, choices=TYPES, default='info')
    titre = models.CharField(max_length=200)
    message = models.TextField()
    lu = models.BooleanField(default=False)
    reservation_numero = models.CharField(max_length=100, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Notification'

    def __str__(self):
        return f"{self.titre} → {self.destinataire}"


class MessageContact(models.Model):
    TYPES_PROFIL = [
        ('client', 'Client / Voyageur'),
        ('hotelier', 'Hôtelier / Gestionnaire'),
        ('partenaire', 'Partenaire commercial'),
        ('autre', 'Autre'),
    ]
    URGENCES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('critique', 'Critique'),
    ]
    SUJETS = [
        ('reservation', 'Problème de réservation'),
        ('paiement', 'Question de paiement'),
        ('compte', 'Mon compte / connexion'),
        ('hotel', "Signalement d'un hôtel"),
        ('technique', 'Problème technique'),
        ('partenariat', 'Partenariat'),
        ('autre', 'Autre'),
    ]

    nom = models.CharField(max_length=100)
    email = models.EmailField()
    telephone = models.CharField(max_length=20, blank=True)
    type_profil = models.CharField(max_length=20, choices=TYPES_PROFIL)
    sujet = models.CharField(max_length=20, choices=SUJETS)
    urgence = models.CharField(max_length=20, choices=URGENCES, default='normal')
    message = models.TextField()
    lu = models.BooleanField(default=False)
    date_envoi = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_envoi']
        verbose_name = 'Message de contact'

    def __str__(self):
        return f"{self.nom} - {self.sujet}"


class OTPVerification(models.Model):
    telephone = models.CharField(max_length=20)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'OTP Vérification'

    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and timezone.now() < self.expires_at

    def __str__(self):
        return f"OTP {self.telephone} - {'utilisé' if self.is_used else 'actif'}"


class CustomUser(AbstractUser):
    ROLES = [
        ('client', 'Client'),
        ('gestionnaire', 'Gestionnaire Hôtelier'),
        ('admin', 'Administrateur'),
    ]
    role = models.CharField(max_length=20, choices=ROLES, default='client')
    telephone = models.CharField(max_length=15, blank=True)
    photo_profil = models.ImageField(upload_to='profiles/', null=True, blank=True)
    est_suspendu = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def nom_complet(self):
        return self.get_full_name() or self.username
