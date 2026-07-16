from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def _debug_storage(request):
    return JsonResponse({
        'default_file_storage': getattr(settings, 'DEFAULT_FILE_STORAGE', None),
        'cloud_name_defini': bool(settings.CLOUDINARY_STORAGE.get('CLOUD_NAME')),
        'cloud_name_longueur': len(settings.CLOUDINARY_STORAGE.get('CLOUD_NAME', '')),
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
