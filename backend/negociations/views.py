from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from offres.models import Offre
from .models import Negociation, MessageNegociation
from .serializers import NegociationSerializer


# ================================================================
# 1. DÉMARRER LA NÉGOCIATION
#    Transporteur clique "Accepter" dans /offres
#    → Premier arrivé premier servi (SELECT FOR UPDATE)
# ================================================================
class DemarrerNegociationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        demande_id  = request.data.get('demande_id')
        prix_propose = request.data.get('prix_propose')

        if not demande_id:
            return Response(
                {'detail': 'demande_id est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            from demandes.models import Demande

            # Verrouillage pessimiste — premier arrivé premier servi
            demande = get_object_or_404(
                Demande.objects.select_for_update(),
                id=demande_id,
                statut='publiee'
            )

            # Vérifier qu'une offre n'existe pas déjà pour ce transporteur
            offre_existante = Offre.objects.filter(
                demande=demande,
                transporteur=request.user
            ).first()

            if offre_existante:
                # Vérifier si une négociation existe déjà
                if hasattr(offre_existante, 'negociation'):
                    return Response(
                        {'detail': 'Vous avez déjà une négociation en cours.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                offre = offre_existante
            else:
                # Créer l'offre
                offre = Offre.objects.create(
                    demande=demande,
                    transporteur=request.user,
                    prix_propose=prix_propose,
                    statut='acceptee',
                    date_acceptation=timezone.now()
                )

            # Créer la négociation
            negociation = Negociation.objects.create(
                offre=offre,
                prix_initial=prix_propose,
                prix_transporteur=prix_propose,
            )

            # Demande → en_negociation
            # Les autres transporteurs voient "En discussion"
            demande.statut = 'en_negociation'
            demande.transporteur = request.user
            demande.save()

            # Premier message dans l'historique
            MessageNegociation.objects.create(
                negociation=negociation,
                auteur_type='transporteur',
                action='proposition',
                montant=prix_propose,
                message='Proposition initiale.'
            )

        serializer = NegociationSerializer(negociation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ================================================================
# 2. RÉCUPÉRER LA NÉGOCIATION + HISTORIQUE
#    Chargement de la page /negociationprix
# ================================================================
class NegociationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, negociation_id):
        negociation = get_object_or_404(Negociation, id=negociation_id)
        self._verifier_acces(request.user, negociation)
        serializer = NegociationSerializer(negociation)
        return Response(serializer.data)

    def _verifier_acces(self, user, negociation):
        commercant   = negociation.offre.demande.commercant
        transporteur = negociation.offre.transporteur
        if user not in [commercant, transporteur]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Accès non autorisé.")


# ================================================================
# 3. BOUTON "ENVOYER" — contre-proposition (CORRIGÉ)
# ================================================================
class EnvoyerPropositionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, negociation_id):
        negociation = get_object_or_404(
            Negociation, id=negociation_id, statut='en_cours'
        )

        commercant   = negociation.offre.demande.commercant
        transporteur = negociation.offre.transporteur
        montant      = request.data.get('montant')
        message      = request.data.get('message', '')

        if not montant:
            return Response(
                {'detail': 'Le montant est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user == transporteur:
            auteur = 'transporteur'
            negociation.prix_transporteur = montant
        elif request.user == commercant:
            auteur = 'commercant'
            negociation.prix_commercant = montant
        else:
            # FIX 1 : Le "return" bloque définitivement l'accès aux utilisateurs non autorisés
            return Response(
                {'detail': 'Non autorisé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # FIX 2 : Utilisation d'une transaction atomique pour garantir l'intégrité de la bdd
        with transaction.atomic():
            negociation.save()

            MessageNegociation.objects.create(
                negociation=negociation,
                auteur_type=auteur,
                action='proposition',
                montant=montant,
                message=message
            )

        return Response(NegociationSerializer(negociation).data)


# ================================================================
# 4. BOUTON "ACCEPTER" — accord trouvé (CORRIGÉ)
# ================================================================
class AccepterNegociationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, negociation_id):
        # Utilisation de select_for_update pour éviter qu'on clique deux fois en même temps
        with transaction.atomic():
            negociation = get_object_or_404(
                Negociation.objects.select_for_update(), id=negociation_id, statut='en_cours'
            )

            commercant   = negociation.offre.demande.commercant
            transporteur = negociation.offre.transporteur

            if request.user not in [commercant, transporteur]:
                return Response(
                    {'detail': 'Non autorisé.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            auteur = 'transporteur' if request.user == transporteur else 'commercant'

            # FIX 3 : On récupère dynamiquement le montant de la dernière proposition tarifaire émise
            dernier_message = negociation.messages.filter(action='proposition').last()
            prix_final = dernier_message.montant if dernier_message else negociation.prix_initial

            # Clôturer la négociation
            negociation.statut           = 'acceptee'
            negociation.prix_final_convenu = prix_final
            negociation.save()

            # Demande → attribuée (disparaît pour les autres transporteurs)
            demande = negociation.offre.demande
            demande.statut           = 'attribuee'
            demande.date_attribution = timezone.now()
            demande.save()

            MessageNegociation.objects.create(
                negociation=negociation,
                auteur_type=auteur,
                action='acceptation',
                montant=prix_final,
                message='Accord conclu. La livraison peut démarrer.'
            )

        return Response({
            'detail': 'Négociation acceptée.',
            'prix_final': prix_final,
            'negociation_id': negociation.id
        })
# ================================================================
# 5. BOUTON "REFUSER" — pas d'accord
# ================================================================
class RefuserNegociationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, negociation_id):
        negociation = get_object_or_404(
            Negociation, id=negociation_id, statut='en_cours'
        )

        commercant   = negociation.offre.demande.commercant
        transporteur = negociation.offre.transporteur

        if request.user not in [commercant, transporteur]:
            return Response(
                {'detail': 'Non autorisé.'},
                status=status.HTTP_403_FORBIDDEN
            )

        auteur = (
            'transporteur' if request.user == transporteur
            else 'commercant'
        )

        # Clôturer la négociation
        negociation.statut = 'refusee'
        negociation.save()

        # Offre → annulée
        offre        = negociation.offre
        offre.statut = 'annulee'
        offre.save()

        # Demande → publiée (redevient visible pour tous)
        demande              = offre.demande
        demande.statut       = 'publiee'
        demande.transporteur = None
        demande.save()

        MessageNegociation.objects.create(
            negociation=negociation,
            auteur_type=auteur,
            action='refus',
            message='Négociation refusée. La demande est de nouveau disponible.'
        )

        return Response({
            'detail': 'Négociation refusée. La demande est remise disponible.'
        })