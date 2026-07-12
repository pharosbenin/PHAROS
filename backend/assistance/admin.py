from django.contrib import admin
from .models import CategorieService, ServiceProximite


@admin.register(CategorieService)
class CategorieServiceAdmin(admin.ModelAdmin):
    list_display = ('nom', 'code', 'ordre', 'actif')
    list_filter = ('actif',)
    search_fields = ('nom', 'code')
    prepopulated_fields = {'code': ('nom',)}


@admin.register(ServiceProximite)
class ServiceProximiteAdmin(admin.ModelAdmin):
    list_display = ('nom', 'categorie', 'ville', 'source', 'actif', 'date_modification')
    list_filter = ('ville', 'categorie', 'source', 'actif')
    search_fields = ('nom', 'adresse', 'ville', 'identifiant_externe')
    readonly_fields = ('date_creation', 'date_modification')
    list_select_related = ('categorie',)
