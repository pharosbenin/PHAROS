from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0005_add_avis_disponible'),
    ]

    operations = [
        migrations.AlterField(
            model_name='modification',
            name='sens',
            field=models.CharField(
                choices=[('hausse', 'Hausse'), ('baisse', 'Baisse'), ('neutre', 'Neutre')],
                default='baisse',
                max_length=10,
            ),
        ),
    ]
