from django.core.management.base import BaseCommand
from evenements.models import PointInteret


POINTS = [
    {'ville': 'Cotonou', 'nom': 'Marché Dantokpa', 'categorie': 'culturel', 'latitude': 6.3556, 'longitude': 2.4282, 'description': 'Le plus grand marché d\'Afrique de l\'Ouest.'},
    {'ville': 'Cotonou', 'nom': 'Place de l\'Amazone', 'categorie': 'historique', 'latitude': 6.3553, 'longitude': 2.4156, 'description': 'Statue emblématique de la guerrière amazone.'},
    {'ville': 'Cotonou', 'nom': 'Place de l\'Étoile Rouge (Place du Souvenir)', 'categorie': 'historique', 'latitude': 6.3697, 'longitude': 2.4317, 'description': 'Place symbolique du centre de Cotonou.'},
    {'ville': 'Cotonou', 'nom': 'Cathédrale Notre-Dame des Apôtres', 'categorie': 'religieux', 'latitude': 6.3608, 'longitude': 2.4253, 'description': 'Cathédrale catholique historique de Cotonou.'},
    {'ville': 'Porto-Novo', 'nom': 'Musée Honmè (Palais royal)', 'categorie': 'culturel', 'latitude': 6.4974, 'longitude': 2.6160, 'description': 'Ancien palais royal transformé en musée.'},
    {'ville': 'Porto-Novo', 'nom': 'Grande Mosquée de Porto-Novo', 'categorie': 'religieux', 'latitude': 6.4985, 'longitude': 2.6175, 'description': 'Mosquée brésilienne au style unique.'},
    {'ville': 'Porto-Novo', 'nom': 'Cathédrale Notre-Dame de l\'Immaculée Conception', 'categorie': 'religieux', 'latitude': 6.4978, 'longitude': 2.6145, 'description': 'Cathédrale historique de Porto-Novo.'},
    {'ville': 'Porto-Novo', 'nom': 'Musée Da Silva', 'categorie': 'culturel', 'latitude': 6.4970, 'longitude': 2.6155, 'description': 'Musée de la famille Da Silva, afro-brésiliens.'},
    {'ville': 'Porto-Novo', 'nom': 'Centre Songhaï', 'categorie': 'naturel', 'latitude': 6.4850, 'longitude': 2.6300, 'description': 'Centre agro-écologique innovant.'},
    {'ville': 'Ouidah', 'nom': 'Temple des Pythons', 'categorie': 'religieux', 'latitude': 6.3601, 'longitude': 2.0853, 'description': 'Temple sacré vodum avec pythons royaux.'},
    {'ville': 'Ouidah', 'nom': 'Porte du Non-Retour', 'categorie': 'historique', 'latitude': 6.2486, 'longitude': 2.0875, 'description': 'Monument mémoriel de la traite négrière.'},
    {'ville': 'Ouidah', 'nom': 'Musée d\'Histoire de Ouidah (Fort portugais)', 'categorie': 'historique', 'latitude': 6.3608, 'longitude': 2.0858, 'description': 'Fort portugais du 17e siècle, aujourd\'hui musée.'},
    {'ville': 'Ouidah', 'nom': 'Forêt Sacrée de Kpassè', 'categorie': 'naturel', 'latitude': 6.3622, 'longitude': 2.0810, 'description': 'Forêt sacrée vodum.'},
    {'ville': 'Ouidah', 'nom': 'Fondation Zinsou', 'categorie': 'culturel', 'latitude': 6.3580, 'longitude': 2.0870, 'description': 'Centre d\'art contemporain africain.'},
    {'ville': 'Ouidah', 'nom': 'Basilique de l\'Immaculée Conception', 'categorie': 'religieux', 'latitude': 6.3600, 'longitude': 2.0860, 'description': 'Basilique catholique historique.'},
    {'ville': 'Abomey', 'nom': 'Palais Royaux d\'Abomey', 'categorie': 'historique', 'latitude': 7.1833, 'longitude': 1.9833, 'description': 'Patrimoine mondial de l\'UNESCO — anciens palais royaux du Dahomey.'},
    {'ville': 'Sô-Ava', 'nom': 'Cité lacustre de Ganvié', 'categorie': 'naturel', 'latitude': 6.4667, 'longitude': 2.4167, 'description': 'Village lacustre sur le lac Nokoué, surnommé la Venise de l\'Afrique.'},
    {'ville': 'Dassa-Zoumè', 'nom': 'Sanctuaire Marial d\'Arigbo', 'categorie': 'religieux', 'latitude': 7.7558, 'longitude': 2.1825, 'description': 'Lieu de pèlerinage marial majeur du Bénin.'},
    {'ville': 'Natitingou', 'nom': 'Musée régional de Natitingou', 'categorie': 'culturel', 'latitude': 10.3042, 'longitude': 1.3792, 'description': 'Musée ethnographique du nord du Bénin.'},
    {'ville': 'Boukoumbé', 'nom': 'Villages Tata Somba', 'categorie': 'culturel', 'latitude': 10.1833, 'longitude': 1.1167, 'description': 'Architecture traditionnelle des Somba, patrimoine UNESCO.'},
    {'ville': 'Tanguiéta', 'nom': 'Cascades de Tanougou', 'categorie': 'naturel', 'latitude': 11.0500, 'longitude': 1.4500, 'description': 'Cascades naturelles dans le parc de la Pendjari.'},
    {'ville': 'Grand-Popo', 'nom': 'Plage de Grand-Popo / Bouche du Roy', 'categorie': 'naturel', 'latitude': 6.2833, 'longitude': 1.8167, 'description': 'Embouchure du fleuve Mono sur l\'Atlantique.'},
]


class Command(BaseCommand):
    help = 'Seed les points d\'intérêt touristiques du Bénin'

    def handle(self, *args, **options):
        created = 0
        for data in POINTS:
            _, is_new = PointInteret.objects.get_or_create(
                nom=data['nom'],
                ville=data['ville'],
                defaults={
                    'categorie': data['categorie'],
                    'latitude': data['latitude'],
                    'longitude': data['longitude'],
                    'description': data.get('description', ''),
                    'actif': True,
                }
            )
            if is_new:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'{created} point(s) d\'intérêt créé(s).'))
