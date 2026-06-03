from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from offres.models import Offre


class Negociation(models.Model):

    # ============================================================
    # STATUTS
    # ============================================================
    STATUT_CHOICES = [
        ('en_cours',  'En cours'),
        ('acceptee',  'Acceptée'),
        ('refusee',   'Refusée'),
    ]

    # ============================================================
    # RELATIONS
    # ============================================================
    # On part de l'Offre car la négociation concerne
    # une offre précise d'un transporteur précis
    offre = models.OneToOneField(
        Offre,
        on_delete=models.CASCADE,
        related_name='negociation'
    )

    # ============================================================
    # PRIX
    # ============================================================
    # Prix affiché "Proposition initiale" → vient de offre.prix_propose
    prix_initial = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        help_text="Copié depuis offre.prix_propose au démarrage"
    )
    # Champ "Votre prix final (Transporteur)"
    prix_transporteur = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True
    )
    # Champ "Proposition du commerçant"
    prix_commercant = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True
    )
    # Prix final après accord
    prix_final_convenu = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True
    )

    # ============================================================
    # STATUT ET DATES
    # ============================================================
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_cours'
    )
    date_creation  = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Négociation'
        verbose_name_plural = 'Négociations'

    def __str__(self):
        return (
            f"Négociation #{self.id} — "
            f"Offre #{self.offre.id} — "
            f"{self.statut}"
        )


class MessageNegociation(models.Model):

    # ============================================================
    # CHOIX
    # ============================================================
    AUTEUR_CHOICES = [
        ('transporteur', 'Transporteur'),
        ('commercant',   'Commerçant'),
    ]
    ACTION_CHOICES = [
        ('proposition', 'Proposition de prix'),
        ('acceptation', 'Acceptation'),
        ('refus',       'Refus'),
    ]

    # ============================================================
    # RELATIONS
    # ============================================================
    negociation = models.ForeignKey(
        Negociation,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    # ============================================================
    # CONTENU
    # ============================================================
    auteur_type = models.CharField(max_length=20, choices=AUTEUR_CHOICES)
    action      = models.CharField(max_length=20, choices=ACTION_CHOICES)
    montant     = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True
    )
    message     = models.TextField(blank=True)
    date_envoi  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date_envoi']  # historique chronologique
        verbose_name = 'Message de négociation'
        verbose_name_plural = 'Messages de négociation'

    def __str__(self):
        return (
            f"{self.auteur_type} | "
            f"{self.action} | "
            f"{self.montant} FCFA"
        )