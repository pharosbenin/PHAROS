from django.contrib import admin
from .models import Offre


@admin.register(Offre)
class OffreAdmin(admin.ModelAdmin):

    # Colonnes affichées dans la liste
    list_display = [
        'id', 'transporteur', 'demande',
        'statut', 'prix_propose',
        'date_soumission', 'date_acceptation'
    ]

    # Filtres à droite
    list_filter = ['statut']

    # Recherche
    search_fields = ['transporteur__username', 'demande__id']

    # Ordre par défaut
    ordering = ['-date_soumission']

    # Champs en lecture seule
    readonly_fields = ['date_soumission', 'date_acceptation', 'date_modification']