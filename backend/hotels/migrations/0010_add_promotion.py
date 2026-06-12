from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('hotels', '0009_add_politique_annulation'),
    ]

    operations = [
        migrations.CreateModel(
            name='Promotion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titre', models.CharField(blank=True, max_length=100)),
                ('prix_promo', models.DecimalField(
                    decimal_places=2, max_digits=10,
                    validators=[django.core.validators.MinValueValidator(0)]
                )),
                ('date_debut', models.DateField()),
                ('date_fin', models.DateField()),
                ('est_active', models.BooleanField(default=True)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('type_chambre', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='promotions',
                    to='hotels.typechambre'
                )),
            ],
            options={
                'verbose_name': 'Promotion',
                'ordering': ['-date_creation'],
            },
        ),
    ]
