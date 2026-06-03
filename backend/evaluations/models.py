
# Create your models here.
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from demandes.models import Demande


class Evaluation(models.Model):

    # ============================================================
    # RELATIONS
    # ============================================================
    demande = models.OneToOneField(
        Demande,
        on_delete=models.CASCADE,
        related_name='evaluation'
    )

    # Qui évalue
    commercant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evaluations_donnees',
        limit_choices_to={'role': 'commercant'}
    )

    # Qui est évalué
    transporteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='evaluations_recues',
        limit_choices_to={'role__in': ['transporteur', 'societe']}
    )

    # ============================================================
    # NOTE ET COMMENTAIRE
    # ============================================================
    note = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Note de 1 à 5 étoiles"
    )
    commentaire = models.TextField(
        blank=True, null=True,
        help_text="Commentaire visible sur le profil public du transporteur"
    )

    # ============================================================
    # CRITERES D'EVALUATION
    # ============================================================
    ponctualite = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True,
        help_text="Note de ponctualité de 1 à 5"
    )
    qualite_service = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True,
        help_text="Note de qualité de service de 1 à 5"
    )
    communication = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True,
        help_text="Note de communication de 1 à 5"
    )

    # ============================================================
    # DATES
    # ============================================================
    date_evaluation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_evaluation']
        verbose_name = 'Évaluation'
        verbose_name_plural = 'Évaluations'

    def __str__(self):
        return f"Évaluation {self.id} — {self.commercant.username} → {self.transporteur.username} ({self.note}⭐)"