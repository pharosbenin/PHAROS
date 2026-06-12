from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('hotels/villes/', views.villes_disponibles, name='villes_disponibles'),
    path('hotels/', views.RechercheHotels.as_view(), name='recherche_hotels'),
    path('hotels/<int:pk>/', views.detail_hotel, name='detail_hotel'),
    path('hotels/<int:pk>/chambres/', views.chambres_hotel, name='chambres_hotel'),
    path('hotels/<int:pk>/menu/', views.menu_hotel_public, name='menu_hotel_public'),

    # Gestionnaire
    path('gestionnaire/hotels/', views.MesHotels.as_view(), name='mes_hotels'),
    path('gestionnaire/hotels/<int:pk>/', views.DetailModifierHotel.as_view(), name='detail_modifier_hotel'),
    path('gestionnaire/hotels/<int:hotel_pk>/chambres/', views.MesTypesChambre.as_view(), name='mes_chambres'),
    path('gestionnaire/hotels/<int:hotel_pk>/chambres/<int:pk>/', views.DetailModifierTypeChambre.as_view(), name='detail_chambre'),
    path('gestionnaire/hotels/<int:hotel_pk>/photos/', views.ajouter_photo_hotel, name='ajouter_photo'),
    path('gestionnaire/hotels/<int:hotel_pk>/photos/<int:photo_pk>/', views.supprimer_photo_hotel, name='supprimer_photo'),
    path('gestionnaire/hotels/<int:hotel_pk>/chambres/<int:chambre_pk>/photos/', views.ajouter_photo_chambre, name='ajouter_photo_chambre'),
    path('gestionnaire/hotels/<int:hotel_pk>/chambres/<int:chambre_pk>/photos/<int:photo_pk>/', views.supprimer_photo_chambre, name='supprimer_photo_chambre'),
    path('gestionnaire/hotels/<int:hotel_pk>/menu/', views.PlatsMenu.as_view(), name='plats_menu'),
    path('gestionnaire/hotels/<int:hotel_pk>/menu/<int:pk>/', views.DetailModifierPlat.as_view(), name='detail_plat'),

    # Commandes restaurant (client)
    path('reservations/<uuid:numero>/commander/', views.commandes_reservation, name='commandes_reservation'),

    # Commandes restaurant (gestionnaire)
    path('gestionnaire/hotels/<int:hotel_pk>/commandes/', views.CommandesHotel.as_view(), name='commandes_hotel'),
    path('gestionnaire/commandes/<int:pk>/statut/', views.maj_statut_commande, name='maj_statut_commande'),

    # Promotions (Pro)
    path('gestionnaire/hotels/<int:hotel_pk>/promotions/', views.promotions_hotel, name='promotions_hotel'),
    path('gestionnaire/hotels/<int:hotel_pk>/promotions/<int:promo_pk>/', views.supprimer_promotion, name='supprimer_promotion'),

    # Admin
    path('admin/hotels/', views.ListeHotelsAdmin.as_view(), name='admin_hotels'),
    path('admin/hotels/<int:pk>/valider/', views.valider_hotel, name='valider_hotel'),
    path('admin/hotels/<int:pk>/rejeter/', views.rejeter_hotel, name='rejeter_hotel'),
    path('admin/hotels/<int:pk>/suspendre/', views.suspendre_hotel, name='suspendre_hotel'),
]
