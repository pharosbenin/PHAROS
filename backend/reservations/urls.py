from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('reservations/', views.creer_reservation, name='creer_reservation'),
    path('reservations/<uuid:numero>/', views.detail_reservation, name='detail_reservation'),
    path('reservations/<uuid:numero>/paiement/', views.initier_paiement, name='initier_paiement'),
    path('reservations/<uuid:numero>/qrcode/', views.qrcode_reservation, name='qrcode'),
    path('recu-qr/<uuid:code>/', views.recu_par_qrcode, name='recu_par_qrcode'),
    path('reservations/<uuid:numero>/annuler/', views.demander_annulation, name='annuler'),
    path('reservations/<uuid:numero>/modifier/', views.demander_modification, name='modifier'),
    path('reservations/<uuid:numero>/confirmer-sejour/', views.confirmer_sejour_client, name='confirmer_sejour_client'),
    path('reservations/<uuid:numero>/confirmer-sejour-hotel/', views.confirmer_sejour_hotel, name='confirmer_sejour_hotel'),

    # Gestionnaire
    path('gestionnaire/check-in/', views.scanner_qrcode, name='scanner_qrcode'),
    path('gestionnaire/reservations/', views.ReservationsHotel.as_view(), name='reservations_hotel'),

    # Client
    path('client/reservations/', views.MesReservations.as_view(), name='mes_reservations'),

    # Admin
    path('admin/reservations/', views.ToutesReservations.as_view(), name='toutes_reservations'),
]
