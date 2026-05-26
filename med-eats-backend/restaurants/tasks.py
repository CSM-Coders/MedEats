import logging
from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def geocode_restaurant_task(self, restaurant_id: int):
    """Geocodifica las coordenadas de un restaurante en background.

    Se ejecuta después de crear/actualizar un restaurante con nueva dirección.
    Usa reintentos automáticos en caso de fallo de red con Nominatim.
    """
    from .models import Restaurant
    from .utils import geocoder

    try:
        restaurant = Restaurant.objects.get(id=restaurant_id)
        lat, lon = geocoder.geocode(restaurant.location)

        with transaction.atomic():
            Restaurant.objects.filter(id=restaurant_id).update(
                latitude=lat,
                longitude=lon,
            )
        logger.info("Geocoded restaurant %d: (%.4f, %.4f)", restaurant_id, lat, lon)
    except Restaurant.DoesNotExist:
        logger.warning("Restaurant %d not found for geocoding", restaurant_id)
    except Exception as exc:
        logger.error("Geocoding failed for restaurant %d: %s", restaurant_id, exc)
        raise self.retry(exc=exc)
