from django.db import models
from django.conf import settings
from demandes.models import Demande


class Paiement(models.Model):

    # ============================================================
    # STATUTS DU PAIEMENT
    # ============================================================
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('bloque',     'Bloqué (Escrow)'),
        ('libere',     'Libéré'),
        ('rembourse',  'Remboursé'),
        ('echoue',     'Échoué'),
    ]

    # ============================================================
    # OPERATEURS MOBILE MONEY
    # ============================================================
    OPERATEUR_CHOICES = [
        ('mtn',  'MTN MoMo'),
        ('moov', 'Moov Money'),
    ]

    # ============================================================
    # RELATIONS
    # ============================================================
    demande = models.OneToOneField(
        Demande,
        on_delete=models.CASCADE,
        related_name='paiement'
    )
    commercant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='paiements_effectues',
        limit_choices_to={'role': 'commercant'}
    )
    transporteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='paiements_recus',
        limit_choices_to={'role__in': ['transporteur', 'societe']}
    )

    # ============================================================
    # INFORMATIONS DU PAIEMENT
    # ============================================================
    montant = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Montant en FCFA"
    )
    operateur = models.CharField(
        max_length=10,
        choices=OPERATEUR_CHOICES
    )
    numero_telephone = models.CharField(
        max_length=20,
        help_text="Numéro Mobile Money du commerçant"
    )
    reference_transaction = models.CharField(
        max_length=100,
        blank=True, null=True,
        help_text="Référence de la transaction Mobile Money"
    )

    # ============================================================
    # STATUT ET ESCROW
    # ============================================================
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='en_attente'
    )
    motif_remboursement = models.TextField(
        blank=True, null=True,
        help_text="Motif du remboursement en cas de litige"
    )

    # ============================================================
    # DATES
    # ============================================================
    date_creation      = models.DateTimeField(auto_now_add=True)
    date_blocage       = models.DateTimeField(null=True, blank=True)
    date_liberation    = models.DateTimeField(null=True, blank=True)
    date_remboursement = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'

    def __str__(self):
        return f"Paiement {self.id} — {self.montant} FCFA ({self.statut})"