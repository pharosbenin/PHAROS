from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Negociation, MessageNegociation


class MessageNegociationInline(admin.TabularInline):
    model   = MessageNegociation
    extra   = 0
    readonly_fields = ['auteur_type', 'action', 'montant', 'message', 'date_envoi']
    can_delete      = False


@admin.register(Negociation)
class NegociationAdmin(admin.ModelAdmin):
    list_display  = [
        'id', 'get_transporteur', 'get_commercant',
        'get_trajet', 'statut',
        'prix_initial', 'prix_final_convenu',
        'date_creation'
    ]
    list_filter   = ['statut']
    search_fields = [
        'offre__transporteur__username',
        'offre__demande__commercant__username'
    ]
    readonly_fields = [
        'prix_initial', 'prix_final_convenu',
        'date_creation', 'date_modification'
    ]
    inlines = [MessageNegociationInline]

    def get_transporteur(self, obj):
        return obj.offre.transporteur.username
    get_transporteur.short_description = 'Transporteur'

    def get_commercant(self, obj):
        return obj.offre.demande.commercant.username
    get_commercant.short_description = 'Commerçant'

    def get_trajet(self, obj):
        d = obj.offre.demande
        return f"{d.ville_depart} → {d.ville_destination}"
    get_trajet.short_description = 'Trajet'


@admin.register(MessageNegociation)
class MessageNegociationAdmin(admin.ModelAdmin):
    list_display = ['id', 'negociation', 'auteur_type', 'action', 'montant', 'date_envoi']
    list_filter  = ['auteur_type', 'action']
    readonly_fields = ['date_envoi']