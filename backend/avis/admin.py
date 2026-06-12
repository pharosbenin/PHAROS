from django.contrib import admin
from .models import Avis, SignalementAvis, SignalementContenu, SignalementHotel


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


@admin.register(SignalementContenu)
class SignalementContenuAdmin(admin.ModelAdmin):
    list_display = ('hotel', 'client', 'statut', 'date_signalement')
    list_filter = ('statut',)
    search_fields = ('hotel__nom', 'client__username', 'avis_initial')
    readonly_fields = ('reservation', 'client', 'hotel', 'avis_initial', 'explication', 'date_signalement')
    actions = ['marquer_traite']

    def marquer_traite(self, request, queryset):
        queryset.update(statut='traite')
    marquer_traite.short_description = 'Marquer comme traité'


@admin.register(SignalementHotel)
class SignalementHotelAdmin(admin.ModelAdmin):
    list_display = ('hotel', 'client', 'motif', 'statut', 'date_signalement')
    list_filter = ('statut', 'motif')
    readonly_fields = ('client', 'hotel', 'motif', 'description', 'date_signalement')
    actions = ['marquer_traite']

    def marquer_traite(self, request, queryset):
        queryset.update(statut='traite')
    marquer_traite.short_description = 'Marquer comme traité'


@admin.register(SignalementAvis)
class SignalementAvisAdmin(admin.ModelAdmin):
    list_display = ('avis', 'signale_par', 'motif', 'est_traite', 'date_signalement')
    list_filter = ('est_traite', 'motif')
    actions = ['marquer_traite']

    def marquer_traite(self, request, queryset):
        queryset.update(est_traite=True)
    marquer_traite.short_description = 'Marquer comme traité'
