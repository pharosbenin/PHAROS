"""
Tests automatisés sur les parcours critiques identifiés par l'audit de code
(AUDIT_CODE_PHAROS.md) : paiement, escrow (double confirmation), permissions.
Le projet ne comportait auparavant aucun test automatisé (tests manuels
uniquement, voir chapitre 5 du mémoire) — ces tests couvrent les scénarios
les plus sensibles, pas l'ensemble du code.
"""
from decimal import Decimal
from unittest.mock import patch

from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import CustomUser
from hotels.models import Hotel, TypeChambre
from .models import Reservation, Paiement
from commissions.models import Commission


def _creer_hotel_et_chambre(gestionnaire):
    hotel = Hotel.objects.create(
        gestionnaire=gestionnaire, nom='Hôtel Test', adresse='Rue 1',
        ville='Cotonou', statut='valide',
    )
    chambre = TypeChambre.objects.create(
        hotel=hotel, nom='Chambre Standard', capacite=2, prix_nuit=Decimal('20000'),
    )
    return hotel, chambre


def _creer_reservation(hotel, chambre, client=None, statut='en_attente', date_depart=None):
    return Reservation.objects.create(
        client=client, hotel=hotel, type_chambre=chambre,
        nom_client='Doe', prenom_client='John', email_client='john@test.com',
        telephone_client='0164616138',
        date_arrivee=timezone.now().date(), date_depart=date_depart or timezone.now().date(),
        prix_total=Decimal('20000'), statut=statut,
    )


class EscrowDoubleConfirmationTest(APITestCase):
    """L'audit confirme le principe d'escrow (fonds retenus jusqu'à double
    confirmation) — on vérifie ici qu'il est réellement appliqué : les fonds
    ne sont libérés (statut 'terminee') que lorsque le CLIENT ET l'HÔTEL
    ont tous les deux confirmé, jamais après une seule confirmation."""

    def setUp(self):
        self.gestionnaire = CustomUser.objects.create_user(
            username='gest1', email='gest1@test.com', password='x', role='gestionnaire',
        )
        self.hotel, self.chambre = _creer_hotel_et_chambre(self.gestionnaire)
        # date_depart = aujourd'hui : garantit qu'on est dans la fenêtre de
        # confirmation (>= 5h avant le départ), sans dépendre de l'heure du test.
        self.reservation = _creer_reservation(
            self.hotel, self.chambre, statut='en_cours', date_depart=timezone.now().date(),
        )
        Paiement.objects.create(
            reservation=self.reservation, montant=Decimal('20000'),
            montant_commission=Decimal('600'), montant_hotel=Decimal('19400'),
            methode='mtn', statut='reussi',
        )

    def test_une_seule_confirmation_ne_libere_pas_les_fonds(self):
        self.client.force_authenticate(user=self.gestionnaire)
        url = f'/api/reservations/{self.reservation.numero}/confirmer-sejour-hotel/'
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.statut, 'confirme_hotel')
        self.assertNotEqual(self.reservation.statut, 'terminee')

    def test_double_confirmation_libere_les_fonds(self):
        # Le client a déjà confirmé en premier.
        self.reservation.statut = 'confirme_client'
        self.reservation.save(update_fields=['statut'])

        self.client.force_authenticate(user=self.gestionnaire)
        url = f'/api/reservations/{self.reservation.numero}/confirmer-sejour-hotel/'
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.statut, 'terminee')
        self.assertTrue(self.reservation.avis_disponible)

    def test_gestionnaire_dun_autre_hotel_ne_peut_pas_confirmer(self):
        # Doit posséder un hôtel validé (permission EstHotelValide), mais pas
        # CELUI de la réservation qu'il tente de confirmer.
        autre_gestionnaire = CustomUser.objects.create_user(
            username='gest2', email='gest2@test.com', password='x', role='gestionnaire',
        )
        _creer_hotel_et_chambre(autre_gestionnaire)

        self.client.force_authenticate(user=autre_gestionnaire)
        url = f'/api/reservations/{self.reservation.numero}/confirmer-sejour-hotel/'
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.statut, 'en_cours')


class PaiementTest(APITestCase):
    """L'audit note que la vérification du paiement se fait bien côté serveur
    (interrogation de FedaPay), pas sur simple déclaration du client. On mocke
    l'appel réseau à FedaPay (aucune vraie requête sortante dans les tests)."""

    def setUp(self):
        self.gestionnaire = CustomUser.objects.create_user(
            username='gest3', email='gest3@test.com', password='x', role='gestionnaire',
        )
        self.hotel, self.chambre = _creer_hotel_et_chambre(self.gestionnaire)
        self.reservation = _creer_reservation(self.hotel, self.chambre, statut='payee')
        self.paiement = Paiement.objects.create(
            reservation=self.reservation, montant=Decimal('20000'),
            montant_commission=Decimal('600'), montant_hotel=Decimal('19400'),
            methode='mtn', statut='en_attente', reference_externe='txn_123',
        )

    @patch('reservations.fedapay.statut_transaction', return_value='approved')
    def test_paiement_approuve_marque_la_reservation_payee(self, mock_statut):
        url = f'/api/reservations/{self.reservation.numero}/paiement/statut/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['statut'], 'reussi')
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.statut, 'reussi')
        self.assertTrue(Commission.objects.filter(paiement=self.paiement).exists())

    @patch('reservations.fedapay.statut_transaction', return_value='declined')
    def test_paiement_refuse_nest_pas_marque_payee(self, mock_statut):
        self.paiement.statut = 'en_attente'
        self.paiement.save(update_fields=['statut'])

        url = f'/api/reservations/{self.reservation.numero}/paiement/statut/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['statut'], 'echoue')
        self.paiement.refresh_from_db()
        self.assertEqual(self.paiement.statut, 'echoue')
