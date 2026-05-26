from django.core.management.base import BaseCommand
from restaurants.models import Category

DEFAULT_FOOD_CATEGORIES = [
    "Colombian Traditional",
    "Japanese & Sushi",
    "Burgers & Grill",
    "Italian & Pizza",
    "Healthy Food",
    "Mexican",
    "Café & Bakery",
    "Peruvian",
]


class Command(BaseCommand):
    help = "Crea las categorías de comida por defecto si no existen"

    def handle(self, *args, **options):
        created_count = 0
        for name in DEFAULT_FOOD_CATEGORIES:
            _, created = Category.objects.get_or_create(name=name)
            if created:
                created_count += 1
                self.stdout.write(f"  Creada: {name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Categorías procesadas. {created_count} nuevas creadas."
            )
        )
