from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/inscription/', views.inscription, name='inscription'),
    path('auth/connexion/', views.connexion, name='connexion'),
    path('auth/otp/envoyer/', views.envoyer_otp, name='envoyer_otp'),
    path('auth/otp/verifier/', views.verifier_otp, name='verifier_otp'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profil/', views.profil, name='profil'),
    path('auth/changer-mot-de-passe/', views.changer_mot_de_passe, name='changer_mot_de_passe'),
    path('auth/supprimer-compte/', views.supprimer_compte, name='supprimer_compte'),

    # Admin
    path('admin/utilisateurs/', views.ListeUtilisateurs.as_view(), name='liste_utilisateurs'),
    path('admin/utilisateurs/<int:pk>/suspendre/', views.suspendre_utilisateur, name='suspendre_utilisateur'),

    # Notifications
    path('notifications/', views.mes_notifications, name='mes_notifications'),
    path('notifications/<int:pk>/lire/', views.marquer_notif_lue, name='marquer_notif_lue'),

    # Messages de contact
    path('contacts/', views.envoyer_message_contact, name='envoyer_message_contact'),
    path('admin/contacts/', views.liste_messages_contact, name='liste_messages_contact'),
    path('admin/contacts/<int:pk>/lire/', views.marquer_message_contact_lu, name='marquer_message_contact_lu'),
]
