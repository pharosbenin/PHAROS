"""
Le filtre de mots interdits n'existait auparavant que côté client
(Frontend/src/pages/client/EspaceClient.jsx), ce qui le rendait contournable
par quiconque appelle l'API directement (Postman, script...). Ce module
reprend la même liste côté serveur, seul rempart réellement fiable —
le filtre côté client reste utile pour le confort utilisateur (retour
immédiat, sans aller-retour serveur) mais ne suffit pas seul.
"""
import unicodedata

# Liste identique à MOTS_INTERDITS dans Frontend/src/pages/client/EspaceClient.jsx —
# à garder synchronisée si l'une des deux listes évolue.
MOTS_INTERDITS = [
    # -- Grossièretés françaises --
    'merde', 'putain', 'connard', 'connasse', 'salope', 'enculé', 'encule', 'fdp',
    'nique', 'niquer', 'conne', 'pute', 'bâtard', 'batard', 'fils de pute',
    'ta gueule', 'ferme ta gueule', 'va te faire foutre', 'va te faire',
    'couille', 'bite', 'chier', 'chiotte', 'branler', 'branleur', 'branlette',
    'fumier', 'ordure', 'porc', 'cochon', 'salopard', 'saloperie',
    'ntm', 'pd', 'gouine', 'tapette', 'va mourir', 'crève',

    # -- Insultes sur la compétence / malhonnêteté --
    'arnaqueur', 'arnaque', 'escroc', 'escroquerie', 'voleur', 'voleuse', 'voleurs',
    'menteur', 'menteuse', 'fraudeur', 'fraudeuse', 'fraude', 'corrompu', 'corrupt',
    'incompétent', 'incompétente', 'incapable', 'nul', 'nulle', 'zéro', 'minus',
    'paresseux', 'paresseuse', 'fainéant', 'fainéante', 'bon à rien', 'bonne à rien',
    'manipulateur', 'manipulatrice', 'hypocrite', 'malhonnête', 'traître', 'traîtresse',
    'imposteur', 'charlatan', 'bandit', 'brigand', 'racket', 'racketteur',

    # -- Insultes sur l'hygiène / l'état --
    'dégueulasse', 'crade', 'crasseux', 'crasseuse', 'infesté', 'infestée',
    'pouilleux', 'pouilleuse', 'miteux', 'miteuse', 'sordide', 'immonde',
    'répugnant', 'répugnante', 'infect', 'puant', 'puante',

    # -- Insultes d'intelligence --
    'imbécile', 'idiot', 'idiote', 'crétin', 'crétine', 'abruti', 'abrutie',
    'débile', 'demeuré', 'demeurée', 'attardé', 'attardée', 'mongol', 'simplet',
    'âne', 'baudet', 'ignorant', 'analphabète',

    # -- Menaces --
    'je vais te', 'on va te', 'tu vas voir', 'tu vas le regretter', 'gare à toi',
    'tu vas payer', 'je vais vous', 'on va vous', 'je te jure', 'je te promets que',
    'je vais détruire', 'je vais signaler', 'je vais ruiner', 'porter plainte contre',
    'je vais poster', 'je vais publier partout',

    # -- Insultes familiales --
    'ta mère', 'ton père', 'ta famille', 'famille de', 'race de', 'engeance',
    'bâtard de', 'fils de', 'fille de',

    # -- Insultes raciales / ethniques (à filtrer) --
    'sale noir', 'sale blanc', 'sale yovo', 'yovo sal', 'négro', 'nègre', 'toubab',
    'sale toubab', 'raciste', 'xénophobe',

    # -- Argot béninois / africain français --
    'go chercher', 'dégage', 'casse-toi', 'fous le camp', 'dégages de là',
    'gros naze', 'naze', 'looser', 'loser', 'bouffon', 'clown', 'guignol',
    "je m'en fous", 'charlatans', 'gbèzounmè', 'gnon', 'wayo', 'wayô',
    'akpan', 'aboki sale', 'milieu de voleurs', 'bordel',

    # -- Anglais --
    'fuck', 'fucking', 'shit', 'bullshit', 'asshole', 'bastard', 'bitch',
    'damn', 'crap', 'whore', 'slut', 'stupid', 'fool', 'dumbass', 'idiot',
    'shut up', 'moron', 'jerk', 'scumbag', 'scammer', 'thief', 'liar',
    'disgusting', 'pathetic', 'useless', 'worthless', 'trash', 'garbage',
    'terrible', 'horrible', 'awful',

    # -- Fon / Goun (Bénin sud) --
    'wê wê', 'gbeto', 'kpakpa', 'gbê gbê', 'a to bo', 'mi kpe bo',
    'afin', 'alodji', 'gbigba', 'vo nudo', 'azan do we', 'fon non',
    'do non', 'ko gbê', 'hun mi', 'kpé azan', 'mi na we', 'akpà',
    'gbeto do', 'agbanlin', 'wlovi', 'aziza', 'do kpé',

    # -- Yoruba / Nago (courant au Bénin) --
    'ashawo', 'werey', 'oloshi', 'ode', 'kpata', 'oshi', 'olosho', 'ole',
    'were', 'agbaya', 'ori e daru', 'idinwo', 'omo ale', 'ode buruku',
    'oloriburuku', 'eranko', 'asin', 'aparo', 'omu', 'orun re', 'iya e',
    'baba e', 'gbomo', 'omo ibon', 'jati jati', 'omo buruku',

    # -- Mina / Ewe (côte béninoise) --
    'gbedze', 'nyonuvi', 'atike', 'lo vi', 'devi', 'nyonu kple',
    'ame vovi', 'wu mi', 'kuku', 'ame nyui melo',

    # -- Dendi / Bariba / Peul (nord Bénin) --
    'banzari', 'mahaukaci', 'karuwanci', 'wawa', 'banza', 'gwauron',
    'karuwa', 'dundumi', 'hauka', 'iska', 'dan iska', 'gidan iska',
]

def contient_mot_interdit(texte: str) -> bool:
    """Reproduit la logique du filtre client : normalisation des accents
    (NFD) puis recherche de sous-chaîne, insensible à la casse."""
    if not texte:
        return False
    normalise = unicodedata.normalize('NFD', texte.lower())
    normalise = ''.join(c for c in normalise if unicodedata.category(c) != 'Mn')
    for mot in MOTS_INTERDITS:
        mot_normalise = unicodedata.normalize('NFD', mot.lower())
        mot_normalise = ''.join(c for c in mot_normalise if unicodedata.category(c) != 'Mn')
        if mot_normalise in normalise:
            return True
    return False
