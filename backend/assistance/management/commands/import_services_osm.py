import time
import logging

import requests
from django.core.management.base import BaseCommand, CommandError

from assistance.models import CategorieService, ServiceProximite

logger = logging.getLogger(__name__)

# Politique d'usage Nominatim : User-Agent obligatoire identifiant l'app + un contact.
HEADERS = {'User-Agent': 'PHAROS-Benin/1.0 (contact: admin@pharos.bj)'}

NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

# Délai minimum entre deux requêtes Nominatim (politique officielle : 1 req/s max).
DELAI_NOMINATIM = 1.1
# Délai entre deux requêtes Overpass (une requête par ville, tous tags combinés).
DELAI_OVERPASS = 2.0

# Reprise automatique sur échec réseau/timeout : 3 tentatives, backoff exponentiel (3s, 6s).
MAX_TENTATIVES = 3
DELAI_RETRY_BASE = 3

# Rayon de recherche Overpass, en mètres : plus large pour les grandes villes.
VILLES_PRINCIPALES = {
    'Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Natitingou',
    'Djougou', 'Lokossa', 'Abomey', 'Bohicon', 'Kandi', 'Ouidah', 'Dassa-Zoumè',
}
RAYON_VILLE_PRINCIPALE_M = 12000
RAYON_PETITE_COMMUNE_M = 6000

VILLES_BENIN = [
    'Cotonou',
    'Porto-Novo', 'Adjohoun', 'Akpro-Missérété', 'Avrankou', 'Bonou', 'Dangbo', 'Missérété', 'Sèmè-Kpodji',
    'Abomey-Calavi', 'Allada', 'Ouidah', 'Kpomassè', 'Sô-Ava', 'Toffo', 'Tori-Bossito', 'Zè',
    'Parakou', 'Bembèrèkè', 'Kalalé', "N'Dali", 'Nikki', 'Pèrèrè', 'Sinendé', 'Tchaourou',
    'Abomey', 'Bohicon', 'Agbangnizoun', 'Covè', 'Djidja', 'Ouinhi', 'Zagnanado', 'Za-Kpota', 'Zogbodomè',
    'Dassa-Zoumè', 'Glazoué', 'Bantè', 'Ouèssè', 'Savalou', 'Savè',
    'Natitingou', 'Boukoumbé', 'Cobly', 'Copargo', 'Kérou', 'Kouandé', 'Matéri', 'Péhunco', 'Tanguiéta', 'Toukountouna',
    'Malanville', 'Banikoara', 'Gogounou', 'Kandi', 'Karimama', 'Ségbana',
    'Djougou', 'Bassila', 'Ouaké',
    'Lokossa', 'Athiémé', 'Bopa', 'Comè', 'Grand-Popo', 'Houéyogbé',
    'Aplahoué', 'Djakotomey', 'Dogbo', 'Klouékanmè', 'Lalo', 'Toviklin',
    'Kétou', 'Pobè', 'Sakété', 'Adja-Ouèrè', 'Ifangni',
]

# code catégorie -> filtres Overpass (clé/valeur de tag OSM)
FILTRES_CATEGORIE = {
    'pharmacie': [('amenity', 'pharmacy')],
    'hopital-clinique': [('amenity', 'hospital'), ('amenity', 'clinic')],
    'station-service': [('amenity', 'fuel')],
    'centre-commercial-marche': [('shop', 'mall'), ('amenity', 'marketplace')],
    'garage-mecanicien': [('shop', 'car_repair')],
}


def _avec_retry(nom_operation, fonction, *args, **kwargs):
    """Exécute fonction(*args, **kwargs), qui doit lever une exception en cas d'échec.
    Retourne (résultat, nb_retries_declenches, a_reussi). Backoff exponentiel entre tentatives."""
    for tentative in range(1, MAX_TENTATIVES + 1):
        try:
            return fonction(*args, **kwargs), tentative - 1, True
        except (requests.RequestException, ValueError) as exc:
            est_derniere = tentative == MAX_TENTATIVES
            if est_derniere:
                logger.warning(
                    '%s : échec définitif après %d tentatives (%s)', nom_operation, MAX_TENTATIVES, exc
                )
            else:
                delai = DELAI_RETRY_BASE * (2 ** (tentative - 1))
                logger.warning(
                    '%s : tentative %d/%d échouée (%s) — nouvel essai dans %ds',
                    nom_operation, tentative, MAX_TENTATIVES, exc, delai
                )
                time.sleep(delai)
    return None, MAX_TENTATIVES - 1, False


