from django.core.management.base import BaseCommand
from hotels.models import Hotel

# Coordonnées GPS réalistes pour les hôtels de démonstration au Bénin.
# Clé : fragment du nom (insensible à la casse), valeur : (lat, lng)
COORDS_CONNUES = {
    'sofitel':          (6.3600, 2.4292),   # Haie Vive, bord de mer
    'marina':           (6.3600, 2.4292),
    'du lac':           (6.3720, 2.4180),   # Quartier Akpakpa, côté lac
    'lac':              (6.3720, 2.4180),
    'bénin palace':     (6.3488, 2.4412),   # Akpakpa Est
    'benin palace':     (6.3488, 2.4412),
    'palace':           (6.3488, 2.4412),
    'azalaï':           (6.3676, 2.4267),   # Centre Cotonou
    'azalai':           (6.3676, 2.4267),
    'golden tulip':     (6.3540, 2.4350),
    'novotel':          (6.3610, 2.4310),
    'ibis':             (6.3580, 2.4280),
    'porto-novo':       (6.4969, 2.6288),   # Centre Porto-Novo
    'ouidah':           (6.3616, 2.0850),   # Centre Ouidah
    'abomey':           (7.1827, 1.9896),
    'parakou':          (9.3372, 2.6283),
    'natitingou':       (10.3096, 1.3784),
    'grand-popo':       (6.2792, 1.8255),
    'ganvié':           (6.4573, 2.4145),
}

# Coordonnées de repli par ville (centre-ville approximatif)
COORDS_VILLE = {
    'cotonou':      (6.3703, 2.3912),
    'porto-novo':   (6.4969, 2.6288),
    'ouidah':       (6.3616, 2.0850),
    'abomey':       (7.1827, 1.9896),
    'parakou':      (9.3372, 2.6283),
    'natitingou':   (10.3096, 1.3784),
    'grand-popo':   (6.2792, 1.8255),
    'bohicon':      (7.1667, 2.0667),
    'lokossa':      (6.6333, 1.7167),
    'kandi':        (11.1344, 2.9383),
}


class Command(BaseCommand):
    help = "Assigne des coordonnées GPS aux hôtels qui n'en ont pas (données de démo)"

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help="Afficher sans modifier")

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        hotels_sans_coords = Hotel.objects.filter(latitude__isnull=True)
        total = hotels_sans_coords.count()

        if total == 0:
            self.stdout.write(self.style.SUCCESS("Tous les hôtels ont déjà des coordonnées GPS."))
            return

        self.stdout.write(f"{total} hôtel(s) sans coordonnées GPS :")
        mis_a_jour = 0

        for hotel in hotels_sans_coords:
            lat, lng = self._trouver_coords(hotel)
            self.stdout.write(f"  {'[DRY]' if dry_run else '[MAJ]'} {hotel.nom} ({hotel.ville}) : {lat}, {lng}")
            if not dry_run:
                hotel.latitude = lat
                hotel.longitude = lng
                hotel.save(update_fields=['latitude', 'longitude'])
                mis_a_jour += 1

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f"\n{mis_a_jour} hôtel(s) mis à jour."))
        else:
            self.stdout.write(self.style.WARNING(f"\n[DRY RUN] Aucune modification effectuée."))

    def _trouver_coords(self, hotel):
        nom_lower = hotel.nom.lower()
        for fragment, coords in sorted(COORDS_CONNUES.items(), key=lambda x: len(x[0]), reverse=True):
            if fragment in nom_lower:
                return coords
        ville_lower = hotel.ville.lower()
        for ville, coords in COORDS_VILLE.items():
            if ville in ville_lower:
                import random
                random.seed(hotel.id)
                offset_lat = random.uniform(-0.015, 0.015)
                offset_lng = random.uniform(-0.015, 0.015)
                return (round(coords[0] + offset_lat, 6), round(coords[1] + offset_lng, 6))
        return (6.3703, 2.3912)
