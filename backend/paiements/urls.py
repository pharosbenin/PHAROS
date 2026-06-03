from django.urls import path
from .views import (
    EffectuerPaiementView,
    LibererFondsView,
    RembourserPaiementView,
    MesPaiementsView,
    DetailPaiementView,
    TousLesPaiementsView,
)

urlpatterns = [
    # Commerçant
    path('effectuer/',          EffectuerPaiementView.as_view(),  name='effectuer-paiement'),
    path('liberer/<int:pk>/',   LibererFondsView.as_view(),       name='liberer-fonds'),
    path('mes-paiements/',      MesPaiementsView.as_view(),       name='mes-paiements'),

    # Commun
    path('detail/<int:pk>/',    DetailPaiementView.as_view(),     name='detail-paiement'),

    # Admin
    path('admin/rembourser/<int:pk>/', RembourserPaiementView.as_view(), name='rembourser-paiement'),
    path('admin/tous/',         TousLesPaiementsView.as_view(),   name='tous-paiements'),
]