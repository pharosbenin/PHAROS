from django.contrib import admin
from .models import Avis, SignalementAvis


@admin.register(Avis)
class AvisAdmin(admin.ModelAdmin):
    list_display = ('hotel', 'client', 'note', 'est_approuve', 'date_avis')
    list_filter = ('est_approuve', 'note')
    search_fields = ('hotel__nom', 'client__username', 'commentaire')
    actions = ['approuver_avis', 'retirer_approbation']

    def approuver_avis(self, request, queryset):
        queryset.update(est_approuve=True)
        for avis in queryset:
            avis.hotel.recalculer_note()
    approuver_avis.short_description = 'Approuver les avis sélectionnés'

    def retirer_approbation(self, request, queryset):
        queryset.update(est_approuve=False)
    retirer_approbation.short_description = 'Retirer l\'approbation'


@admin.register(SignalementAvis)
class SignalementAvisAdmin(admin.ModelAdmin):
    list_display = ('avis', 'signale_par', 'motif', 'est_traite', 'date_signalement')
    list_filter = ('est_traite', 'motif')
    actions = ['marquer_traite']

    def marquer_traite(self, request, queryset):
        queryset.update(est_traite=True)
    marquer_traite.short_description = 'Marquer comme traité'
