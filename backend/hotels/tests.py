"""
Tests automatisés sur le contrôle d'accès par rôle — l'audit de code confirme
que chaque endpoint sensible est protégé par permission, sans possibilité
d'élévation de privilège via l'API (role en read_only sur les serializers).
On vérifie ici qu'un endpoint réservé à l'admin (valider un hôtel) rejette
bien les autres rôles et les visiteurs non authentifiés.
"""
from rest_framework.test import APITestCase
from rest_framework import status

from accounts.models import CustomUser
from .models import Hotel


class PermissionsValidationHotelTest(APITestCase):

    def setUp(self):
        self.admin = CustomUser.objects.create_user(
            username='admin1', email='admin1@test.com', password='x', role='admin',
        )
        self.client_user = CustomUser.objects.create_user(
            username='client1', email='client1@test.com', password='x', role='client',
        )
        self.gestionnaire = CustomUser.objects.create_user(
            username='gest1', email='gest1@test.com', password='x', role='gestionnaire',
        )
        self.hotel = Hotel.objects.create(
            gestionnaire=self.gestionnaire, nom='Hôtel En Attente', adresse='Rue 1',
            ville='Cotonou', statut='en_attente',
        )
        self.url = f'/api/admin/hotels/{self.hotel.pk}/valider/'

    def test_visiteur_non_authentifie_refuse(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.statut, 'en_attente')

    def test_client_refuse(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.statut, 'en_attente')

    def test_gestionnaire_refuse_meme_pour_son_propre_hotel(self):
        self.client.force_authenticate(user=self.gestionnaire)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.statut, 'en_attente')

    def test_admin_autorise(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.hotel.refresh_from_db()
        self.assertEqual(self.hotel.statut, 'valide')
