from rest_framework.permissions import BasePermission


class EstClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'


class EstGestionnaire(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'gestionnaire'


class EstAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class EstClientOuGestionnaire(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('client', 'gestionnaire')


class EstNonSuspendu(BasePermission):
    message = "Votre compte a été suspendu."

    def has_permission(self, request, view):
        return request.user.is_authenticated and not request.user.est_suspendu


class EstHotelValide(BasePermission):
    message = "Votre établissement est en attente de validation par un administrateur."

    def has_permission(self, request, view):
        if not request.user.is_authenticated or request.user.role != 'gestionnaire':
            return False
        from hotels.models import Hotel
        return Hotel.objects.filter(gestionnaire=request.user, statut='valide').exists()
