

# Create your views here.
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Demande
from .serializers import (
    CreationDemandeSerializer,
    ListeDemandesSerializer,
    DetailDemandeSerializer,
    MesDemandesSerializer,
)
from accounts.permissions import IsCommercant, IsTransporteur, IsAdminUser


# ============================================================
# PUBLIER UNE DEMANDE (Commerçant)
# ============================================================
class PublierDemandeView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def post(self, request):
        serializer = CreationDemandeSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Demande publiée avec succès.", "demande": serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# LISTE DES DEMANDES DISPONIBLES (Transporteur)
# ============================================================
class ListeDemandesDisponiblesView(APIView):
    permission_classes = [IsAuthenticated, IsTransporteur]

    def get(self, request):
        # Uniquement les demandes publiées
        demandes = Demande.objects.filter(statut='publiee')

        # Filtres optionnels
        ville_depart = request.query_params.get('ville_depart')
        ville_destination = request.query_params.get('ville_destination')
        type_marchandise = request.query_params.get('type_marchandise')
        niveau_urgence = request.query_params.get('niveau_urgence')
        tonnage_min = request.query_params.get('tonnage_min')
        tonnage_max = request.query_params.get('tonnage_max')

        if ville_depart:
            demandes = demandes.filter(ville_depart=ville_depart)
        if ville_destination:
            demandes = demandes.filter(ville_destination=ville_destination)
        if type_marchandise:
            demandes = demandes.filter(type_marchandise=type_marchandise)
        if niveau_urgence:
            demandes = demandes.filter(niveau_urgence=niveau_urgence)
        if tonnage_min:
            demandes = demandes.filter(tonnage__gte=tonnage_min)
        if tonnage_max:
            demandes = demandes.filter(tonnage__lte=tonnage_max)

        serializer = ListeDemandesSerializer(demandes, many=True)
        return Response(serializer.data)


# ============================================================
# MES DEMANDES (Commerçant)
# ============================================================
class MesDemandesView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def get(self, request):
        demandes = Demande.objects.filter(commercant=request.user)
        serializer = MesDemandesSerializer(demandes, many=True)
        return Response(serializer.data)


# ============================================================
# DETAIL D'UNE DEMANDE
# ============================================================
class DetailDemandeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            demande = Demande.objects.get(pk=pk)
        except Demande.DoesNotExist:
            return Response(
                {"message": "Demande non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Commerçant voit sa propre demande
        # Transporteur voit uniquement les demandes publiées ou qui lui sont attribuées
        user = request.user
        if user.role == 'commercant' and demande.commercant != user:
            return Response(
                {"message": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN
            )
        if user.role in ['transporteur', 'societe']:
            if demande.statut == 'publiee' or demande.transporteur == user:
                pass
            else:
                return Response(
                    {"message": "Accès refusé."},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = DetailDemandeSerializer(demande)
        return Response(serializer.data)


# ============================================================
# MODIFIER UNE DEMANDE (Commerçant)
# ============================================================
class ModifierDemandeView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def put(self, request, pk):
        try:
            demande = Demande.objects.get(pk=pk, commercant=request.user)
        except Demande.DoesNotExist:
            return Response(
                {"message": "Demande non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        # On ne peut modifier que les demandes publiées
        if demande.statut != 'publiee':
            return Response(
                {"message": "Impossible de modifier une demande déjà attribuée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CreationDemandeSerializer(
            demande, data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# SUPPRIMER UNE DEMANDE (Commerçant)
# ============================================================
class SupprimerDemandeView(APIView):
    permission_classes = [IsAuthenticated, IsCommercant]

    def delete(self, request, pk):
        try:
            demande = Demande.objects.get(pk=pk, commercant=request.user)
        except Demande.DoesNotExist:
            return Response(
                {"message": "Demande non trouvée."},
                status=status.HTTP_404_NOT_FOUND
            )

        if demande.statut != 'publiee':
            return Response(
                {"message": "Impossible de supprimer une demande déjà attribuée."},
                status=status.HTTP_400_BAD_REQUEST
            )

        demande.delete()
        return Response(
            {"message": "Demande supprimée avec succès."},
            status=status.HTTP_204_NO_CONTENT
        )


# ============================================================
# TOUTES LES DEMANDES (Admin)
# ============================================================
class ToutesLesDemandesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        demandes = Demande.objects.all()
        serializer = DetailDemandeSerializer(demandes, many=True)
        return Response(serializer.data)