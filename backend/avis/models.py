from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Avis(models.Model):
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='avis'
    )
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='avis')
    reservation = models.OneToOneField(
        'reservations.Reservation', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='avis'
    )
    note = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    commentaire = models.TextField(blank=True)
    est_approuve = models.BooleanField(default=False)
    reponse_gestionnaire = models.TextField(blank=True)
    date_reponse = models.DateTimeField(null=True, blank=True)
    date_avis = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_avis']
        verbose_name = 'Avis'
        verbose_name_plural = 'Avis'
        unique_together = ('client', 'hotel', 'reservation')

    def __str__(self):
        return f"Avis {self.note}/5 — {self.hotel.nom}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.hotel.recalculer_note()


class SignalementContenu(models.Model):
    """Avis contenant des mots interdits détectés côté client — en attente de modération."""
    STATUTS = [
        ('en_attente', 'En attente'),
        ('traite', 'Traité'),
    ]

    reservation = models.ForeignKey(
        'reservations.Reservation', on_delete=models.CASCADE,
        related_name='signalements_contenu'
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='signalements_contenu'
    )
    hotel = models.ForeignKey(
        'hotels.Hotel', on_delete=models.CASCADE,
        related_name='signalements_contenu'
    )
    avis_initial = models.TextField()
    explication = models.TextField()
    date_signalement = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')

    class Meta:
        ordering = ['-date_signalement']
        verbose_name = 'Signalement de contenu'

    def __str__(self):
        return f"Signalement — {self.reservation}"


class SignalementHotel(models.Model):
    MOTIFS = [
        ('tromperie', 'Informations trompeuses'),
        ('hygiene', "Problème d'hygiène"),
        ('securite', 'Problème de sécurité'),
        ('escroquerie', 'Escroquerie'),
        ('autre', 'Autre'),
    ]
    STATUTS = [('en_attente', 'En attente'), ('traite', 'Traité')]

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='signalements_hotel')
    hotel = models.ForeignKey('hotels.Hotel', on_delete=models.CASCADE, related_name='signalements_hotel')
    motif = models.CharField(max_length=20, choices=MOTIFS)
    description = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    date_signalement = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_signalement']
        verbose_name = "Signalement d'hôtel"

    def __str__(self):
        return f"Signalement hôtel — {self.hotel.nom}"


class SignalementAvis(models.Model):
    MOTIFS = [
        ('spam', 'Spam'),
        ('faux', 'Faux avis'),
        ('inapproprie', 'Contenu inapproprié'),
        ('autre', 'Autre'),
    ]

    avis = models.ForeignKey(Avis, on_delete=models.CASCADE, related_name='signalements')
    signale_par = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    motif = models.CharField(max_length=20, choices=MOTIFS)
    description = models.TextField(blank=True)
    est_traite = models.BooleanField(default=False)
    date_signalement = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Signalement d\'avis'

    def __str__(self):
        return f"Signalement — {self.avis}"