def _geocoder_ville_brut(nom_ville):
    resp = requests.get(
        NOMINATIM_URL,
        params={'q': f'{nom_ville}, Bénin', 'format': 'json', 'limit': 1},
        headers=HEADERS,
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise ValueError('aucun résultat Nominatim')
    return float(data[0]['lat']), float(data[0]['lon'])


def _geocoder_ville(nom_ville):
    """Retourne (coords, nb_retries, a_reussi). coords=None si échec définitif.
    Ne devine jamais de coordonnées."""
    coords, retries, ok = _avec_retry(f'Géocodage de {nom_ville}', _geocoder_ville_brut, nom_ville)
    if not ok:
        logger.warning('Géocodage échoué pour %s (après %d tentatives)', nom_ville, MAX_TENTATIVES)
    return coords, retries, ok


def _construire_requete_overpass(lat, lon, rayon_m):
    clauses = []
    for filtres in FILTRES_CATEGORIE.values():
        for cle, valeur in filtres:
            clauses.append(f'node["{cle}"="{valeur}"](around:{rayon_m},{lat},{lon});')
            clauses.append(f'way["{cle}"="{valeur}"](around:{rayon_m},{lat},{lon});')
    return f'[out:json][timeout:30];\n(\n{"".join(c + chr(10) for c in clauses)});\nout center tags;'


def _overpass_brut(lat, lon, rayon_m):
    requete = _construire_requete_overpass(lat, lon, rayon_m)
    resp = requests.post(OVERPASS_URL, data={'data': requete}, headers=HEADERS, timeout=60)
    resp.raise_for_status()
    return resp.json().get('elements', [])


def _interroger_overpass(lat, lon, rayon_m, nom_ville):
    """Retourne (elements, nb_retries, a_reussi). elements=None si échec définitif."""
    elements, retries, ok = _avec_retry(
        f'Overpass pour {nom_ville}', _overpass_brut, lat, lon, rayon_m
    )
    if not ok:
        logger.warning('Requête Overpass échouée pour %s (après %d tentatives)', nom_ville, MAX_TENTATIVES)
    return elements, retries, ok


def _categorie_pour_tags(tags):
    """Trouve le code de catégorie correspondant aux tags OSM d'un élément, ou None."""
    for code, filtres in FILTRES_CATEGORIE.items():
        for cle, valeur in filtres:
            if tags.get(cle) == valeur:
                return code
    return None


def _adresse_depuis_tags(tags):
    numero = tags.get('addr:housenumber', '')
    rue = tags.get('addr:street', '')
    if numero or rue:
        return f'{numero} {rue}'.strip()
    return tags.get('addr:full', '')


def _extraire_service(element, ville):
    """Construit un dict prêt pour update_or_create, ou None si l'élément est inexploitable."""
    try:
        tags = element.get('tags') or {}
        nom = tags.get('name') or tags.get('name:fr')
        if not nom:
            return None
        code_categorie = _categorie_pour_tags(tags)
        if not code_categorie:
            return None

        if element['type'] == 'node':
            lat, lon = element.get('lat'), element.get('lon')
        else:
            centre = element.get('center') or {}
            lat, lon = centre.get('lat'), centre.get('lon')
        if lat is None or lon is None:
            return None

        # opening_hours : tag texte libre OSM, parfois absent ou dans un format non standard.
        # On le stocke tel quel s'il existe, sans tenter de le parser/valider — jamais bloquant.
        horaires = ''
        try:
            horaires = tags.get('opening_hours', '') or ''
        except Exception:
            horaires = ''

        return {
            'identifiant_externe': f'{element["type"]}/{element["id"]}',
            'code_categorie': code_categorie,
            'nom': nom,
            'adresse': _adresse_depuis_tags(tags),
            'ville': ville,
            'latitude': lat,
            'longitude': lon,
            'horaires': horaires,
        }
    except Exception as exc:
        logger.warning('Élément OSM ignoré (erreur de parsing) pour %s : %s', ville, exc)
        return None


class Command(BaseCommand):
    help = "Importe les services de proximité (pharmacies, hôpitaux...) depuis OpenStreetMap."

    def add_arguments(self, parser):
        parser.add_argument('--ville', type=str, default=None, help='Importer une seule ville.')
        parser.add_argument('--toutes-les-villes', action='store_true', help='Importer les 77 villes.')

    def handle(self, *args, **options):
        ville_unique = options.get('ville')
        toutes = options.get('toutes_les_villes')

        if not ville_unique and not toutes:
            raise CommandError('Précisez --ville="NomVille" ou --toutes-les-villes.')

        villes = [ville_unique] if ville_unique else VILLES_BENIN

        categories = {c.code: c for c in CategorieService.objects.all()}
        if not categories:
            raise CommandError(
                "Aucune catégorie en base. Lancez d'abord : manage.py seed_categories_assistance"
            )

        resume_par_ville = {}
        total_par_categorie = {code: 0 for code in FILTRES_CATEGORIE}
        villes_sans_resultat = []
        villes_incompletes = []  # au moins une catégorie à 0, mais pas complètement vide
        total_retries = 0
        echecs_definitifs = 0

        for i, ville in enumerate(villes):
            self.stdout.write(f'--- {ville} ({i + 1}/{len(villes)}) ---')
            coords, retries, ok = _geocoder_ville(ville)
            total_retries += retries
            time.sleep(DELAI_NOMINATIM)

            if not ok:
                echecs_definitifs += 1
                villes_sans_resultat.append(ville)
                resume_par_ville[ville] = {'erreur': 'géocodage échoué'}
                continue

            lat, lon = coords
            rayon = RAYON_VILLE_PRINCIPALE_M if ville in VILLES_PRINCIPALES else RAYON_PETITE_COMMUNE_M
            elements, retries, ok = _interroger_overpass(lat, lon, rayon, ville)
            total_retries += retries
            time.sleep(DELAI_OVERPASS)

            if not ok:
                echecs_definitifs += 1
                villes_sans_resultat.append(ville)
                resume_par_ville[ville] = {'erreur': 'requête Overpass échouée'}
                continue

            compte_ville = {code: 0 for code in FILTRES_CATEGORIE}
            for element in elements:
                donnees = _extraire_service(element, ville)
                if donnees is None:
                    continue
                code_categorie = donnees.pop('code_categorie')
                categorie = categories.get(code_categorie)
                if not categorie:
                    continue

                identifiant_externe = donnees.pop('identifiant_externe')
                # Ne jamais écraser une entrée corrigée manuellement.
                existant = ServiceProximite.objects.filter(identifiant_externe=identifiant_externe).first()
                if existant and existant.source == 'manuel':
                    continue

                ServiceProximite.objects.update_or_create(
                    identifiant_externe=identifiant_externe,
                    defaults={
                        'categorie': categorie,
                        'source': 'osm',
                        'actif': True,
                        **donnees,
                    }
                )
                compte_ville[code_categorie] += 1
                total_par_categorie[code_categorie] += 1

            for code, n in compte_ville.items():
                if n == 0:
                    self.stdout.write(f'  0 résultat pour {categories[code].nom} à {ville}')
                else:
                    self.stdout.write(f'  {n} résultat(s) pour {categories[code].nom} à {ville}')

            if sum(compte_ville.values()) == 0:
                villes_sans_resultat.append(ville)
            elif any(n == 0 for n in compte_ville.values()):
                villes_incompletes.append(ville)
            resume_par_ville[ville] = compte_ville

        # --- Résumé final ---
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=== Résumé de l\'import ==='))
        for code, total in total_par_categorie.items():
            self.stdout.write(f'{categories[code].nom} : {total} service(s) au total')
        self.stdout.write(f'Villes traitées : {len(villes)}')
        self.stdout.write(f'Villes sans aucun résultat (0 catégorie) : {len(villes_sans_resultat)} {villes_sans_resultat}')
        self.stdout.write(f'Villes avec au moins une catégorie à 0 : {len(villes_incompletes)} {villes_incompletes}')
        self.stdout.write(f'Total retries déclenchés : {total_retries}')
        self.stdout.write(f'Échecs définitifs après {MAX_TENTATIVES} tentatives : {echecs_definitifs}')
