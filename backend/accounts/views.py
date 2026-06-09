from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import CustomUser
from .permissions import EstAdmin, EstNonSuspendu
from .serializers import (
    InscriptionSerializer, ProfilSerializer, ModifierProfilSerializer,
    ChangerMotDePasseSerializer, UtilisateurAdminSerializer,
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
