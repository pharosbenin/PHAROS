from django.contrib import admin
from .models import Abonnement, Commission


@admin.register(Abonnement)
class AbonnementAdmin(admin.ModelAdmin):
    list_display = ('hotel', 'type_abonnement', 'taux_commission', 'statut', 'date_debut', 'montant_paye')
    list_filter = ('type_abonnement', 'statut')
    search_fields = ('hotel__nom',)
    readonly_fields = ('date_creation',)


@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ('hotel', 'montant_brut', 'taux', 'montant_commission', 'montant_hotel', 'statut', 'date_calcul')
    list_filter = ('statut',)
    search_fields = ('hotel__nom',)
    readonly_fields = ('date_calcul',)
    actions = ['marquer_verse']

    def marquer_verse(self, request, queryset):
        from django.utils import timezone
        queryset.update(statut='verse', date_versement=timezone.now())
    marquer_verse.short_description = 'Marquer comme versé'
