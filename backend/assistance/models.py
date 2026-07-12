from django.db import models


class CategorieService(models.Model):
    """Catégorie de service de proximité (pharmacie, hôpital...). Extensible sans code."""
    code = models.SlugField(max_length=50, unique=True)
    nom = models.CharField(max_length=100)
    icone = models.CharField(max_length=50, blank=True)
    ordre = models.PositiveIntegerField(default=0)
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['ordre', 'nom']
        verbose_name = 'Catégorie de service'
        verbose_name_plural = 'Catégories de service'

    def __str__(self):
        return self.nom


class ServiceProximite(models.Model):
    """Un service concret (une pharmacie précise, un hôpital précis...) géolocalisé."""
    SOURCES = [
        ('osm', 'OpenStreetMap'),
        ('manuel', 'Manuel'),
    ]

    categorie = models.ForeignKey(CategorieService, on_delete=models.PROTECT, related_name='services')
    nom = models.CharField(max_length=200)
    adresse = models.CharField(max_length=255, blank=True)
    ville = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    horaires = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    source = models.CharField(max_length=10, choices=SOURCES, default='manuel')
    # Identifiant externe (ex. osm_id) pour éviter les doublons lors des ré-imports OSM.
    # unique=True + null=True : autorise plusieurs entrées manuelles sans identifiant (NULL),
    # mais bloque au niveau base tout doublon d'un même identifiant externe non nul.
    identifiant_externe = models.CharField(max_length=100, blank=True, null=True, unique=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ville', 'nom']
        verbose_name = 'Service de proximité'
        verbose_name_plural = 'Services de proximité'

    def __str__(self):
        return f"{self.nom} ({self.categorie.nom} — {self.ville})"
