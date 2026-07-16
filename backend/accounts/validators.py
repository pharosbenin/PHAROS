import re

from django.core.exceptions import ValidationError


class ValidateurMotDePasseFort:
    """Exige au moins une majuscule, une minuscule, un chiffre et un caractère spécial."""

    def validate(self, password, user=None):
        manquants = []
        if not re.search(r'[A-Z]', password):
            manquants.append("une majuscule")
        if not re.search(r'[a-z]', password):
            manquants.append("une minuscule")
        if not re.search(r'\d', password):
            manquants.append("un chiffre")
        if not re.search(r'[^A-Za-z0-9]', password):
            manquants.append("un caractère spécial")
        if manquants:
            raise ValidationError(
                "Le mot de passe doit contenir au moins " + ", ".join(manquants) + ".",
                code='mot_de_passe_faible',
            )

    def get_help_text(self):
        return (
            "Le mot de passe doit contenir au moins 8 caractères, une majuscule, "
            "une minuscule, un chiffre et un caractère spécial."
        )
