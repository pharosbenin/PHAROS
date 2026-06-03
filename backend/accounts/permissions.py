from rest_framework.permissions import BasePermission


# ============================================================
# ADMINISTRATEUR UNIQUEMENT
# ============================================================
class IsAdminUser(BasePermission):
    """Seul l'administrateur peut accéder à cette ressource."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


# ============================================================
# COMMERCANT UNIQUEMENT
# ============================================================
class IsCommercant(BasePermission):
    """Seul le commerçant peut accéder à cette ressource."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == 'commercant' and
            request.user.statut == 'valide'
        )


# ============================================================
# TRANSPORTEUR UNIQUEMENT (independant ou societe)
# ============================================================
class IsTransporteur(BasePermission):
    """Seul le transporteur peut accéder à cette ressource."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['transporteur', 'societe'] and
            request.user.statut == 'valide'
        )


# ============================================================
# COMPTE VALIDE UNIQUEMENT
# ============================================================
class IsCompteValide(BasePermission):
    """Seuls les comptes validés par l'admin peuvent accéder."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.statut == 'valide'
        )


# ============================================================
# COMMERCANT OU ADMIN
# ============================================================
class IsCommercantOuAdmin(BasePermission):
    """Commerçant ou administrateur peuvent accéder."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['commercant', 'admin']
        )


# ============================================================
# TRANSPORTEUR OU ADMIN
# ============================================================
class IsTransporteurOuAdmin(BasePermission):
    """Transporteur ou administrateur peuvent accéder."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['transporteur', 'societe', 'admin']
        )