from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from .models import Offre
from .serializers import (
    DetailOffreSerializer,
    MesOffresSerializer,
)
from demandes.models import Demande
from accounts.permissions import IsTransporteur, IsCommercant, IsAdminUser


# ============================================================
# ACCEPTER UNE MISSION (Transporteur) — PREMIER ARRIVE
# ============================================================
class AccepterMissionView(APIView):
    permission_classes = [IsAuthenticated, IsTransporteur]

    def post(self, request, demande_pk):
        try:
            with transaction.atomic():
                # SELECT FOR UPDATE — premier arrivé premier servi
                demande = Demande.objects.select_for_update().get(pk=demande_pk)

                # Vérifier que la demande est disponible
                if demande.statut != 'publiee':
                    return Response(
                        {"message": "Cette demande n'est plus disponible."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Vérifier que le transporteur n'a pas déjà une offre sur cette demande
                if Offre.objects.filter(demande=demande, transporteur=request.user).exists():
                    return Response(
                        {"message": "Vous avez déjà accepté cette demande."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Vérifier mission en cours (transporteur indépendant uniquement)
                if request.user.role == 'transporteur':
                    mission_en_cours = Offre.objects.filter(
                        transporteur=request.user,
                        statut='acceptee',
                        demande__statut__in=['attribuee', 'en_transit']
                    ).exists()
                    if mission_en_cours:
                        return Response(
                            {"message": "Vous avez déjà une mission en cours."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                maintenant = timezone.now()

                # Créer l'offre
                offre = Offre.objects.create(
                    demande=demande,
                    transporteur=request.user,
                    statut='acceptee',
                    prix_propose=request.data.get('prix_propose'),
                    message=request.data.get('message', ''),
                    delai_propose=request.data.get('delai_propose'),
                    date_acceptation=maintenant,
                )

                # ── NOUVEAU ──────────────────────────────────────────
                # On ne met plus 'attribuee' directement
                # On passe en 'en_negociation' → négociation démarre
                demande.statut = 'en_negociation'
                demande.transporteur = request.user
                demande.date_attribution = maintenant
                demande.save()

                # Créer la négociation automatiquement
                from negociations.models import Negociation, MessageNegociation
                negociation = Negociation.objects.create(
                    offre=offre,
                    prix_initial=offre.prix_propose,
                    prix_transporteur=offre.prix_propose,
                )

                # Premier message dans l'historique
                MessageNegociation.objects.create(
                    negociation=negociation,
                    auteur_type='transporteur',
                    action='proposition',
                    montant=offre.prix_propose,
                    message=offre.message or 'Proposition initiale.'
                )
                # ─────────────────────────────────────────────────────

                return Response(
                    {
                        "message": "Négociation démarrée avec succès !",
                        "negociation_id": negociation.id,
                        "offre": DetailOffreSerializer(offre).data
                    },
                    status=status.HTTP_201_CREATED
                )

        except Demande.DoesNotExist:
            return Response(
                {"message": "Demande non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )


# ============================================================
# MES OFFRES / MISSIONS (Transporteur)
# ============================================================
class MesOffresView(APIView):
    permission_classes = [IsAuthenticated, IsTransporteur]

    def get(self, request):
        offres = Offre.objects.filter(transporteur=request.user)
        serializer = MesOffresSerializer(offres, many=True)
        return Response(serializer.data)


# ============================================================
# DETAIL D'UNE OFFRE
# ============================================================
class DetailOffreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            offre = Offre.objects.get(pk=pk)
        except Offre.DoesNotExist:
            return Response(
                {"message": "Offre non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        if user.role in ['transporteur', 'societe'] and offre.transporteur != user:
            return Response({"message": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'commercant' and offre.demande.commercant != user:
            return Response({"message": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        serializer = DetailOffreSerializer(offre)
        return Response(serializer.data)


# ============================================================
# ANNULER UNE OFFRE (Transporteur)
# ============================================================
class AnnulerOffreView(APIView):
    permission_classes = [IsAuthenticated, IsTransporteur]

    def put(self, request, pk):
        try:
            offre = Offre.objects.get(pk=pk, transporteur=request.user)
        except Offre.DoesNotExist:
            return Response(
                {"message": "Offre non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        if offre.statut != 'acceptee':
            return Response(
                {"message": "Impossible d'annuler cette offre."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            offre.statut = 'annulee'
            offre.save()

            # Remettre la demande en publiée
            offre.demande.statut = 'publiee'
            offre.demande.transporteur = None
            offre.demande.date_attribution = None
            offre.demande.save()

        return Response(
            {"message": "Offre annulée. La demande est de nouveau disponible."},
            status=status.HTTP_200_OK
        )


# ============================================================
# TOUTES LES OFFRES (Admin)
# ============================================================
class ToutesLesOffresView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        offres = Offre.objects.all()
        serializer = DetailOffreSerializer(offres, many=True)
        return Response(serializer.data)