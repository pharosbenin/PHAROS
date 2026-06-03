from django.db import models
from django.conf import settings
from demandes.models import Demande


class Offre(models.Model):

    # ============================================================
    # STATUTS DE L'OFFRE
    # ============================================================
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),    # transporteur a soumis son offre
        ('acceptee', 'Acceptée'),        # commerçant a choisi ce transporteur
        ('rejetee', 'Rejetée'),          # commerçant n'a pas choisi ce transporteur
        ('annulee', 'Annulée'),          # transporteur a annulé son offre
    ]

    # ============================================================
    # RELATIONS
    # ============================================================
    # ForeignKey au lieu de OneToOneField
    # car plusieurs transporteurs peuvent soumettre une offre
    demande = models.ForeignKey(
        Demande,
        on_delete=models.CASCADE,
        related_name='offres'
    )

    transporteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='offres_soumises',
        limit_choices_to={'role__in': ['transporteur', 'societe']}
    )

    # ============================================================
    # INFORMATIONS DE L'OFFRE
    # ============================================================
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    prix_propose = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        help_text="Prix proposé par le transporteur en FCFA"
    )
    message = models.TextField(
        blank=True, null=True,
        help_text="Message du transporteur au commerçant"
    )
    delai_propose = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Délai proposé par le transporteur en jours"
    )

    # ============================================================
    # DATES
    # ============================================================
    date_soumission = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_acceptation = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_soumission']
        verbose_name = 'Offre'
        verbose_name_plural = 'Offres'
        # Un transporteur ne peut soumettre qu'une seule offre par demande
        unique_together = ['demande', 'transporteur']

    def __str__(self):
        return f"Offre {self.id} — {self.transporteur.username} → Demande {self.demande.id} ({self.statut})"