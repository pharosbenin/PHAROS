from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'telephone', 'est_suspendu', 'is_active')
    list_filter = ('role', 'est_suspendu', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    fieldsets = UserAdmin.fieldsets + (
        ('Infos PHAROS', {'fields': ('role', 'telephone', 'photo_profil', 'est_suspendu')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Infos PHAROS', {'fields': ('role', 'telephone')}),
    )
