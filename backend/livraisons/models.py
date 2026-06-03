

# Create your models here.
from django.db import models
from django.conf import settings
from demandes.models import Demande


class Livraison(models.Model):

    # ============================================================
    # STATUTS DE LA LIVRAISON
    # ============================================================
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_chargement', 'En chargement'),
        ('en_transit', 'En transit'),
        ('livre', 'Livré'),
        ('litige', 'Litige'),
    ]

    # ============================================================
    # CONFIRMATION DE LIVRAISON
    # ============================================================
    CONFIRMATION_CHOICES = [
        ('dans_les_delais', 'Dans les délais'),
        ('hors_delai', 'Hors délai'),
        ('probleme_signale', 'Problème signalé'),
    ]

    # ============================================================
    # RELATIONS
    # ============================================================
    demande = models.OneToOneField(
        Demande,
        on_delete=models.CASCADE,
        related_name='livraison'
    )

    transporteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='livraisons_transporteur',
        limit_choices_to={'role__in': ['transporteur', 'societe']}
    )

    commercant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='livraisons_commercant',
        limit_choices_to={'role': 'commercant'}
    )

    # ============================================================
    # STATUT ET SUIVI
    # ============================================================
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente'
    )

    # ============================================================
    # CONFIRMATION PAR LE COMMERCANT
    # ============================================================
    confirmation = models.CharField(
        max_length=20,
        choices=CONFIRMATION_CHOICES,
        null=True, blank=True
    )
    note_confirmation = models.TextField(
        blank=True, null=True,
        help_text="Commentaire du commerçant lors de la confirmation"
    )

    # ============================================================
    # DATES
    # ============================================================
    date_creation = models.DateTimeField(auto_now_add=True)
    date_chargement = models.DateTimeField(null=True, blank=True)
    date_transit = models.DateTimeField(null=True, blank=True)
    date_livraison = models.DateTimeField(null=True, blank=True)
    date_confirmation = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Livraison'
        verbose_name_plural = 'Livraisons'

    def __str__(self):
        return f"Livraison {self.id} — Demande {self.demande.id} ({self.statut})"