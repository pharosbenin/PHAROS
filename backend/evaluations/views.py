from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Avg, Count
from django.contrib.auth import get_user_model
from .models import Evaluation
from .serializers import (
    CreationEvaluationSerializer,
    DetailEvaluationSerializer,
    StatistiquesTransporteurSerializer,
)
from accounts.permissions import IsCommercant, IsAdminUser

User = get_user_model()


# ============================================================
# EVALUER UN TRANSPORTEUR (Commerçant)
# ============================================================
class EvaluerTransporteurView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def post(self, request):
        serializer = CreationEvaluationSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            evaluation = serializer.save()
            return Response(
                {
                    "message": "Évaluation soumise avec succès !",
                    "evaluation": DetailEvaluationSerializer(evaluation).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# STATISTIQUES ET EVALUATIONS D'UN TRANSPORTEUR (Public)
# ============================================================
class StatistiquesTransporteurView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            transporteur = User.objects.get(
                pk=pk,
                role__in=['transporteur', 'societe'],
                statut='valide'
            )
        except User.DoesNotExist:
            return Response(
                {"message": "Transporteur non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Récupérer toutes les évaluations
        evaluations = Evaluation.objects.filter(transporteur=transporteur)

        # Calculer les statistiques
        stats = evaluations.aggregate(
            note_moyenne=Avg('note'),
            nombre_evaluations=Count('id')
        )

        # Calculer le taux de réussite
        from demandes.models import Demande
        total_missions = Demande.objects.filter(
            transporteur=transporteur,
            statut__in=['livree', 'litige']
        ).count()

        missions_reussies = Demande.objects.filter(
            transporteur=transporteur,
            statut='livree'
        ).count()

        taux_reussite = (missions_reussies / total_missions * 100) if total_missions > 0 else 0

        # Nom du transporteur
        if transporteur.role == 'societe':
            nom = transporteur.nom_societe or transporteur.username
        else:
            nom = f"{transporteur.first_name} {transporteur.last_name}"

        data = {
            "transporteur_id": transporteur.id,
            "transporteur_nom": nom,
            "note_moyenne": round(stats['note_moyenne'] or 0, 2),
            "nombre_evaluations": stats['nombre_evaluations'],
            "nombre_livraisons": missions_reussies,
            "taux_reussite": round(taux_reussite, 2),
            "evaluations": DetailEvaluationSerializer(evaluations, many=True).data,
        }

        return Response(data)


# ============================================================
# MES EVALUATIONS RECUES (Transporteur)
# ============================================================
class MesEvaluationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        evaluations = Evaluation.objects.filter(transporteur=request.user)
        serializer = DetailEvaluationSerializer(evaluations, many=True)

        # Calculer note moyenne
        stats = evaluations.aggregate(note_moyenne=Avg('note'))

        return Response({
            "note_moyenne": round(stats['note_moyenne'] or 0, 2),
            "nombre_evaluations": evaluations.count(),
            "evaluations": serializer.data
        })


# ============================================================
# TOUTES LES EVALUATIONS (Admin)
# ============================================================
class ToutesLesEvaluationsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        evaluations = Evaluation.objects.all()
        serializer = DetailEvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)