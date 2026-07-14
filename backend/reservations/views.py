from decimal import Decimal
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import EstAdmin, EstGestionnaire, EstNonSuspendu, EstHotelValide
from .models import Reservation, Paiement, QRCodeReservation, Annulation, Modification
from .serializers import (
    ReservationListeSerializer, ReservationDetailSerializer,
    ReservationCreerSerializer, InitierPaiementSerializer,
    AnnulationSerializer, PaiementSerializer,
    ModificationSerializer, ModificationDetailSerializer,
)


def _finaliser_sejour(reservation):
    """Passe la réservation à terminee et déclenche tous les effets associés."""
    from accounts.models import Notification
    from commissions.models import Commission

    reservation.statut = 'terminee'
    reservation.avis_disponible = True
    reservation.save(update_fields=['statut', 'avis_disponible'])
    _recompute_disponibilite(reservation.type_chambre)

    # Marquer la commission comme versée
    montant_hotel = reservation.prix_total
    try:
        commission = Commission.objects.get(paiement=reservation.paiement)
        commission.statut = 'verse'
        commission.date_versement = timezone.now()
        commission.save(update_fields=['statut', 'date_versement'])
        montant_hotel = commission.montant_hotel
    except Exception:
        pass

    # Notification hôtelier — fonds libérés
    Notification.objects.create(
        destinataire=reservation.hotel.gestionnaire,
        type='info',
        titre='Fonds libérés',
        message=(
            f'Le séjour de {reservation.prenom_client} {reservation.nom_client} est confirmé par les deux parties. '
            f'{int(montant_hotel):,} FCFA vont être transférés sur votre compte.'
        ),
        reservation_numero=str(reservation.numero),
    )

    # Notification client — invitation à laisser un avis (uniquement si le client a un compte)
    if reservation.client is not None:
        Notification.objects.create(
            destinataire=reservation.client,
            type='info',
            titre='Séjour terminé — Donnez votre avis !',
            message=(
                f'Votre séjour à {reservation.hotel.nom} est terminé. '
                f'Votre avis est maintenant disponible. Partagez votre expérience !'
            ),
            reservation_numero=str(reservation.numero),
        )


def _recompute_disponibilite(type_chambre):
    """Met à jour est_disponible : True si au moins une unité est libre AUJOURD'HUI."""
    today = timezone.now().date()
    # Réservations qui chevauchent avec aujourd'hui (client est présent ou arrive aujourd'hui)
    active = Reservation.objects.filter(
        type_chambre=type_chambre,
        statut__in=['payee', 'confirmee', 'en_cours', 'confirme_client', 'confirme_hotel'],
        date_arrivee__lte=today,
        date_depart__gt=today,
    ).count()
    new_val = active < type_chambre.nombre_chambres
    if type_chambre.est_disponible != new_val:
        type_chambre.est_disponible = new_val
        type_chambre.save(update_fields=['est_disponible'])


# --- Création de réservation (clients connectés ou invités) ---

def _purger_en_attente():
    """Supprime toutes les réservations non payées créées il y a plus de 1 heure."""
    from django.utils import timezone as tz
    from datetime import timedelta
    seuil = tz.now() - timedelta(hours=1)
    Reservation.objects.filter(statut='en_attente', date_creation__lt=seuil).delete()


