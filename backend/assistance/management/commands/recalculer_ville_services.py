from django.core.management.base import BaseCommand

from evenements.utils import distance_km
from assistance.models import ServiceProximite
from .import_services_osm import VILLES_BENIN, _geocoder_ville


class Command(BaseCommand):
    help = (
        "Recalcule le champ ville de chaque ServiceProximite comme la ville de VILLES_BENIN "
        "la plus proche par distance réelle, au lieu de la ville qui l'a capté en dernier "
        "lors de l'import OSM (corrige les chevauchements de rayons de recherche entre villes voisines)."
    )

    def handle(self, *args, **options):
        self.stdout.write('Géocodage des villes de référence...')
        centres = {}
        echecs_geocodage = []
        for ville in VILLES_BENIN:
            coords, retries, ok = _geocoder_ville(ville)
            if ok:
                centres[ville] = coords
            else:
                echecs_geocodage.append(ville)

        if echecs_geocodage:
            self.stdout.write(self.style.WARNING(
                f'Géocodage échoué pour {len(echecs_geocodage)} ville(s), exclues du recalcul : {echecs_geocodage}'
            ))

        if not centres:
            self.stdout.write(self.style.ERROR('Aucune ville géocodée, abandon.'))
            return

        modifies = 0
        inchanges = 0
        for service in ServiceProximite.objects.all():
            lat, lon = float(service.latitude), float(service.longitude)
            plus_proche = min(
                centres.items(),
                key=lambda item: distance_km(lat, lon, item[1][0], item[1][1])
            )[0]
            if plus_proche != service.ville:
                ancienne = service.ville
                service.ville = plus_proche
                service.save(update_fields=['ville'])
                modifies += 1
            else:
                inchanges += 1

        self.stdout.write(self.style.SUCCESS(
            f'{modifies} service(s) recalculé(s) vers une ville plus proche, {inchanges} déjà corrects.'
        ))
