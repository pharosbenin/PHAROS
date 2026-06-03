from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):

    # Colonnes affichées dans la liste
    list_display = [
        'username', 'email', 'first_name', 'last_name',
        'role', 'statut', 'ville', 'date_inscription'
    ]

    # Filtres à droite
    list_filter = ['role', 'statut', 'ville']

    # Recherche
    search_fields = ['username', 'email', 'first_name', 'last_name', 'telephone']

    # Ordre par défaut
    ordering = ['-date_inscription']

    # Champs dans le formulaire de modification
    fieldsets = UserAdmin.fieldsets + (
        ('Informations générales', {
            'fields': (
                'role', 'telephone', 'statut',
                'adresse', 'ville', 'quartier',
            )
        }),
        ('Documents Commerçant', {
            'fields': (
                'ifu', 'rccm',
                'document_ifu', 'photo_identite',
            )
        }),
        ('Société de transport', {
            'fields': (
                'nom_societe', 'nom_responsable',
                'nombre_camions', 'type_camion_principal',
                'corridors_couverts',
                'carte_transporteur', 'assurance',
            )
        }),
        ('Transporteur indépendant', {
            'fields': (
                'type_vehicule', 'numero_immatriculation',
                'capacite_chargement', 'numero_permis',
                'assurance_vehicule', 'photo_permis', 'photo_vehicule',
            )
        }),
        ('Dates', {
            'fields': (
                'date_validation',
            )
        }),
    )

    # Champs dans le formulaire de création
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations TransCargo BJ', {
            'fields': (
                'role', 'telephone', 'statut',
                'adresse', 'ville', 'quartier',
            )
        }),
    )

    # Actions rapides
    actions = ['valider_comptes', 'rejeter_comptes', 'suspendre_comptes']

    def valider_comptes(self, request, queryset):
        queryset.update(statut='valide')
        self.message_user(request, "Comptes validés avec succès.")
    valider_comptes.short_description = "✅ Valider les comptes sélectionnés"

    def rejeter_comptes(self, request, queryset):
        queryset.update(statut='rejete')
        self.message_user(request, "Comptes rejetés.")
    rejeter_comptes.short_description = "❌ Rejeter les comptes sélectionnés"

    def suspendre_comptes(self, request, queryset):
        queryset.update(statut='suspendu')
        self.message_user(request, "Comptes suspendus.")
    suspendre_comptes.short_description = "⛔ Suspendre les comptes sélectionnés"