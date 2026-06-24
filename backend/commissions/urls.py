from django.urls import path
from . import views

urlpatterns = [
    # Gestionnaire
    path('gestionnaire/abonnement/', views.mon_abonnement, name='mon_abonnement'),
    path('gestionnaire/abonnement/upgrade/', views.upgrader_pro, name='upgrader_pro'),
    path('gestionnaire/commissions/', views.mes_commissions, name='mes_commissions'),
    path('gestionnaire/retraits/', views.mes_retraits, name='mes_retraits'),

    # Admin
    path('admin/commissions/', views.ToutesCommissions.as_view(), name='toutes_commissions'),
    path('admin/abonnements/', views.TousAbonnements.as_view(), name='tous_abonnements'),
    path('admin/demandes-upgrade/', views.DemandesUpgrade.as_view(), name='demandes_upgrade'),
    path('admin/demandes-upgrade/<int:pk>/approuver/', views.approuver_upgrade, name='approuver_upgrade'),
    path('admin/demandes-upgrade/<int:pk>/rejeter/', views.rejeter_upgrade, name='rejeter_upgrade'),
    path('admin/retraits/', views.TousRetraits.as_view(), name='tous_retraits'),
    path('admin/retraits/<int:pk>/approuver/', views.approuver_retrait, name='approuver_retrait'),
    path('admin/retraits/<int:pk>/rejeter/', views.rejeter_retrait, name='rejeter_retrait'),
]
