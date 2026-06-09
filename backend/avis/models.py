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
