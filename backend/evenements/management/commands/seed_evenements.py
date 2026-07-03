from django.core.management.base import BaseCommand
from evenements.models import EvenementNational


EVENEMENTS = [
    {
        'nom': 'WeLoveYa Festival',
        'description': 'Festival de musique urbaine et afrobeat réunissant artistes béninois et internationaux.',
        'categorie': 'culturel',
        'date_debut': '2026-12-26',
        'date_fin': '2026-12-31',
        'region': 'Littoral',
        'villes_concernees': ['Cotonou'],
        'latitude': 6.3489482,
        'longitude': 2.4075481,
    },
    {
        'nom': 'Vodun Days',
        'description': 'Festival international du Vodoun célébrant les traditions et cultes vodun du Bénin.',
        'categorie': 'religieux',
        'date_debut': '2027-01-10',
        'date_fin': '2027-01-10',
        'region': 'Atlantique',
        'villes_concernees': ['Ouidah'],
        'latitude': 6.3594619,
        'longitude': 2.0818563,
    },
    {
        'nom': 'Fête du Gani',
        'description': 'Rassemblement traditionnel Wassangari célébrant la culture équestre et royale de Nikki. Date exacte variable selon les années, à confirmer.',
        'categorie': 'culturel',
        'date_debut': '2027-05-01',
        'date_fin': '2027-05-03',
        'region': 'Borgou',
        'villes_concernees': ['Nikki'],
        'latitude': 9.9363278,
        'longitude': 3.2105884,
    },
]


class Command(BaseCommand):
    help = 'Seed des événements nationaux du Bénin'

    def handle(self, *args, **options):
        created = 0
        for data in EVENEMENTS:
            _, is_new = EvenementNational.objects.get_or_create(
                nom=data['nom'],
                defaults={
                    'description': data['description'],
                    'categorie': data['categorie'],
                    'date_debut': data['date_debut'],
                    'date_fin': data['date_fin'],
                    'region': data['region'],
                    'villes_concernees': data['villes_concernees'],
                    'latitude': data['latitude'],
                    'longitude': data['longitude'],
                    'est_actif': True,
                }
            )
            if is_new:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'{created} événement(s) créé(s).'))
