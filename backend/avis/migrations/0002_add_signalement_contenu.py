from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('avis', '0001_initial'),
        ('hotels', '0010_add_promotion'),
        ('reservations', '0005_add_avis_disponible'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SignalementContenu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('avis_initial', models.TextField()),
                ('explication', models.TextField()),
                ('date_signalement', models.DateTimeField(auto_now_add=True)),
                ('statut', models.CharField(
                    choices=[('en_attente', 'En attente'), ('traite', 'Traité')],
                    default='en_attente', max_length=20
                )),
                ('client', models.ForeignKey(
                    null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name='signalements_contenu',
                    to=settings.AUTH_USER_MODEL
                )),
                ('hotel', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='signalements_contenu',
                    to='hotels.hotel'
                )),
                ('reservation', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='signalements_contenu',
                    to='reservations.reservation'
                )),
            ],
            options={
                'verbose_name': 'Signalement de contenu',
                'ordering': ['-date_signalement'],
            },
        ),
    ]
