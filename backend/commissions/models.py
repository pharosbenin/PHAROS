from django.db import models
from django.conf import settings


class Abonnement(models.Model):
    TYPES = [
        ('freemium', 'Freemium (3%)'),
        ('pro', 'Pro (5%)'),
    ]
    STATUTS = [
        ('actif', 'Actif'),
        ('expire', 'Expiré'),
        ('annule', 'Annulé'),
    ]

    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='abonnements')
    type_abonnement = models.CharField(max_length=20, choices=TYPES)
    taux_commission = models.DecimalField(max_digits=5, decimal_places=4)
    date_debut = models.DateField()
    date_fin = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='actif')
    montant_paye = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reference_paiement = models.CharField(max_length=200, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Abonnement'
        verbose_name_plural = 'Abonnements'

    def __str__(self):
        return f"{self.hotel.nom} — {self.get_type_abonnement_display()}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Synchroniser le type_abonnement de l'hôtel
        if self.statut == 'actif':
            self.hotel.type_abonnement = self.type_abonnement
            self.hotel.save(update_fields=['type_abonnement'])


class DemandeUpgradePro(models.Model):
    STATUTS = [
        ('en_attente', 'En attente'),
        ('approuve', 'Approuvée'),
        ('rejete', 'Rejetée'),
    ]
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='demandes_upgrade')
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    date_demande = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)
    traite_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='demandes_traitees'
    )
    message_admin = models.TextField(blank=True)

    class Meta:
        ordering = ['-date_demande']
        verbose_name = 'Demande upgrade Pro'
        verbose_name_plural = 'Demandes upgrade Pro'

    def __str__(self):
        return f"Demande Pro — {self.hotel.nom} ({self.get_statut_display()})"


class Commission(models.Model):
    STATUTS = [
        ('calcule', 'Calculé'),
        ('verse', 'Versé à l\'hôtel'),
        ('litige', 'En litige'),
    ]

    paiement = models.OneToOneField(
        'reservations.Paiement', on_delete=models.CASCADE, related_name='commission'
    )
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.PROTECT, related_name='commissions')
    montant_brut = models.DecimalField(max_digits=12, decimal_places=2)
    taux = models.DecimalField(max_digits=5, decimal_places=4)
    montant_commission = models.DecimalField(max_digits=12, decimal_places=2)
    montant_hotel = models.DecimalField(max_digits=12, decimal_places=2)
    statut = models.CharField(max_length=20, choices=STATUTS, default='calcule')
    date_calcul = models.DateTimeField(auto_now_add=True)
    date_versement = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_calcul']
        verbose_name = 'Commission'
        verbose_name_plural = 'Commissions'

    def __str__(self):
        return f"Commission {self.hotel.nom} — {self.montant_commission} XOF"


class Retrait(models.Model):
    STATUTS = [
        ('en_attente', 'En attente'),
        ('approuve', 'Approuvé'),
        ('rejete', 'Rejeté'),
    ]
    METHODES = [
        ('mtn', 'MTN Mobile Money'),
        ('moov', 'Moov Money'),
        ('carte', 'Carte bancaire'),
    ]

    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='retraits')
    demandeur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='retraits_demandes'
    )
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    methode = models.CharField(max_length=10, choices=METHODES)
    numero_telephone = models.CharField(max_length=20)
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    motif_rejet = models.TextField(blank=True)
    traite_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='retraits_traites'
    )
    date_demande = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_demande']
        verbose_name = 'Retrait'
        verbose_name_plural = 'Retraits'

    def __str__(self):
        return f"Retrait {self.hotel.nom} — {self.montant} FCFA ({self.get_statut_display()})"
