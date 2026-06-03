from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Paiement
from .serializers import (
    CreationPaiementSerializer,
    DetailPaiementSerializer,
)
from accounts.permissions import IsCommercant, IsAdminUser


# ============================================================
# EFFECTUER UN PAIEMENT (Commerçant) — ESCROW
# ============================================================
class EffectuerPaiementView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def post(self, request):
        serializer = CreationPaiementSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            paiement = serializer.save()
            paiement.date_blocage = timezone.now()
            paiement.save()

            return Response(
                {
                    "message": f"Paiement de {paiement.montant} FCFA bloqué en escrow. "
                               f"Les fonds seront libérés après confirmation de livraison.",
                    "paiement": DetailPaiementSerializer(paiement).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# LIBERER LES FONDS (Commerçant — après confirmation livraison)
# ============================================================
class LibererFondsView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def put(self, request, pk):
        try:
            paiement = Paiement.objects.get(pk=pk, commercant=request.user)
        except Paiement.DoesNotExist:
            return Response(
                {"message": "Paiement non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )

        if paiement.statut != 'bloque':
            return Response(
                {"message": "Ce paiement ne peut pas être libéré."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if paiement.demande.statut != 'livree':
            return Response(
                {"message": "La livraison doit être confirmée avant de libérer les fonds."},
                status=status.HTTP_400_BAD_REQUEST
            )

        paiement.statut          = 'libere'
        paiement.date_liberation = timezone.now()
        paiement.save()

        return Response(
            {
                "message": f"Fonds de {paiement.montant} FCFA libérés au transporteur !",
                "paiement": DetailPaiementSerializer(paiement).data
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# REMBOURSER UN PAIEMENT (Admin — en cas de litige)
# ============================================================
class RembourserPaiementView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, pk):
        try:
            paiement = Paiement.objects.get(pk=pk)
        except Paiement.DoesNotExist:
            return Response(
                {"message": "Paiement non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )

        if paiement.statut != 'bloque':
            return Response(
                {"message": "Seuls les paiements bloqués peuvent être remboursés."},
                status=status.HTTP_400_BAD_REQUEST
            )

        paiement.statut             = 'rembourse'
        paiement.motif_remboursement = request.data.get('motif_remboursement', '')
        paiement.date_remboursement  = timezone.now()
        paiement.save()

        return Response(
            {
                "message": f"Paiement de {paiement.montant} FCFA remboursé au commerçant.",
                "paiement": DetailPaiementSerializer(paiement).data
            },
            status=status.HTTP_200_OK
        )


# ============================================================
# MON HISTORIQUE DE PAIEMENTS
# ============================================================
class MesPaiementsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'commercant':
            paiements = Paiement.objects.filter(commercant=request.user)
        elif request.user.role in ['transporteur', 'societe']:
            paiements = Paiement.objects.filter(transporteur=request.user)
        else:
            paiements = Paiement.objects.none()

        serializer = DetailPaiementSerializer(paiements, many=True)
        return Response(serializer.data)


# ============================================================
# DETAIL D'UN PAIEMENT
# ============================================================
class DetailPaiementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            paiement = Paiement.objects.get(pk=pk)
        except Paiement.DoesNotExist:
            return Response(
                {"message": "Paiement non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        if user.role == 'commercant' and paiement.commercant != user:
            return Response(
                {"message": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN
            )
        if user.role in ['transporteur', 'societe'] and paiement.transporteur != user:
            return Response(
                {"message": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DetailPaiementSerializer(paiement)
        return Response(serializer.data)


# ============================================================
# TOUS LES PAIEMENTS (Admin)
# ============================================================
class TousLesPaiementsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        paiements = Paiement.objects.all()
        serializer = DetailPaiementSerializer(paiements, many=True)
        return Response(serializer.data)