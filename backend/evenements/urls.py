from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('evenements/', views.evenements_actifs, name='evenements_actifs'),
    path('evenements/<int:pk>/', views.detail_evenement, name='detail_evenement'),

    # Admin
    path('admin/evenements/', views.GestionEvenements.as_view(), name='gestion_evenements'),
    path('admin/evenements/<int:pk>/', views.DetailEvenementAdmin.as_view(), name='detail_evenement_admin'),
    path('admin/evenements/mise-en-avant/', views.mettre_en_avant_hotel, name='mise_en_avant'),
]
