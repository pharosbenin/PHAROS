
from django.urls import path
from .views import (
    PublierDemandeView,
    ListeDemandesDisponiblesView,
    MesDemandesView,
    DetailDemandeView,
    ModifierDemandeView,
    SupprimerDemandeView,
    ToutesLesDemandesView,
)

urlpatterns = [
    # Commerçant
    path('publier/', PublierDemandeView.as_view(), name='publier-demande'),
    path('mes-demandes/', MesDemandesView.as_view(), name='mes-demandes'),
    path('modifier/<int:pk>/', ModifierDemandeView.as_view(), name='modifier-demande'),
    path('supprimer/<int:pk>/', SupprimerDemandeView.as_view(), name='supprimer-demande'),

    # Transporteur
    path('disponibles/', ListeDemandesDisponiblesView.as_view(), name='demandes-disponibles'),

    # Commun
    path('detail/<int:pk>/', DetailDemandeView.as_view(), name='detail-demande'),

    # Admin
    path('admin/toutes/', ToutesLesDemandesView.as_view(), name='toutes-demandes'),
]