from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('hotels/<int:hotel_pk>/avis/', views.avis_hotel, name='avis_hotel'),

    # Client
    path('avis/', views.creer_avis, name='creer_avis'),
    path('avis/<int:pk>/signaler/', views.signaler_avis, name='signaler_avis'),

    # Gestionnaire
    path('gestionnaire/avis/', views.AvisMonHotel.as_view(), name='avis_mon_hotel'),
    path('gestionnaire/avis/<int:pk>/repondre/', views.repondre_avis, name='repondre_avis'),

    # Admin
    path('admin/avis/', views.TousLesAvis.as_view(), name='tous_avis'),
    path('admin/avis/<int:pk>/approuver/', views.approuver_avis, name='approuver_avis'),
    path('admin/avis/<int:pk>/supprimer/', views.supprimer_avis, name='supprimer_avis'),
    path('admin/signalements/', views.SignalementsAdmin.as_view(), name='signalements'),
    path('admin/signalements/<int:pk>/traiter/', views.traiter_signalement, name='traiter_signalement'),
]
