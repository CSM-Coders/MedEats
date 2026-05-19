import logging
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from django.conf import settings

logger = logging.getLogger(__name__)


class GeocodingService:
    """
    Servicio profesional de geocodificación para MedEats.
    Por defecto usa Nominatim (OSM), pero está diseñado para ser extensible.
    """

    DEFAULT_CITY = "Medellín"
    DEFAULT_COUNTRY = "Colombia"
    # Coordenadas por defecto (Centro de Medellín)
    DEFAULT_LAT = 6.2442
    DEFAULT_LON = -75.5812
    # Bounding Box de Medellín (para que no busque fuera de la ciudad)
    MEDELLIN_VIEWBOX = [-75.65, 6.13, -75.52, 6.32]

    def __init__(self, user_agent=None):
        import random
        import time

        # User agent único para evitar el error 429
        ua = user_agent or f"MedEats_App_Production_{random.randint(1000, 9999)}"
        self.geolocator = Nominatim(user_agent=ua)
        self.last_request_time = 0

    def _prepare_address(self, address: str) -> str:
        """
        Limpia la dirección quitando símbolos pero conservando Sur/Norte.
        """
        import re

        addr = address.replace("#", " ").replace("-", " ").replace(".", " ").strip()
        addr = re.sub(" +", " ", addr).strip()

        if "medellín" not in addr.lower() and "medellin" not in addr.lower():
            addr = f"{addr}, Medellín"
        if "colombia" not in addr.lower():
            addr = f"{addr}, Colombia"

        return addr

    def _strip_address(self, address: str) -> str:
        """
        Versión ultra-simplificada: quita #, -, sur, norte, etc.
        Probado exitosamente con 'Carrera 42 7a 92 Medellín'.
        """
        import re

        addr = address.lower()
        addr = addr.replace("#", " ").replace("-", " ").replace(".", " ")
        # Quitar orientaciones que confunden a Nominatim
        for word in ["sur", "norte", "este", "oeste", "no.", "no", "nro"]:
            addr = addr.replace(word, " ")
        addr = re.sub(" +", " ", addr).strip()

        if "medellín" not in addr and "medellin" not in addr:
            addr = f"{addr}, Medellín"
        if "colombia" not in addr:
            addr = f"{addr}, Colombia"

        return addr

    def geocode(self, address: str):
        """
        Convierte una dirección en coordenadas (lat, lon).
        Usa 3 estrategias con pausa de 1.1s entre cada una para evitar Error 429.
        """
        if not address or not address.strip():
            return self.DEFAULT_LAT, self.DEFAULT_LON

        # Estrategia 1: Dirección limpia (sin # ni -, pero con Sur/Norte)
        clean_addr = self._prepare_address(address)
        coords = self._do_geocode(clean_addr)
        if coords:
            return coords

        # Estrategia 2: Dirección ultra-simplificada (sin Sur/Norte/# ni -)
        stripped_addr = self._strip_address(address)
        coords = self._do_geocode(stripped_addr)
        if coords:
            return coords

        # Estrategia 3: Solo la ciudad (último recurso para no quedar en 0,0)
        coords = self._do_geocode(f"Medellín, Antioquia, Colombia")
        if coords:
            logger.warning(f"Could only geocode to city level for: {address}")
            return coords

        # Fallback absoluto: Centro de Medellín
        logger.warning(
            f"All geocoding strategies failed for: {address}. Using defaults."
        )
        return self.DEFAULT_LAT, self.DEFAULT_LON

    def _do_geocode(self, full_address: str):
        import time

        try:
            # Respetar el límite de 1 segundo de Nominatim para evitar Error 429
            elapsed = time.time() - self.last_request_time
            if elapsed < 1.2:
                time.sleep(1.2 - elapsed)

            location = self.geolocator.geocode(
                full_address,
                timeout=10,
                viewbox=[(6.13, -75.65), (6.32, -75.52)],
                bounded=True,
            )
            self.last_request_time = time.time()

            if location:
                logger.info(
                    f"Geocoding success: {full_address} -> ({location.latitude}, {location.longitude})"
                )
                return location.latitude, location.longitude
            return None
        except Exception as e:
            logger.error(f"Geocoding error for {full_address}: {str(e)}")
            self.last_request_time = time.time()
            return None


# Instancia singleton para uso global
geocoder = GeocodingService()
