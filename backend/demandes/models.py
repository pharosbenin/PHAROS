from django.db import models
from django.conf import settings


class Demande(models.Model):

    # ============================================================
    # STATUTS DE LA DEMANDE
    # ============================================================
    STATUT_CHOICES = [
        ('publiee', 'Publiée'),
        ('en_negociation', 'En négociation'),
        ('en_selection', 'En cours de sélection'),  # cas simultané
        ('en_attribution', 'En cours d\'attribution'),
        ('attribuee', 'Attribuée'),
        ('en_transit', 'En transit'),
        ('livree', 'Livrée'),
        ('litige', 'Litige'),
    ]

    # ============================================================
    # NIVEAUX D'URGENCE
    # ============================================================
    URGENCE_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('tres_urgent', 'Très urgent'),
    ]

    # ============================================================
    # TYPES DE MARCHANDISE
    # ============================================================
    TYPE_MARCHANDISE_CHOICES = [
        ('alimentaire', 'Alimentaire'),
        ('electronique', 'Électronique'),
        ('textile', 'Textile'),
        ('construction', 'Matériaux de construction'),
        ('chimique', 'Produits chimiques'),
        ('agricole', 'Produits agricoles'),
        ('autre', 'Autre'),
    ]

    # ============================================================
    # VILLES COUVERTES AU BENIN ET REGION
    # ============================================================
    VILLE_CHOICES = [
        ('cotonou', 'Cotonou'),
        ('porto_novo', 'Porto-Novo'),
        ('parakou', 'Parakou'),
        ('bohicon', 'Bohicon'),
        ('abomey_calavi', 'Abomey-Calavi'),
        ('natitingou', 'Natitingou'),
        ('malanville', 'Malanville'),
        ('lome', 'Lomé (Togo)'),
        ('lagos', 'Lagos (Nigeria)'),
    ]

    # ============================================================
    # RELATIONS
    # ============================================================
    commercant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='demandes',
        limit_choices_to={'role': 'commercant'}
    )

    transporteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='missions',
        limit_choices_to={'role__in': ['transporteur', 'societe']}
    )

    # ============================================================
    # INFORMATIONS SUR LA MARCHANDISE
    # ============================================================
    type_marchandise = models.CharField(max_length=50, choices=TYPE_MARCHANDISE_CHOICES)
    description_marchandise = models.TextField(blank=True)
    tonnage = models.DecimalField(max_digits=8, decimal_places=2)

    # ============================================================
    # INFORMATIONS SUR LE TRAJET
    # ============================================================
    ville_depart = models.CharField(max_length=50, choices=VILLE_CHOICES)
    ville_destination = models.CharField(max_length=50, choices=VILLE_CHOICES)
    adresse_depart = models.CharField(max_length=255, blank=True)
    adresse_destination = models.CharField(max_length=255, blank=True)

    # ============================================================
    # INFORMATIONS TEMPORELLES
    # ============================================================
    date_depart_souhaitee = models.DateField()
    delai_livraison = models.PositiveIntegerField(help_text="Délai en jours")
    niveau_urgence = models.CharField(max_length=20, choices=URGENCE_CHOICES, default='normal')

    # ============================================================
    # STATUT ET DATES
    # ============================================================
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='publiee')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    date_attribution = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Demande de transport'
        verbose_name_plural = 'Demandes de transport'

    def __str__(self):
        return f"Demande {self.id} — {self.ville_depart} → {self.ville_destination} ({self.statut})"