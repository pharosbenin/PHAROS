import requests
from django.conf import settings


class FedaPayError(Exception):
    pass


def _headers():
    return {
        'Authorization': f'Bearer {settings.FEDAPAY_SECRET_KEY}',
        'Content-Type': 'application/json',
    }


def creer_transaction(*, montant, description, reservation_numero, prenom, nom, email):
    """Crée une transaction FedaPay et retourne (transaction_id, payment_url)."""
    payload = {
        'description': description,
        'amount': int(montant),
        'currency': {'iso': 'XOF'},
        'callback_url': f'{settings.FRONTEND_URL}/paiement/retour?reservation={reservation_numero}',
        'customer': {'firstname': prenom, 'lastname': nom, 'email': email},
    }
    resp = requests.post(f'{settings.FEDAPAY_BASE_URL}/v1/transactions', json=payload, headers=_headers(), timeout=15)
    if resp.status_code not in (200, 201):
        raise FedaPayError(f'Création transaction échouée ({resp.status_code}): {resp.text}')
    data = resp.json()['v1/transaction']
    return str(data['id']), data['payment_url']


def statut_transaction(transaction_id):
    """Interroge FedaPay et retourne le statut réel de la transaction."""
    resp = requests.get(f'{settings.FEDAPAY_BASE_URL}/v1/transactions/{transaction_id}', headers=_headers(), timeout=15)
    if resp.status_code != 200:
        raise FedaPayError(f'Lecture transaction échouée ({resp.status_code}): {resp.text}')
    data = resp.json()['v1/transaction']
    return data['status']
