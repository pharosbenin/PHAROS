from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    InscriptionCommercantSerializer,
    InscriptionSocieteSerializer,
    InscriptionTransporteurSerializer,
    ProfilUtilisateurSerializer,
    ProfilPublicTransporteurSerializer,
    ValidationCompteSerializer,
)
from .permissions import IsAdminUser

User = get_user_model()


# ============================================================
# CONNEXION UNIQUE (email ou téléphone + mot de passe)
# ============================================================
class ConnexionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifiant = request.data.get('identifiant')  # email ou téléphone
        password = request.data.get('password')

        if not identifiant or not password:
            return Response(
                {"message": "Identifiant et mot de passe requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cherche par email OU téléphone
        try:
            user = User.objects.get(
                Q(email=identifiant) | Q(telephone=identifiant)
            )
        except User.DoesNotExist:
            return Response(
                {"message": "Identifiants incorrects."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Vérifie le mot de passe
        if not user.check_password(password):
            return Response(
                {"message": "Identifiants incorrects."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Vérifie le statut du compte
        if user.statut == 'en_attente':
            return Response(
                {"message": "Votre compte est en attente de validation par l'administrateur."},
                status=status.HTTP_403_FORBIDDEN
            )
        if user.statut == 'rejete':
            return Response(
                {"message": "Votre compte a été rejeté. Contactez l'administrateur."},
                status=status.HTTP_403_FORBIDDEN
            )
        if user.statut == 'suspendu':
            return Response(
                {"message": "Votre compte a été suspendu. Contactez l'administrateur."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Génération des tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": user.role,
            "username": user.username,
            "statut": user.statut,
            "message": "Connexion réussie."
        }, status=status.HTTP_200_OK)


# ============================================================
# INSCRIPTION COMMERCANT
# ============================================================
class InscriptionCommercantView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InscriptionCommercantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Compte commerçant créé. En attente de validation."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# INSCRIPTION SOCIETE DE TRANSPORT
# ============================================================
class InscriptionSocieteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InscriptionSocieteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Compte société créé. En attente de validation."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# INSCRIPTION TRANSPORTEUR INDEPENDANT
# ============================================================
class InscriptionTransporteurView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InscriptionTransporteurSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Compte transporteur créé. En attente de validation."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# PROFIL UTILISATEUR CONNECTE
# ============================================================
class MonProfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfilUtilisateurSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfilUtilisateurSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# PROFIL PUBLIC TRANSPORTEUR
# ============================================================
class ProfilPublicTransporteurView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            transporteur = User.objects.get(pk=pk, role__in=['transporteur', 'societe'])
            serializer = ProfilPublicTransporteurSerializer(transporteur)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"message": "Transporteur non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )


# ============================================================
# LISTE DES COMPTES EN ATTENTE (ADMIN)
# ============================================================
class ComptesEnAttenteView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        comptes = User.objects.filter(statut='en_attente')
        serializer = ValidationCompteSerializer(comptes, many=True)
        return Response(serializer.data)


# ============================================================
# VALIDER OU REJETER UN COMPTE (ADMIN)
# ============================================================
class ValiderCompteView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"message": "Utilisateur non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )

        nouveau_statut = request.data.get('statut')
        if nouveau_statut not in ['valide', 'rejete', 'suspendu']:
            return Response(
                {"message": "Statut invalide. Choisir : valide, rejete, suspendu."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.statut = nouveau_statut
        user.save()
        return Response(
            {"message": f"Compte {nouveau_statut} avec succès."},
            status=status.HTTP_200_OK
        )


# ============================================================
# LISTE DE TOUS LES UTILISATEURS (ADMIN)
# ============================================================
class ListeUtilisateursView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all()
        serializer = ProfilUtilisateurSerializer(users, many=True)
        return Response(serializer.data)
    







# ============================================================
# DETAIL COMPLET D'UN UTILISATEUR (ADMIN)
# ============================================================
class DetailUtilisateurAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            serializer = ValidationCompteSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"message": "Utilisateur non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )