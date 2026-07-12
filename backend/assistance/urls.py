from django.urls import path

from . import views

urlpatterns = [
    path('assistance/categories/', views.CategoriesActives.as_view(), name='assistance_categories'),
    path('assistance/mon-sejour/<uuid:numero_reservation>/', views.mon_sejour, name='assistance_mon_sejour'),
]
