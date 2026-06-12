from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0004_modification_hausse_baisse'),
    ]

    operations = [
        migrations.AddField(
            model_name='reservation',
            name='avis_disponible',
            field=models.BooleanField(default=False),
        ),
    ]
