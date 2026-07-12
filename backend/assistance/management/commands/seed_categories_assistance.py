from django.core.management.base import BaseCommand
from assistance.models import CategorieService


CATEGORIES = [
    {'code': 'pharmacie', 'nom': 'Pharmacie', 'icone': 'pill', 'ordre': 1},
    {'code': 'hopital-clinique', 'nom': 'Hôpital / Clinique', 'icone': 'cross', 'ordre': 2},
    {'code': 'station-service', 'nom': 'Station-service', 'icone': 'fuel', 'ordre': 3},
    {'code': 'centre-commercial-marche', 'nom': 'Centre commercial / Marché', 'icone': 'shopping-cart', 'ordre': 4},
    {'code': 'garage-mecanicien', 'nom': 'Garage / Mécanicien', 'icone': 'wrench', 'ordre': 5},
]


class Command(BaseCommand):
    help = "Seed les 5 catégories de services d'assistance voyageur (idempotent)."

    def handle(self, *args, **options):
        crees = 0
        maj = 0
        for data in CATEGORIES:
            categorie, is_new = CategorieService.objects.update_or_create(
                code=data['code'],
                defaults={
                    'nom': data['nom'],
                    'icone': data['icone'],
                    'ordre': data['ordre'],
                    'actif': True,
                }
            )
            if is_new:
                crees += 1
            else:
                maj += 1
        self.stdout.write(self.style.SUCCESS(
            f'{crees} catégorie(s) créée(s), {maj} déjà existante(s) mise(s) à jour.'
        ))
