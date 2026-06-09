from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLES = [
        ('client', 'Client'),
        ('gestionnaire', 'Gestionnaire Hôtelier'),
        ('admin', 'Administrateur'),
    ]
    role = models.CharField(max_length=20, choices=ROLES, default='client')
    telephone = models.CharField(max_length=15, blank=True)
    photo_profil = models.ImageField(upload_to='profiles/', null=True, blank=True)
    est_suspendu = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def nom_complet(self):
        return self.get_full_name() or self.username
