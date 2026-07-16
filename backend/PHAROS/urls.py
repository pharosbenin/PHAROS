from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def _debug_storage(request):
    from django.core.files.storage import default_storage
    from hotels.models import Hotel
    hotel = Hotel.objects.exclude(photo_principale='').filter(photo_principale__isnull=False).first()
    exemple = None
    if hotel and hotel.photo_principale:
        exemple = {
            'name_en_base': hotel.photo_principale.name,
            'url_calculee': hotel.photo_principale.url,
            'storage_du_champ': hotel.photo_principale.storage.__class__.__module__ + '.' + hotel.photo_principale.storage.__class__.__name__,
        }
    return JsonResponse({
        'default_file_storage': getattr(settings, 'DEFAULT_FILE_STORAGE', None),
        'storages_dict': getattr(settings, 'STORAGES', None),
        'cloud_name_defini': bool(settings.CLOUDINARY_STORAGE.get('CLOUD_NAME')),
        'cloud_name_longueur': len(settings.CLOUDINARY_STORAGE.get('CLOUD_NAME', '')),
        'default_storage_class': default_storage.__class__.__module__ + '.' + default_storage.__class__.__name__,
        'exemple_hotel': exemple,
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('_debug/storage/', _debug_storage),
    path('api/', include('accounts.urls')),
    path('api/', include('hotels.urls')),
    path('api/', include('reservations.urls')),
    path('api/', include('avis.urls')),
    path('api/', include('commissions.urls')),
    path('api/', include('evenements.urls')),
    path('api/', include('assistance.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
