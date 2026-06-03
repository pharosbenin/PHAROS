from django.contrib import admin
from .models import Paiement


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'commercant', 'transporteur',
        'montant', 'operateur', 'statut',
        'date_creation'
    ]
    list_filter     = ['statut', 'operateur']
    search_fields   = [
        'commercant__username',
        'transporteur__username',
        'reference_transaction'
    ]
    ordering        = ['-date_creation']
    readonly_fields = [
        'date_creation', 'date_blocage',
        'date_liberation', 'date_remboursement'
    ]
    actions = ['rembourser_paiements']

    def rembourser_paiements(self, request, queryset):
        queryset.filter(statut='bloque').update(statut='rembourse')
        self.message_user(request, "Paiements remboursés avec succès.")
    rembourser_paiements.short_description = "Rembourser les paiements sélectionnés"