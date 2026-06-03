from django.urls import path
from .views import (
    DemarrerNegociationView,
    NegociationDetailView,
    EnvoyerPropositionView,
    AccepterNegociationView,
    RefuserNegociationView,
)

urlpatterns = [
   
    # LA MODIFICATION À AJOUTER :
    path(
        'demarrer/', 
        DemarrerNegociationView.as_view(), 
        name='negociation-demarrer'
    ),
    
    # Tes autres routes restaient inchangées :
    path('<int:negociation_id>/', NegociationDetailView.as_view(), name='negociation-detail'),
    path('<int:negociation_id>/envoyer/', EnvoyerPropositionView.as_view(), name='negociation-envoyer'),
    path('<int:negociation_id>/accepter/', AccepterNegociationView.as_view(), name='negociation-accepter'),
    path('<int:negociation_id>/refuser/', RefuserNegociationView.as_view(), name='negociation-refuser'),
]