from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from reservations.models import Reservation


class Command(BaseCommand):
    help = "Active avis_disponible pour les réservations dont le délai post-séjour est écoulé."

    def handle(self, *args, **options):
        today = timezone.now().date()
        a_traiter = Reservation.objects.filter(
            avis_disponible=False,
            statut__in=['terminee', 'confirmee'],
        ).exclude(date_depart__gt=today)

        nb = 0
        for r in a_traiter:
            # délai = durée du séjour (nb_nuits jours après le départ)
            date_disponible = r.date_depart + timedelta(days=r.nb_nuits)
            if today >= date_disponible:
                r.avis_disponible = True
                r.save(update_fields=['avis_disponible'])
                nb += 1

        self.stdout.write(self.style.SUCCESS(f'{nb} réservation(s) déverrouillée(s) pour avis.'))
