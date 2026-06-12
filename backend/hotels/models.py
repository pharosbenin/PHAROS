from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Hotel(models.Model):
    STATUTS = [
        ('en_attente', 'En attente de validation'),
        ('valide', 'Validé'),
        ('rejete', 'Rejeté'),
        ('suspendu', 'Suspendu'),
    ]
    ABONNEMENTS = [
        ('freemium', 'Freemium (3%)'),
        ('pro', 'Pro (5%)'),
    ]
    TYPES_ETABLISSEMENT = [
        ('hotel', 'Hôtel'),
        ('residence', 'Résidence'),
        ('villa', 'Villa'),
        ('auberge', 'Auberge'),
    ]

    gestionnaire = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='hotels', limit_choices_to={'role': 'gestionnaire'}
    )
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    adresse = models.CharField(max_length=300)
    ville = models.CharField(max_length=100)
    quartier = models.CharField(max_length=100, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    site_web = models.URLField(blank=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    type_abonnement = models.CharField(max_length=20, choices=ABONNEMENTS, default='freemium')
    type_etablissement = models.CharField(max_length=20, choices=TYPES_ETABLISSEMENT, default='hotel')
    equipements = models.JSONField(default=list, blank=True)
    taux_annulation = models.PositiveSmallIntegerField(default=20)
    taux_modification = models.PositiveSmallIntegerField(default=10)
    delai_gratuit = models.PositiveSmallIntegerField(default=24)
    note_moyenne = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    nombre_avis = models.PositiveIntegerField(default=0)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    photo_principale = models.ImageField(upload_to='hotels/', null=True, blank=True)
    document_registre = models.FileField(upload_to='documents/', null=True, blank=True)
    motif_rejet = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-type_abonnement', '-note_moyenne']
        verbose_name = 'Hôtel'
        verbose_name_plural = 'Hôtels'

    def __str__(self):
        return f"{self.nom} ({self.ville})"

    @property
    def est_pro(self):
        return self.type_abonnement == 'pro'

    def recalculer_note(self):
        from avis.models import Avis
        avis_qs = Avis.objects.filter(hotel=self, est_approuve=True)
        count = avis_qs.count()
        if count > 0:
            total = sum(a.note for a in avis_qs)
            self.note_moyenne = round(total / count, 2)
        else:
            self.note_moyenne = 0.00
        self.nombre_avis = count
        self.save(update_fields=['note_moyenne', 'nombre_avis'])


class TypeChambre(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='types_chambres')
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    capacite = models.PositiveSmallIntegerField(default=2, validators=[MinValueValidator(1)])
    prix_nuit = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    prix_weekend = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    superficie = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    nombre_chambres = models.PositiveSmallIntegerField(default=1)
    equipements = models.JSONField(default=list, blank=True)
    est_disponible = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Type de chambre'
        verbose_name_plural = 'Types de chambres'

    def __str__(self):
        return f"{self.nom} — {self.hotel.nom}"


class PhotoHotel(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='hotels/photos/')
    legende = models.CharField(max_length=200, blank=True)
    est_principale = models.BooleanField(default=False)
    ordre = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['ordre']
        verbose_name = 'Photo hôtel'

    def save(self, *args, **kwargs):
        if self.est_principale:
            PhotoHotel.objects.filter(hotel=self.hotel, est_principale=True).update(est_principale=False)
        super().save(*args, **kwargs)


class PhotoChambre(models.Model):
    type_chambre = models.ForeignKey(TypeChambre, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='chambres/photos/')
    legende = models.CharField(max_length=200, blank=True)
    ordre = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['ordre']
        verbose_name = 'Photo chambre'


class PlatMenu(models.Model):
    CATEGORIES = [
        ('entrees', 'Entrées'),
        ('plats', 'Plats principaux'),
        ('grillades', 'Grillades'),
        ('poissons', 'Poissons & Fruits de mer'),
        ('vegetarien', 'Végétarien'),
        ('desserts', 'Desserts'),
        ('boissons', 'Boissons'),
        ('petit_dejeuner', 'Petit-déjeuner'),
    ]

    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='plats_menu')
    nom = models.CharField(max_length=200)
    categorie = models.CharField(max_length=20, choices=CATEGORIES, default='plats')
    description = models.TextField(blank=True)
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    photo = models.ImageField(upload_to='plats/', null=True, blank=True)
    est_disponible = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['categorie', 'nom']
        verbose_name = 'Plat du menu'
        verbose_name_plural = 'Plats du menu'

    def __str__(self):
        return f"{self.nom} — {self.hotel.nom}"


class CommandeRestaurant(models.Model):
    STATUTS = [
        ('en_attente', 'En attente'),
        ('en_preparation', 'En préparation'),
        ('prete', 'Prête'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
    ]
    reservation = models.ForeignKey(
        'reservations.Reservation', on_delete=models.CASCADE, related_name='commandes_resto'
    )
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='commandes_resto')
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    notes = models.TextField(blank=True)
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_commande = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_commande']
        verbose_name = 'Commande restaurant'
        verbose_name_plural = 'Commandes restaurant'

    def __str__(self):
        return f"Commande #{self.pk} — {self.hotel.nom}"


class Promotion(models.Model):
    type_chambre = models.ForeignKey(TypeChambre, on_delete=models.CASCADE, related_name='promotions')
    titre = models.CharField(max_length=100, blank=True)
    prix_promo = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    date_debut = models.DateField()
    date_fin = models.DateField()
    est_active = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        verbose_name = 'Promotion'

    def __str__(self):
        return f"Promo {self.titre or self.type_chambre.nom}"

    @property
    def est_en_cours(self):
        from django.utils import timezone
        today = timezone.now().date()
        return self.est_active and self.date_debut <= today <= self.date_fin


class LigneCommande(models.Model):
    commande = models.ForeignKey(CommandeRestaurant, on_delete=models.CASCADE, related_name='lignes')
    plat = models.ForeignKey(PlatMenu, on_delete=models.SET_NULL, null=True)
    nom_plat = models.CharField(max_length=200)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    quantite = models.PositiveIntegerField(default=1)

    @property
    def sous_total(self):
        return self.prix_unitaire * self.quantite

    def __str__(self):
        return f"{self.quantite}× {self.nom_plat}"
