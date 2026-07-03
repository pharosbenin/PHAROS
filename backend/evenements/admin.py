from django.contrib import admin
from .models import EvenementNational, MiseEnAvantHotel, PointInteret


@admin.register(EvenementNational)
class EvenementAdmin(admin.ModelAdmin):
    list_display = ('nom', 'categorie', 'date_debut', 'date_fin', 'region', 'est_actif')
    list_filter = ('categorie', 'est_actif')
    search_fields = ('nom', 'region')
    list_editable = ('est_actif',)


@admin.register(PointInteret)
class PointInteretAdmin(admin.ModelAdmin):
    list_display = ('nom', 'ville', 'categorie', 'actif')
    list_filter = ('ville', 'categorie', 'actif')
    search_fields = ('nom', 'ville')


@admin.register(MiseEnAvantHotel)
class MiseEnAvantAdmin(admin.ModelAdmin):
    list_display = ('hotel', 'evenement', 'position_boost', 'date_boost_debut', 'date_boost_fin', 'est_actif')
    list_filter = ('est_actif',)
    search_fields = ('hotel__nom', 'evenement__nom')
