from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Evaluation


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):

    # Colonnes affichées dans la liste
    list_display = [
        'id', 'commercant', 'transporteur',
        'note', 'ponctualite', 'qualite_service',
        'communication', 'date_evaluation'
    ]

    # Filtres à droite
    list_filter = ['note', 'ponctualite', 'qualite_service', 'communication']

    # Recherche
    search_fields = [
        'commercant__username', 'transporteur__username', 'commentaire'
    ]

    # Ordre par défaut
    ordering = ['-date_evaluation']

    # Champs en lecture seule
    readonly_fields = ['date_evaluation']