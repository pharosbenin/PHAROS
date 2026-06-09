import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Reservation(models.Model):
    STATUTS = [
        ('en_attente', 'En attente de paiement'),
        ('payee', 'Payée'),
        ('confirmee', 'Confirmée'),
        ('en_cours', 'En cours de séjour'),
        ('confirme_client', 'Confirmé par le client'),
        ('confirme_hotel', 'Confirmé par l\'hôtel'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
        ('remboursee', 'Remboursée'),
    ]

    numero = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reservations'
    )
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.PROTECT, related_name='reservations')
    type_chambre = models.ForeignKey('hotels.TypeChambre', on_delete=models.PROTECT, related_name='reservations')

    # Infos client (réservation sans compte possible)
    nom_client = models.CharField(max_length=100)
    prenom_client = models.CharField(max_length=100)
    email_client = models.EmailField()
    telephone_client = models.CharField(max_length=20)

    date_arrivee = models.DateField()
    date_depart = models.DateField()
    nb_adultes = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    nb_enfants = models.PositiveSmallIntegerField(default=0)
    prix_total = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    notes = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Réservation'
        verbose_name_plural = 'Réservations'

    def __str__(self):
        return f"RES-{str(self.numero)[:8].upper()} — {self.hotel.nom}"

    @property
    def nb_nuits(self):
        return (self.date_depart - self.date_arrivee).days

    @property
    def nom_complet_client(self):
        return f"{self.prenom_client} {self.nom_client}"


class Paiement(models.Model):
    METHODES = [
        ('mtn', 'MTN Mobile Money'),
        ('moov', 'Moov Money'),
        ('carte', 'Carte bancaire'),
    ]
    STATUTS = [
        ('en_attente', 'En attente'),
        ('reussi', 'Réussi'),
        ('echoue', 'Échoué'),
        ('rembourse', 'Remboursé'),
    ]

    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='paiement')
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    montant_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    montant_hotel = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    methode = models.CharField(max_length=20, choices=METHODES)
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    reference_externe = models.CharField(max_length=200, blank=True)
    numero_telephone = models.CharField(max_length=20, blank=True)
    date_paiement = models.DateTimeField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'

    def __str__(self):
        return f"Paiement {self.reservation.numero} — {self.get_statut_display()}"


class QRCodeReservation(models.Model):
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='qrcode')
    code = models.UUIDField(default=uuid.uuid4, unique=True)
    image = models.ImageField(upload_to='qrcodes/', null=True, blank=True)
    est_utilise = models.BooleanField(default=False)
    date_utilisation = models.DateTimeField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'QR Code'
        verbose_name_plural = 'QR Codes'

    def __str__(self):
        return f"QR — {self.reservation.numero}"


class Annulation(models.Model):
    DEMANDES_PAR = [
        ('client', 'Client'),
        ('gestionnaire', 'Gestionnaire'),
        ('admin', 'Administrateur'),
    ]
    STATUTS = [
        ('en_attente', 'En attente'),
        ('approuvee', 'Approuvée'),
        ('refusee', 'Refusée'),
    ]

    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='annulation')
    demandeur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    demande_par = models.CharField(max_length=20, choices=DEMANDES_PAR)
    motif = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    montant_rembourse = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date_demande = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Annulation'

    def __str__(self):
        return f"Annulation {self.reservation.numero}"
