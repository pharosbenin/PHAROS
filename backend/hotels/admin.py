from django.contrib import admin
from .models import Hotel, TypeChambre, PhotoHotel, PhotoChambre, PlatMenu, CommandeRestaurant, LigneCommande


class TypeChambreInline(admin.TabularInline):
    model = TypeChambre
    extra = 0
    fields = ('nom', 'capacite', 'prix_nuit', 'nombre_chambres', 'est_disponible')


class PhotoChambreInline(admin.TabularInline):
    model = PhotoChambre
    extra = 1
    fields = ('image', 'legende', 'ordre')


class PhotoHotelInline(admin.TabularInline):
    model = PhotoHotel
    extra = 0


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('nom', 'ville', 'gestionnaire', 'statut', 'type_abonnement', 'note_moyenne', 'date_creation')
    list_filter = ('statut', 'type_abonnement', 'ville')
    search_fields = ('nom', 'ville', 'gestionnaire__username')
    inlines = [TypeChambreInline, PhotoHotelInline]
    readonly_fields = ('note_moyenne', 'nombre_avis', 'date_creation', 'date_modification')
    actions = ['valider_hotels', 'rejeter_hotels']

    def valider_hotels(self, request, queryset):
        queryset.update(statut='valide')
    valider_hotels.short_description = 'Valider les hôtels sélectionnés'

    def rejeter_hotels(self, request, queryset):
        queryset.update(statut='rejete')
    rejeter_hotels.short_description = 'Rejeter les hôtels sélectionnés'


@admin.register(TypeChambre)
class TypeChambreAdmin(admin.ModelAdmin):
    list_display = ('nom', 'hotel', 'capacite', 'prix_nuit', 'nombre_chambres', 'est_disponible')
    list_filter = ('est_disponible',)
    search_fields = ('nom', 'hotel__nom')
    inlines = [PhotoChambreInline]


@admin.register(PlatMenu)
class PlatMenuAdmin(admin.ModelAdmin):
    list_display = ('nom', 'hotel', 'categorie', 'prix', 'est_disponible')
    list_filter = ('categorie', 'est_disponible')
    search_fields = ('nom', 'hotel__nom')


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 0
    readonly_fields = ('nom_plat', 'prix_unitaire', 'quantite', 'sous_total')
    fields = ('nom_plat', 'prix_unitaire', 'quantite', 'sous_total')


@admin.register(CommandeRestaurant)
class CommandeRestaurantAdmin(admin.ModelAdmin):
    list_display = ('id', 'hotel', 'reservation', 'statut', 'montant_total', 'date_commande')
    list_filter = ('statut',)
    search_fields = ('hotel__nom', 'reservation__numero')
    inlines = [LigneCommandeInline]
    readonly_fields = ('montant_total', 'date_commande', 'date_modification')
