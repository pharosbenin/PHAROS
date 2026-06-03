from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Livraison
from .serializers import (
    DetailLivraisonSerializer,
    MiseAJourStatutSerializer,
    ConfirmationLivraisonSerializer,
)
from demandes.models import Demande
from accounts.permissions import IsTransporteur, IsCommercant, IsAdminUser


# ============================================================
# CREER UNE LIVRAISON (automatique après acceptation mission)
# ============================================================
class CreerLivraisonView(APIView):
    permission_classes = [IsAuthenticated, IsTransporteur]

    def post(self, request, demande_pk):
        try:
            demande = Demande.objects.get(pk=demande_pk, transporteur=request.user)
        except Demande.DoesNotExist:
            return Response(
                {"message": "Demande non trouvée ou non attribuée."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Vérifier que la livraison n'existe pas déjà
        if hasattr(demande, 'livraison'):
            return Response(
                {"message": "Une livraison existe déjà pour cette demande."},
                status=status.HTTP_400_BAD_REQUEST
            )

        livraison = Livraison.objects.create(
            demande=demande,
            transporteur=request.user,
            commercant=demande.commercant,
            statut='en_attente'
        )

        serializer = DetailLivraisonSerializer(livraison)
        return Response(
            {"message": "Livraison créée avec succès.", "livraison": serializer.data},
            status=status.HTTP_201_CREATED
        )


# ============================================================
# METTRE A JOUR LE STATUT (Transporteur)
# ============================================================
class MettreAJourStatutView(APIView):
    permission_classes = [IsAuthenticated, IsTransporteur]

    def put(self, request, pk):
        try:
            livraison = Livraison.objects.get(pk=pk, transporteur=request.user)
        except Livraison.DoesNotExist:
            return Response(
                {"message": "Livraison non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = MiseAJourStatutSerializer(livraison, data=request.data, partial=True)
        if serializer.is_valid():
            nouveau_statut = serializer.validated_data.get('statut')

            # Mettre à jour les dates selon le statut
            if nouveau_statut == 'en_chargement':
                livraison.date_chargement = timezone.now()
            elif nouveau_statut == 'en_transit':
                livraison.date_transit = timezone.now()
                # Mettre à jour la demande aussi
                livraison.demande.statut = 'en_transit'
                livraison.demande.save()
            elif nouveau_statut == 'livre':
                livraison.date_livraison = timezone.now()
                livraison.demande.statut = 'livree'
                livraison.demande.save()
            elif nouveau_statut == 'litige':
                livraison.demande.statut = 'litige'
                livraison.demande.save()

            serializer.save()
            return Response(
                {"message": f"Statut mis à jour : {nouveau_statut}"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# CONFIRMER LA LIVRAISON (Commerçant)
# ============================================================
class ConfirmerLivraisonView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def put(self, request, pk):
        try:
            livraison = Livraison.objects.get(pk=pk, commercant=request.user)
        except Livraison.DoesNotExist:
            return Response(
                {"message": "Livraison non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        if livraison.statut != 'livre':
            return Response(
                {"message": "Vous ne pouvez confirmer que les livraisons avec statut 'Livré'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ConfirmationLivraisonSerializer(livraison, data=request.data, partial=True)
        if serializer.is_valid():
            confirmation = serializer.validated_data.get('confirmation')

            livraison.date_confirmation = timezone.now()

            # Si problème signalé → litige
            if confirmation == 'probleme_signale':
                livraison.statut = 'litige'
                livraison.demande.statut = 'litige'
                livraison.demande.save()

            serializer.save()
            return Response(
                {"message": "Livraison confirmée avec succès."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# DETAIL LIVRAISON
# ============================================================
class DetailLivraisonView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            livraison = Livraison.objects.get(pk=pk)
        except Livraison.DoesNotExist:
            return Response(
                {"message": "Livraison non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        if user.role == 'commercant' and livraison.commercant != user:
            return Response({"message": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        if user.role in ['transporteur', 'societe'] and livraison.transporteur != user:
            return Response({"message": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        serializer = DetailLivraisonSerializer(livraison)
        return Response(serializer.data)


# ============================================================
# MES LIVRAISONS (Transporteur)
# ============================================================
class MesLivraisonsTransporteurView(APIView):
    permission_classes = [IsAuthenticated, IsTransporteur]

    def get(self, request):
        livraisons = Livraison.objects.filter(transporteur=request.user)
        serializer = DetailLivraisonSerializer(livraisons, many=True)
        return Response(serializer.data)


# ============================================================
# MES LIVRAISONS (Commerçant)
# ============================================================
class MesLivraisonsCommercantView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def get(self, request):
        livraisons = Livraison.objects.filter(commercant=request.user)
        serializer = DetailLivraisonSerializer(livraisons, many=True)
        return Response(serializer.data)


# ============================================================
# TOUTES LES LIVRAISONS (Admin)
# ============================================================
class ToutesLesLivraisonsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        livraisons = Livraison.objects.all()
        serializer = DetailLivraisonSerializer(livraisons, many=True)
        return Response(serializer.data)