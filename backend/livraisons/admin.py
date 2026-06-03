from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Livraison


@admin.register(Livraison)
class LivraisonAdmin(admin.ModelAdmin):

    # Colonnes affichées dans la liste
    list_display = [
        'id', 'demande', 'transporteur', 'commercant',
        'statut', 'confirmation', 'date_creation'
    ]

    # Filtres à droite
    list_filter = ['statut', 'confirmation']

    # Recherche
    search_fields = [
        'transporteur__username', 'commercant__username',
        'demande__id'
    ]

    # Ordre par défaut
    ordering = ['-date_creation']

    # Champs en lecture seule
    readonly_fields = [
        'date_creation', 'date_chargement',
        'date_transit', 'date_livraison', 'date_confirmation'
    ]