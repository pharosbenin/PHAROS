"""
URL configuration for Benin_Transport project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""



from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Admin Django
    path('admin/', admin.site.urls),

    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Nos applications
    path('api/accounts/', include('accounts.urls')),
    path('api/demandes/', include('demandes.urls')),
    path('api/offres/', include('offres.urls')),
    path('api/livraisons/', include('livraisons.urls')),
    path('api/paiements/', include('paiements.urls')),
    path('api/evaluations/', include('evaluations.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/litiges/', include('litiges.urls')),
    path('api/negociations/', include('negociations.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)