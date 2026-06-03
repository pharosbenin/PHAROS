from django.urls import path
from .views import (
    AccepterMissionView,
    MesOffresView,
    DetailOffreView,
    AnnulerOffreView,
    ToutesLesOffresView,
)

urlpatterns = [
    # Transporteur
    path('accepter/<int:demande_pk>/', AccepterMissionView.as_view(), name='accepter-mission'),
    path('mes-offres/', MesOffresView.as_view(), name='mes-offres'),
    path('annuler/<int:pk>/', AnnulerOffreView.as_view(), name='annuler-offre'),

    # Commun
    path('detail/<int:pk>/', DetailOffreView.as_view(), name='detail-offre'),

    # Admin
    path('admin/toutes/', ToutesLesOffresView.as_view(), name='toutes-offres'),
]