from django.contrib import admin
from .models import Reservation, Paiement, QRCodeReservation, Annulation


class PaiementInline(admin.StackedInline):
    model = Paiement
    extra = 0
    readonly_fields = ('montant_commission', 'montant_hotel', 'reference_externe', 'date_paiement')


class QRCodeInline(admin.StackedInline):
    model = QRCodeReservation
    extra = 0
    readonly_fields = ('code', 'est_utilise', 'date_utilisation')


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('numero', 'nom_complet_client', 'hotel', 'date_arrivee', 'date_depart', 'prix_total', 'statut')
    list_filter = ('statut', 'date_arrivee')
    search_fields = ('numero', 'nom_client', 'prenom_client', 'email_client', 'hotel__nom')
    readonly_fields = ('numero', 'date_creation', 'date_modification')
    inlines = [PaiementInline, QRCodeInline]


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'montant', 'methode', 'statut', 'date_paiement')
    list_filter = ('statut', 'methode')
    search_fields = ('reservation__numero', 'reference_externe')


@admin.register(Annulation)
class AnnulationAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'demande_par', 'statut', 'montant_rembourse', 'date_demande')
    list_filter = ('statut', 'demande_par')