@api_view(['POST'])
@permission_classes([AllowAny])
def creer_reservation(request):
    if request.user.is_authenticated:
        if request.user.role in ('gestionnaire', 'admin'):
            return Response(
                {'detail': 'Les gestionnaires et administrateurs ne peuvent pas effectuer de réservations.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if request.user.est_suspendu:
            return Response({'detail': 'Votre compte a été suspendu.'}, status=status.HTTP_403_FORBIDDEN)
    _purger_en_attente()
    serializer = ReservationCreerSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        reservation = serializer.save()
        return Response(ReservationDetailSerializer(reservation).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def detail_reservation(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    # Accès : client connecté propriétaire, staff, ou email invité correspondant
    est_staff = request.user.is_authenticated and request.user.role in ('admin', 'gestionnaire')
    if not est_staff and not _proprietaire_autorise(reservation, request):
        return Response({'detail': 'Accès non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
    return Response(ReservationDetailSerializer(reservation).data)


# --- Paiement ---

def _taux_commission(hotel):
    from commissions.models import Abonnement as AbonnementModel
    abonnement_actif = AbonnementModel.objects.filter(
        hotel=hotel, statut='actif'
    ).order_by('-date_creation').first()
    if abonnement_actif:
        return abonnement_actif.taux_commission
    return Decimal('0.05') if hotel.type_abonnement == 'pro' else Decimal('0.03')


def _finaliser_paiement_reussi(reservation, paiement):
    """Passe la réservation à payee, génère le QR code et enregistre la commission."""
    hotel = reservation.hotel
    taux = _taux_commission(hotel)

    paiement.statut = 'reussi'
    paiement.date_paiement = timezone.now()
    paiement.save(update_fields=['statut', 'date_paiement'])

    reservation.statut = 'payee'
    reservation.save(update_fields=['statut'])

    _recompute_disponibilite(reservation.type_chambre)
    QRCodeReservation.objects.get_or_create(reservation=reservation)

    from commissions.models import Commission
    Commission.objects.get_or_create(
        paiement=paiement,
        defaults={
            'hotel': hotel,
            'montant_brut': paiement.montant,
            'taux': taux,
            'montant_commission': paiement.montant_commission,
            'montant_hotel': paiement.montant_hotel,
            'statut': 'calcule',
        }
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def initier_paiement(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero, statut='en_attente')
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable ou déjà traitée.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = InitierPaiementSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    hotel = reservation.hotel
    taux = _taux_commission(hotel)
    montant = reservation.prix_total
    montant_commission = round(montant * taux, 2)
    montant_hotel = round(montant - montant_commission, 2)

    from .fedapay import creer_transaction, FedaPayError
    try:
        transaction_id, payment_url = creer_transaction(
            montant=montant,
            description=f'Réservation {reservation.hotel.nom} — {reservation.numero}',
            reservation_numero=reservation.numero,
            prenom=reservation.prenom_client,
            nom=reservation.nom_client,
            email=reservation.email_client,
        )
    except FedaPayError as e:
        return Response({'detail': f"Impossible de contacter FedaPay : {e}"}, status=status.HTTP_502_BAD_GATEWAY)

    Paiement.objects.update_or_create(
        reservation=reservation,
        defaults={
            'montant': montant,
            'montant_commission': montant_commission,
            'montant_hotel': montant_hotel,
            'methode': serializer.validated_data['methode'],
            'numero_telephone': serializer.validated_data.get('numero_telephone', ''),
            'statut': 'en_attente',
            'reference_externe': transaction_id,
            'date_paiement': None,
        }
    )

    return Response({
        'message': 'Transaction créée, redirection vers FedaPay requise.',
        'transaction_id': transaction_id,
        'payment_url': payment_url,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def verifier_paiement(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        paiement = reservation.paiement
    except Paiement.DoesNotExist:
        return Response({'detail': 'Aucun paiement initié pour cette réservation.'}, status=status.HTTP_404_NOT_FOUND)

    if paiement.statut == 'reussi':
        return Response({
            'statut': 'reussi',
            'transaction_id': paiement.reference_externe,
            'reservation': ReservationDetailSerializer(reservation).data,
        })

    from .fedapay import statut_transaction, FedaPayError
    try:
        statut_fedapay = statut_transaction(paiement.reference_externe)
    except FedaPayError as e:
        return Response({'detail': f"Impossible de vérifier le paiement : {e}"}, status=status.HTTP_502_BAD_GATEWAY)

    if statut_fedapay == 'approved':
        _finaliser_paiement_reussi(reservation, paiement)
        return Response({
            'statut': 'reussi',
            'transaction_id': paiement.reference_externe,
            'reservation': ReservationDetailSerializer(reservation).data,
        })

    if statut_fedapay in ('declined', 'canceled'):
        paiement.statut = 'echoue'
        paiement.save(update_fields=['statut'])
        return Response({'statut': 'echoue'})

    return Response({'statut': 'en_attente'})


@api_view(['GET'])
@permission_classes([AllowAny])
def qrcode_reservation(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero)
        qr = reservation.qrcode
    except (Reservation.DoesNotExist, QRCodeReservation.DoesNotExist):
        return Response({'detail': 'QR Code introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    from .serializers import QRCodeSerializer
    return Response(QRCodeSerializer(qr).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def recu_par_qrcode(request, code):
    """Retourne le reçu complet d'une réservation à partir du code QR (accès public pour scan)."""
    try:
        qr = QRCodeReservation.objects.select_related('reservation').get(code=code)
    except QRCodeReservation.DoesNotExist:
        return Response({'detail': 'QR Code invalide ou introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(ReservationDetailSerializer(qr.reservation).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstHotelValide])
def scanner_qrcode(request):
    code = request.data.get('code')
    if not code:
        return Response({'detail': 'Code QR requis.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        qr = QRCodeReservation.objects.get(code=code)
    except QRCodeReservation.DoesNotExist:
        return Response({'detail': 'QR Code invalide.'}, status=status.HTTP_404_NOT_FOUND)
    if qr.est_utilise:
        return Response({'detail': 'Ce QR Code a déjà été utilisé.', 'reservation': ReservationDetailSerializer(qr.reservation).data})
    # Vérifier que l'hôtel appartient au gestionnaire
    if qr.reservation.hotel.gestionnaire != request.user:
        return Response({'detail': 'Ce QR Code n\'appartient pas à votre hôtel.'}, status=status.HTTP_403_FORBIDDEN)
    qr.est_utilise = True
    qr.date_utilisation = timezone.now()
    qr.save()
    qr.reservation.statut = 'en_cours'
    qr.reservation.save(update_fields=['statut'])
    return Response({'message': 'Check-in effectué.', 'reservation': ReservationDetailSerializer(qr.reservation).data})


# --- Double confirmation du séjour (Escrow) ---

def _verifier_fenetre_confirmation(reservation):
    """Retourne True si on est dans la fenêtre de confirmation (≥ 5h avant le départ)."""
    from datetime import datetime, time, timedelta
    depart_dt = timezone.make_aware(datetime.combine(reservation.date_depart, time.min))
    return timezone.now() >= depart_dt - timedelta(hours=5)


def _proprietaire_autorise(reservation, request):
    """Autorise le client authentifié propriétaire, ou quiconque fournissant l'email
    exact utilisé à la réservation (invité OU compte) via la page de suivi."""
    # Propriétaire connecté
    if request.user.is_authenticated and reservation.client == request.user:
        return True
    # Accès par email — valide pour invité ET pour réservation avec compte (page suivi)
    # UUID + email offrent la même garantie de sécurité que le login
    email = (request.data.get('email_client') or request.query_params.get('email_client') or '').strip().lower()
    if email:
        return email == reservation.email_client.lower()
    # Dernier recours : utilisateur connecté dont l'email correspond (réservation invité migrée)
    if request.user.is_authenticated:
        return request.user.email.lower() == reservation.email_client.lower()
    return False


@api_view(['POST'])
@permission_classes([AllowAny])
def confirmer_sejour_client(request, numero):
    """Le client (ou l'invité via son email) confirme que son séjour s'est bien passé."""
    try:
        reservation = Reservation.objects.get(numero=numero)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.is_authenticated and request.user.est_suspendu:
        return Response({'detail': 'Votre compte a été suspendu.'}, status=status.HTTP_403_FORBIDDEN)

    if not _proprietaire_autorise(reservation, request):
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    if reservation.statut not in ('payee', 'confirmee', 'en_cours', 'confirme_hotel'):
        return Response({'detail': 'Ce séjour ne peut pas être confirmé dans son état actuel.'}, status=status.HTTP_400_BAD_REQUEST)

    if not _verifier_fenetre_confirmation(reservation):
        return Response({'detail': f'Vous pourrez confirmer votre séjour 5h avant votre date de départ ({reservation.date_depart.strftime("%d/%m/%Y")}).'}, status=status.HTTP_400_BAD_REQUEST)

    if reservation.statut == 'confirme_hotel':
        # L'hôtel a déjà confirmé → les deux ont confirmé → fonds libérés
        _finaliser_sejour(reservation)
        return Response({'message': 'Séjour confirmé. Les fonds sont maintenant transférés à l\'hôtel.', 'statut': 'terminee'})

    reservation.statut = 'confirme_client'
    reservation.save(update_fields=['statut'])
    return Response({'message': 'Votre confirmation a été enregistrée. En attente de la confirmation de l\'hôtel.', 'statut': 'confirme_client'})


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide])
def confirmer_sejour_hotel(request, numero):
    """L'hôtelier confirme que le séjour s'est bien passé."""
    try:
        reservation = Reservation.objects.get(numero=numero, hotel__gestionnaire=request.user)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if reservation.statut not in ('payee', 'confirmee', 'en_cours', 'confirme_client'):
        return Response({'detail': 'Ce séjour ne peut pas être confirmé dans son état actuel.'}, status=status.HTTP_400_BAD_REQUEST)

    if not _verifier_fenetre_confirmation(reservation):
        return Response({'detail': f'La confirmation n\'est disponible qu\'à partir de 5h avant la date de départ ({reservation.date_depart.strftime("%d/%m/%Y")}).'}, status=status.HTTP_400_BAD_REQUEST)

    if reservation.statut == 'confirme_client':
        # Le client a déjà confirmé → les deux ont confirmé → fonds libérés
        _finaliser_sejour(reservation)
        return Response({'message': 'Séjour confirmé. Les fonds sont maintenant transférés.', 'statut': 'terminee'})

    reservation.statut = 'confirme_hotel'
    reservation.save(update_fields=['statut'])
    return Response({'message': 'Votre confirmation a été enregistrée. En attente de la confirmation du client.', 'statut': 'confirme_hotel'})


# --- Utilitaire : taux commission plateforme ---

def _taux_commission(hotel):
    from commissions.models import Abonnement as AbonnementModel
    abonnement = AbonnementModel.objects.filter(
        hotel=hotel, statut='actif'
    ).order_by('-date_creation').first()
    if abonnement:
        return abonnement.taux_commission
    return Decimal('0.05') if hotel.type_abonnement == 'pro' else Decimal('0.03')


# --- Annulation ---

@api_view(['POST'])
@permission_classes([AllowAny])
def demander_annulation(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.is_authenticated and request.user.est_suspendu:
        return Response({'detail': 'Votre compte a été suspendu.'}, status=status.HTTP_403_FORBIDDEN)

    est_staff = request.user.is_authenticated and request.user.role in ('admin', 'gestionnaire')
    if not est_staff and not _proprietaire_autorise(reservation, request):
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    if reservation.statut in ('terminee', 'annulee', 'remboursee'):
        return Response({'detail': 'Cette réservation ne peut plus être annulée.'}, status=status.HTTP_400_BAD_REQUEST)

    # Aucune annulation le jour d'arrivée ou après
    if timezone.now().date() >= reservation.date_arrivee:
        return Response(
            {'detail': "Aucune annulation possible le jour d'arrivée ou après."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if hasattr(reservation, 'annulation'):
        return Response({'detail': "Une demande d'annulation existe déjà."}, status=status.HTTP_400_BAD_REQUEST)

    serializer = AnnulationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    hotel = reservation.hotel
    montant_rembourse = Decimal('0')
    frais_annulation = Decimal('0')
    commission_plateforme = Decimal('0')

    if (reservation.statut in ('payee', 'confirmee', 'confirme_client', 'confirme_hotel')
            and hasattr(reservation, 'paiement')
            and reservation.paiement.statut == 'reussi'):

        if not reservation.paiement.date_paiement:
            # Fallback : date_paiement absente → bénéfice du doute, remboursement intégral
            montant_rembourse = reservation.prix_total
        else:
            heures_depuis_paiement = (
                timezone.now() - reservation.paiement.date_paiement
            ).total_seconds() / 3600

            if heures_depuis_paiement <= 2:
                # Cas 1 : dans les 2h → remboursement intégral, aucun frais
                montant_rembourse = reservation.prix_total
            else:
                # Cas 2 : après les 2h → politique hôtel + commission plateforme sur les frais
                taux_annulation = Decimal(str(hotel.taux_annulation))
                frais_annulation = round(reservation.prix_total * taux_annulation / Decimal('100'), 2)
                montant_rembourse = reservation.prix_total - frais_annulation
                commission_plateforme = round(frais_annulation * _taux_commission(hotel), 2)

    role = request.user.role if request.user.role in ('gestionnaire', 'admin') else 'client'
    annulation = serializer.save(
        reservation=reservation,
        demandeur=request.user,
        demande_par=role,
        montant_rembourse=montant_rembourse,
        frais_annulation=frais_annulation,
        commission_plateforme=commission_plateforme,
        date_traitement=timezone.now(),
    )
    chambre_annulee = reservation.type_chambre
    reservation.statut = 'annulee'
    reservation.save(update_fields=['statut'])

    # Libérer la chambre après annulation
    _recompute_disponibilite(chambre_annulee)

    if montant_rembourse > 0 and hasattr(reservation, 'paiement'):
        reservation.paiement.statut = 'rembourse'
        reservation.paiement.save(update_fields=['statut'])

    # Corriger Commission.montant_hotel : l'hôtel ne perçoit que frais - commission_plateforme
    try:
        from commissions.models import Commission as CommissionModel
        commission_obj = CommissionModel.objects.get(paiement=reservation.paiement)
        commission_obj.montant_brut = frais_annulation
        commission_obj.montant_hotel = frais_annulation - commission_plateforme
        commission_obj.montant_commission = commission_plateforme
        commission_obj.save(update_fields=['montant_brut', 'montant_hotel', 'montant_commission'])
    except Exception:
        pass

    from accounts.models import Notification
    Notification.objects.create(
        destinataire=hotel.gestionnaire,
        type='annulation',
        titre=f'Annulation — {reservation.nom_complet_client}',
        message=(
            f'Réservation #{str(reservation.numero)[:8].upper()} '
            f'({reservation.type_chambre.nom}, '
            f'{reservation.date_arrivee} → {reservation.date_depart}) '
            f'annulée par {reservation.nom_complet_client}.\n'
            f'Frais retenus : {frais_annulation} XOF ({hotel.taux_annulation}%).\n'
            f'Commission plateforme sur frais : {commission_plateforme} XOF.\n'
            f'Remboursé au client : {montant_rembourse} XOF.'
        ),
        reservation_numero=str(reservation.numero),
    )

    return Response(AnnulationSerializer(annulation).data, status=status.HTTP_201_CREATED)


# --- Modification à la baisse ---

@api_view(['POST'])
@permission_classes([AllowAny])
def demander_modification(request, numero):
    try:
        reservation = Reservation.objects.get(numero=numero)
    except Reservation.DoesNotExist:
        return Response({'detail': 'Réservation introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.is_authenticated and request.user.est_suspendu:
        return Response({'detail': 'Votre compte a été suspendu.'}, status=status.HTTP_403_FORBIDDEN)

    if not _proprietaire_autorise(reservation, request):
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    if reservation.statut in ('terminee', 'annulee', 'remboursee'):
        return Response({'detail': 'Cette réservation ne peut plus être modifiée.'}, status=status.HTTP_400_BAD_REQUEST)

    # Aucune modification le jour d'arrivée ou après
    if timezone.now().date() >= reservation.date_arrivee:
        return Response(
            {'detail': "Aucune modification possible le jour d'arrivée ou après."},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ModificationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    nouvelle_chambre = serializer.validated_data.get('type_chambre_nouveau') or reservation.type_chambre
    date_arrivee_nouvelle = serializer.validated_data.get('date_arrivee_nouvelle') or reservation.date_arrivee
    date_depart_nouvelle = serializer.validated_data.get('date_depart_nouvelle') or reservation.date_depart

    # Vérification : chambre appartient au même hôtel
    if nouvelle_chambre.hotel != reservation.hotel:
        return Response(
            {'detail': "Cette chambre n'appartient pas au même hôtel."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Vérification disponibilité sur les nouvelles dates (overlap exact, couvre chambre identique ou différente)
    reservations_overlapping = Reservation.objects.filter(
        type_chambre=nouvelle_chambre,
        statut__in=['payee', 'confirmee', 'en_cours', 'confirme_client', 'confirme_hotel'],
        date_arrivee__lt=date_depart_nouvelle,
        date_depart__gte=date_arrivee_nouvelle,
    ).exclude(numero=reservation.numero).count()
    if reservations_overlapping >= nouvelle_chambre.nombre_chambres:
        return Response(
            {'detail': "Cette chambre n'est plus disponible pour les dates choisies."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Vérifier qu'au moins quelque chose change
    if (nouvelle_chambre == reservation.type_chambre
            and date_arrivee_nouvelle == reservation.date_arrivee
            and date_depart_nouvelle == reservation.date_depart):
        return Response({'detail': "Aucune modification détectée."}, status=status.HTTP_400_BAD_REQUEST)

    hotel = reservation.hotel
    nb_nuits = (date_depart_nouvelle - date_arrivee_nouvelle).days
    prix_nouveau = nouvelle_chambre.prix_nuit * nb_nuits
    prix_ancien = reservation.prix_total

    est_hausse = prix_nouveau > prix_ancien
    difference = abs(prix_nouveau - prix_ancien)

    frais_modification = Decimal('0')
    commission_plateforme = Decimal('0')
    montant_rembourse = Decimal('0')
    montant_supplementaire = Decimal('0')

    dans_fenetre_2h = False
    if (hasattr(reservation, 'paiement')
            and reservation.paiement.statut == 'reussi'
            and reservation.paiement.date_paiement):
        heures = (timezone.now() - reservation.paiement.date_paiement).total_seconds() / 3600
        dans_fenetre_2h = heures <= 2

    if est_hausse:
        # Hausse : le client paye la différence, pas de frais
        montant_supplementaire = difference
    else:
        # Baisse : remboursement avec ou sans frais selon la fenêtre 2h
        if dans_fenetre_2h:
            montant_rembourse = difference
        else:
            taux_modif = Decimal(str(hotel.taux_modification))
            frais_modification = round(difference * taux_modif / Decimal('100'), 2)
            montant_rembourse = difference - frais_modification
            commission_plateforme = round(frais_modification * _taux_commission(hotel), 2)

    ancienne_chambre = reservation.type_chambre
    sens = 'hausse' if est_hausse else ('neutre' if difference == 0 else 'baisse')

    modification = Modification.objects.create(
        reservation=reservation,
        demandeur=request.user,
        sens=sens,
        type_chambre_ancien=ancienne_chambre,
        type_chambre_nouveau=nouvelle_chambre,
        prix_ancien=prix_ancien,
        prix_nouveau=prix_nouveau,
        difference=difference,
        frais_modification=frais_modification,
        commission_plateforme=commission_plateforme,
        montant_rembourse=montant_rembourse,
        montant_supplementaire=montant_supplementaire,
    )

    reservation.type_chambre = nouvelle_chambre
    reservation.prix_total = prix_nouveau
    reservation.date_arrivee = date_arrivee_nouvelle
    reservation.date_depart = date_depart_nouvelle
    reservation.save(update_fields=['type_chambre', 'prix_total', 'date_arrivee', 'date_depart'])

    # Recompute disponibilité ancienne chambre (libérée) et nouvelle (potentiellement saturée)
    _recompute_disponibilite(ancienne_chambre)
    _recompute_disponibilite(nouvelle_chambre)

    # Cas 3 : modification baisse après 2h → commission sur les frais retenus uniquement
    if not est_hausse and not dans_fenetre_2h and hasattr(reservation, 'paiement'):
        try:
            from commissions.models import Commission as CommissionModel
            commission_obj = CommissionModel.objects.get(paiement=reservation.paiement)
            commission_obj.montant_brut = frais_modification
            commission_obj.montant_commission = commission_plateforme
            commission_obj.montant_hotel = frais_modification - commission_plateforme
            commission_obj.save(update_fields=['montant_brut', 'montant_commission', 'montant_hotel'])
        except Exception:
            pass

    from accounts.models import Notification
    if sens == 'neutre':
        msg_fin = 'Aucun impact financier — changement de dates uniquement.'
    elif est_hausse:
        msg_fin = f'Supplément à payer par le client : {montant_supplementaire} XOF.'
    else:
        msg_fin = (
            f'Frais retenus : {frais_modification} XOF ({hotel.taux_modification}%). '
            f'Commission plateforme : {commission_plateforme} XOF. '
            f'Remboursé au client : {montant_rembourse} XOF.'
        )

    Notification.objects.create(
        destinataire=hotel.gestionnaire,
        type='modification',
        titre=f'Modification — {reservation.nom_complet_client}',
        message=(
            f'Réservation #{str(reservation.numero)[:8].upper()} modifiée par {reservation.nom_complet_client}.\n'
            f'{ancienne_chambre.nom} → {nouvelle_chambre.nom} ({sens}).\n'
            f'Différence : {difference} XOF. {msg_fin}'
        ),
        reservation_numero=str(reservation.numero),
    )

    return Response(ModificationDetailSerializer(modification).data, status=status.HTTP_201_CREATED)


# --- Espace client ---

class MesReservations(generics.ListAPIView):
    serializer_class = ReservationListeSerializer
    permission_classes = [IsAuthenticated, EstNonSuspendu]

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        return Reservation.objects.filter(
            Q(client=user) | Q(client__isnull=True, email_client__iexact=user.email)
        ).exclude(statut='en_attente').distinct().select_related(
            'hotel', 'type_chambre', 'paiement', 'annulation', 'avis'
        )


# --- Espace gestionnaire ---

class ReservationsHotel(generics.ListAPIView):
    serializer_class = ReservationListeSerializer
    permission_classes = [IsAuthenticated, EstGestionnaire, EstNonSuspendu, EstHotelValide]

    def get_queryset(self):
        qs = Reservation.objects.filter(hotel__gestionnaire=self.request.user).exclude(
            statut='en_attente'
        ).select_related('hotel', 'type_chambre', 'paiement', 'annulation', 'avis')
        hotel_id = self.request.query_params.get('hotel_id')
        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs


# --- Admin ---

class ToutesReservations(generics.ListAPIView):
    serializer_class = ReservationListeSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = Reservation.objects.select_related('hotel', 'type_chambre', 'paiement', 'annulation', 'avis').all()

    def get_queryset(self):
        qs = super().get_queryset()
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs
