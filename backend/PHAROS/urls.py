from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('hotels.urls')),
    path('api/', include('reservations.urls')),
    path('api/', include('avis.urls')),
    path('api/', include('commissions.urls')),
    path('api/', include('evenements.urls')),
    path('api/', include('assistance.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
