from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.core.files.base import File
from django.core.management.base import BaseCommand, CommandError
from django.db.models import FileField


class Command(BaseCommand):
    help = (
        "Ré-uploade sur Cloudinary tous les fichiers médias (photos, documents) "
        "actuellement stockés en local (backend/media/), et met à jour les lignes "
        "en base pour pointer vers Cloudinary."
    )

    def handle(self, *args, **options):
        if not settings.CLOUDINARY_STORAGE.get('CLOUD_NAME'):
            raise CommandError(
                "CLOUDINARY_CLOUD_NAME n'est pas défini. "
                "Définis CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET "
                "avant de lancer cette commande."
            )

        migres = 0
        introuvables = 0
        deja_absents = 0

        for model in apps.get_models():
            champs_fichier = [f for f in model._meta.get_fields() if isinstance(f, FileField)]
            if not champs_fichier:
                continue

            for instance in model.objects.all():
                for champ in champs_fichier:
                    valeur = getattr(instance, champ.name)
                    if not valeur or not valeur.name:
                        continue

                    chemin_local = Path(settings.BASE_DIR) / 'media' / valeur.name
                    if not chemin_local.exists():
                        self.stdout.write(self.style.WARNING(
                            f"Introuvable en local : {model.__name__}#{instance.pk}.{champ.name} -> {valeur.name}"
                        ))
                        introuvables += 1
                        continue

                    try:
                        with open(chemin_local, 'rb') as f:
                            nom_fichier = Path(valeur.name).name
                            valeur.save(nom_fichier, File(f), save=True)
                    except Exception as exc:
                        self.stdout.write(self.style.ERROR(
                            f"Échec : {model.__name__}#{instance.pk}.{champ.name} -> {exc}"
                        ))
                        deja_absents += 1
                        continue
                    migres += 1
                    self.stdout.write(f"Migré : {model.__name__}#{instance.pk}.{champ.name}")

        self.stdout.write(self.style.SUCCESS(
            f"Terminé. {migres} fichier(s) migré(s), {introuvables} introuvable(s) en local, "
            f"{deja_absents} échec(s) d'upload."
        ))
