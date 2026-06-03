from django.urls import path
urlpatterns = []

from django.urls import path
from .views import (
    CreerLivraisonView,
    MettreAJourStatutView,
    ConfirmerLivraisonView,
    DetailLivraisonView,
    MesLivraisonsTransporteurView,
    MesLivraisonsCommercantView,
    ToutesLesLivraisonsView,
)

urlpatterns = [
    # Transporteur
    path('creer/<int:demande_pk>/', CreerLivraisonView.as_view(), name='creer-livraison'),
    path('statut/<int:pk>/', MettreAJourStatutView.as_view(), name='mettre-a-jour-statut'),
    path('mes-livraisons/transporteur/', MesLivraisonsTransporteurView.as_view(), name='mes-livraisons-transporteur'),

    # Commerçant
    path('confirmer/<int:pk>/', ConfirmerLivraisonView.as_view(), name='confirmer-livraison'),
    path('mes-livraisons/commercant/', MesLivraisonsCommercantView.as_view(), name='mes-livraisons-commercant'),

    # Commun
    path('detail/<int:pk>/', DetailLivraisonView.as_view(), name='detail-livraison'),

    # Admin
    path('admin/toutes/', ToutesLesLivraisonsView.as_view(), name='toutes-livraisons'),
]