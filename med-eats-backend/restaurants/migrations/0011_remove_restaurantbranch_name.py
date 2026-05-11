# Generated migration to remove name field from RestaurantBranch

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("restaurants", "0010_unique_restaurant_per_owner"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="restaurantbranch",
            name="name",
        ),
        migrations.AlterModelOptions(
            name="restaurantbranch",
            options={
                "ordering": ["-is_primary", "address"],
                "verbose_name": "Sede de restaurante",
                "verbose_name_plural": "Sedes de restaurantes",
            },
        ),
    ]
