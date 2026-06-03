from django.urls import path
from .views import ConnexionView
from .views import (
    InscriptionCommercantView,
    InscriptionSocieteView,
    InscriptionTransporteurView,
    MonProfilView,
    ProfilPublicTransporteurView,
    ComptesEnAttenteView,
    ValiderCompteView,
    ListeUtilisateursView,
    DetailUtilisateurAdminView,
)

urlpatterns = [
    path('inscription/commercant/', InscriptionCommercantView.as_view(), name='inscription-commercant'),
    path('inscription/societe/', InscriptionSocieteView.as_view(), name='inscription-societe'),
    path('inscription/transporteur/', InscriptionTransporteurView.as_view(), name='inscription-transporteur'),
    path('profil/', MonProfilView.as_view(), name='mon-profil'),
    path('profil/transporteur/<int:pk>/', ProfilPublicTransporteurView.as_view(), name='profil-public-transporteur'),
    path('admin/comptes-en-attente/', ComptesEnAttenteView.as_view(), name='comptes-en-attente'),
    path('admin/valider-compte/<int:pk>/', ValiderCompteView.as_view(), name='valider-compte'),
    path('admin/utilisateurs/', ListeUtilisateursView.as_view(), name='liste-utilisateurs'),
    path('connexion/', ConnexionView.as_view(), name='connexion'),
    path('admin/utilisateurs/<int:pk>/', DetailUtilisateurAdminView.as_view(), name='detail-utilisateur'),
]
