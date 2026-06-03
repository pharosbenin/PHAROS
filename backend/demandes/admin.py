from django.contrib import admin
from .models import Demande


@admin.register(Demande)
class DemandeAdmin(admin.ModelAdmin):

    # Colonnes affichées dans la liste
    list_display = [
        'id', 'commercant', 'type_marchandise',
        'ville_depart', 'ville_destination',
        'tonnage', 'delai_livraison', 'niveau_urgence',
         'statut', 'date_creation'
    ]

    # Filtres à droite
    list_filter = ['statut', 'niveau_urgence', 'type_marchandise', 'ville_depart', 'ville_destination']

    # Recherche
    search_fields = ['commercant__username', 'commercant__email', 'description_marchandise']

    # Ordre par défaut
    ordering = ['-date_creation']

    # Champs en lecture seule
    readonly_fields = ['date_creation', 'date_modification', 'date_attribution']