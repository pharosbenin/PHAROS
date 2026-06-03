from django.urls import path
urlpatterns = []
from django.urls import path
from .views import (
    EvaluerTransporteurView,
    StatistiquesTransporteurView,
    MesEvaluationsView,
    ToutesLesEvaluationsView,
)

urlpatterns = [
    # Commerçant
    path('evaluer/', EvaluerTransporteurView.as_view(), name='evaluer-transporteur'),

    # Public
    path('statistiques/<int:pk>/', StatistiquesTransporteurView.as_view(), name='statistiques-transporteur'),

    # Transporteur
    path('mes-evaluations/', MesEvaluationsView.as_view(), name='mes-evaluations'),

    # Admin
    path('admin/toutes/', ToutesLesEvaluationsView.as_view(), name='toutes-evaluations'),
]