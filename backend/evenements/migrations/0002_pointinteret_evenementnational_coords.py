from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('evenements', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='evenementnational',
            name='latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='evenementnational',
            name='longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.CreateModel(
            name='PointInteret',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=200)),
                ('ville', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('categorie', models.CharField(choices=[('historique', 'Site historique'), ('culturel', 'Site culturel'), ('religieux', 'Site religieux'), ('naturel', 'Site naturel')], max_length=20)),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='points_interet/')),
                ('actif', models.BooleanField(default=True)),
            ],
            options={
                'verbose_name': "Point d'intérêt",
                'verbose_name_plural': "Points d'intérêt",
                'ordering': ['ville', 'nom'],
            },
        ),
    ]
