from django.db import models
from django.utils import timezone


class EvenementNational(models.Model):
    CATEGORIES = [
        ('culturel', 'Culturel'),
        ('religieux', 'Religieux'),
        ('national', 'Fête nationale'),
        ('sportif', 'Sportif'),
        ('autre', 'Autre'),
    ]

    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    categorie = models.CharField(max_length=20, choices=CATEGORIES, default='culturel')
    date_debut = models.DateField()
    date_fin = models.DateField()
    region = models.CharField(max_length=100, blank=True)
    villes_concernees = models.JSONField(default=list, blank=True)
    est_actif = models.BooleanField(default=True)
    image = models.ImageField(upload_to='evenements/', null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date_debut']
        verbose_name = 'Événement National'
        verbose_name_plural = 'Événements Nationaux'

    def __str__(self):
        return f"{self.nom} ({self.date_debut} — {self.date_fin})"

    @property
    def est_en_cours(self):
        today = timezone.now().date()
        return self.date_debut <= today <= self.date_fin

    @property
    def est_a_venir(self):
        return timezone.now().date() < self.date_debut


class PointInteret(models.Model):
    CATEGORIES = [
        ('historique', 'Site historique'),
        ('culturel', 'Site culturel'),
        ('religieux', 'Site religieux'),
        ('naturel', 'Site naturel'),
    ]
    nom = models.CharField(max_length=200)
    ville = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    categorie = models.CharField(max_length=20, choices=CATEGORIES)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    photo = models.ImageField(upload_to='points_interet/', null=True, blank=True)
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['ville', 'nom']
        verbose_name = 'Point d\'intérêt'
        verbose_name_plural = 'Points d\'intérêt'

    def __str__(self):
        return f"{self.nom} ({self.ville})"


EVENEMENTS_BENINOIS = [
    {'nom': 'Fête du Vodun', 'date_debut': '01-10', 'date_fin': '01-10', 'villes': ['Ouidah', 'Abomey'], 'categorie': 'religieux'},
    {'nom': 'Festival International de Dassa', 'date_debut': '07-15', 'date_fin': '07-21', 'villes': ['Dassa-Zoumé'], 'categorie': 'culturel'},
    {'nom': 'Fête Nationale du Bénin', 'date_debut': '08-01', 'date_fin': '08-01', 'villes': ['Cotonou', 'Porto-Novo'], 'categorie': 'national'},
    {'nom': 'We Love Yaoundé — Bénin', 'date_debut': '12-26', 'date_fin': '12-31', 'villes': ['Cotonou'], 'categorie': 'culturel'},
]


class MiseEnAvantHotel(models.Model):
    evenement = models.ForeignKey(EvenementNational, on_delete=models.CASCADE, related_name='mises_en_avant')
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='mises_en_avant')
    position_boost = models.PositiveSmallIntegerField(default=0)
    date_boost_debut = models.DateField()
    date_boost_fin = models.DateField()
    est_actif = models.BooleanField(default=True)

    class Meta:
        unique_together = ('evenement', 'hotel')
        verbose_name = 'Mise en avant'

    def __str__(self):
        return f"{self.hotel.nom} — {self.evenement.nom}"
