from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser, Notification, MessageContact, OTPVerification
from .permissions import EstAdmin, EstNonSuspendu
from .serializers import (
    InscriptionSerializer, ProfilSerializer, ModifierProfilSerializer,
    ChangerMotDePasseSerializer, UtilisateurAdminSerializer,
    MessageContactSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def connexion(request):
    from django.contrib.auth import authenticate
    username = request.data.get('username', '')
    password = request.data.get('password', '')
    user = authenticate(request, username=username, password=password)
    if user is None:
        # Essayer par email (prend le premier compte actif trouvé)
        u = CustomUser.objects.filter(email=username, is_active=True).first()
        if u:
            user = authenticate(request, username=u.username, password=password)
    if user is None or not user.is_active:
        return Response(
            {'detail': "Aucun compte actif n'a été trouvé avec les identifiants fournis"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    if user.est_suspendu:
        return Response(
            {'detail': "Votre compte a été suspendu. Contactez le support PHAROS pour plus d'informations."},
            status=status.HTTP_403_FORBIDDEN
        )
    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': ProfilSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def inscription(request):
    serializer = InscriptionSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Rattacher automatiquement les réservations effectuées en tant qu'invité
        # avec ce même email avant la création du compte.
        if user.role == 'client':
            from reservations.models import Reservation
            Reservation.objects.filter(
                email_client__iexact=user.email, client__isnull=True
            ).update(client=user)

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Compte créé avec succès.',
            'user': ProfilSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated, EstNonSuspendu])
def profil(request):
    if request.method == 'GET':
        return Response(ProfilSerializer(request.user).data)
    serializer = ModifierProfilSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(ProfilSerializer(request.user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def changer_mot_de_passe(request):
    serializer = ChangerMotDePasseSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['ancien_mot_de_passe']):
            return Response({'ancien_mot_de_passe': 'Mot de passe incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['nouveau_mot_de_passe'])
        user.save()
        return Response({'message': 'Mot de passe modifié avec succès.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def supprimer_compte(request):
    mot_de_passe = request.data.get('mot_de_passe', '')
    user = request.user
    if not user.check_password(mot_de_passe):
        return Response({'mot_de_passe': 'Mot de passe incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
    user.delete()
    return Response({'message': 'Compte supprimé avec succès.'})


# --- OTP ---

@api_view(['POST'])
@permission_classes([AllowAny])
def envoyer_otp(request):
    import random
    from django.utils import timezone
    from datetime import timedelta
    from django.conf import settings

    telephone = request.data.get('telephone', '').strip()
    if not telephone:
        return Response({'detail': 'Numéro de téléphone requis.'}, status=status.HTTP_400_BAD_REQUEST)

    # Invalider les anciens OTP non utilisés pour ce numéro
    OTPVerification.objects.filter(telephone=telephone, is_used=False).update(is_used=True)

    # Générer un code à 6 chiffres
    code = str(random.randint(100000, 999999))
    expires_at = timezone.now() + timedelta(minutes=5)
    OTPVerification.objects.create(telephone=telephone, code=code, expires_at=expires_at)

    # Envoyer le SMS via Africa's Talking
    at_username = getattr(settings, 'AT_USERNAME', None)
    at_api_key = getattr(settings, 'AT_API_KEY', None)
    dev_code = None
    if at_username and at_api_key:
        try:
            import africastalking
            africastalking.initialize(at_username, at_api_key)
            sms = africastalking.SMS
            sms.send(
                f"PHAROS BÉNIN - Votre code de vérification : {code}. Valable 5 minutes. Ne le partagez pas.",
                [telephone]
            )
        except Exception as e:
            print(f"[OTP] Erreur SMS: {e}")
            dev_code = code
    else:
        # Mode simulation : renvoyer le code pour auto-remplissage
        dev_code = code
        print(f"[OTP DEV] Code pour {telephone} : {code}")

    response_data = {'message': 'Code OTP envoyé avec succès.'}
    if dev_code:
        response_data['dev_code'] = dev_code
    return Response(response_data)


@api_view(['POST'])
@permission_classes([AllowAny])
def verifier_otp(request):
    telephone = request.data.get('telephone', '').strip()
    code = request.data.get('code', '').strip()

    if not telephone or not code:
        return Response({'detail': 'Téléphone et code requis.'}, status=status.HTTP_400_BAD_REQUEST)

    otp = OTPVerification.objects.filter(
        telephone=telephone,
        code=code,
        is_used=False
    ).order_by('-created_at').first()

    if not otp:
        return Response({'detail': 'Code incorrect. Vérifiez et réessayez.'}, status=status.HTTP_400_BAD_REQUEST)

    if not otp.is_valid():
        return Response({'detail': 'Code expiré. Demandez un nouveau code.'}, status=status.HTTP_400_BAD_REQUEST)

    otp.is_used = True
    otp.save(update_fields=['is_used'])

    return Response({'message': 'Numéro vérifié avec succès.', 'verified': True})


# --- Vues Admin ---

class ListeUtilisateurs(generics.ListAPIView):
    serializer_class = UtilisateurAdminSerializer
    permission_classes = [IsAuthenticated, EstAdmin]
    queryset = CustomUser.objects.all().order_by('-date_joined')

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated, EstAdmin])
def suspendre_utilisateur(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({'detail': 'Utilisateur introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    user.est_suspendu = not user.est_suspendu
    user.save()
    action = 'suspendu' if user.est_suspendu else 'réactivé'
    return Response({'message': f'Compte {action} avec succès.', 'est_suspendu': user.est_suspendu})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_notifications(request):
    notifs = Notification.objects.filter(destinataire=request.user)
    data = [{
        'id': n.id,
        'type': n.type,
        'titre': n.titre,
        'message': n.message,
        'lu': n.lu,
        'reservation_numero': n.reservation_numero,
        'date_creation': n.date_creation.isoformat(),
    } for n in notifs]
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def marquer_notif_lue(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, destinataire=request.user)
    except Notification.DoesNotExist:
        return Response({'detail': 'Introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    notif.lu = True
    notif.save(update_fields=['lu'])
    return Response({'lu': True})


# --- Messages de contact ---

@api_view(['POST'])
@permission_classes([AllowAny])
def envoyer_message_contact(request):
    serializer = MessageContactSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Message envoyé avec succès.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, EstAdmin])
def liste_messages_contact(request):
    messages_qs = MessageContact.objects.all()
    serializer = MessageContactSerializer(messages_qs, many=True)
    non_lus = MessageContact.objects.filter(lu=False).count()
    return Response({'messages': serializer.data, 'non_lus': non_lus})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, EstAdmin])
def marquer_message_contact_lu(request, pk):
    try:
        msg = MessageContact.objects.get(pk=pk)
    except MessageContact.DoesNotExist:
        return Response({'detail': 'Message introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    msg.lu = True
    msg.save(update_fields=['lu'])
    return Response({'lu': True})
