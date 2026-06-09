from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/inscription/', views.inscription, name='inscription'),
    path('auth/connexion/', views.connexion, name='connexion'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profil/', views.profil, name='profil'),
    path('auth/changer-mot-de-passe/', views.changer_mot_de_passe, name='changer_mot_de_passe'),

    # Admin
    path('admin/utilisateurs/', views.ListeUtilisateurs.as_view(), name='liste_utilisateurs'),
    path('admin/utilisateurs/<int:pk>/suspendre/', views.suspendre_utilisateur, name='suspendre_utilisateur'),
]
