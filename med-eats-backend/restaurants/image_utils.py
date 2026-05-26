import io
import logging
from PIL import Image
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)

MAX_POST_IMAGE_SIZE = (1080, 1080)
MAX_AVATAR_SIZE = (400, 400)
MAX_RESTAURANT_IMAGE_SIZE = (1200, 800)
WEBP_QUALITY = 85


def process_image(image_field, max_size: tuple, prefix: str = "img") -> ContentFile:
    """Redimensiona y convierte una imagen a WebP.

    Retorna un ContentFile listo para guardar en el modelo. Si el procesamiento
    falla, devuelve la imagen original sin alterar para no bloquear el upload.
    """
    try:
        img = Image.open(image_field)

        # Convertir a RGB si trae canal alfa (WebP soporta alfa, pero JPEG no)
        if img.mode in ("RGBA", "P", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(
                img,
                mask=img.split()[-1] if img.mode == "RGBA" else None,
            )
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        img.thumbnail(max_size, Image.LANCZOS)

        output = io.BytesIO()
        img.save(output, format="WEBP", quality=WEBP_QUALITY, method=6)
        output.seek(0)

        return ContentFile(output.read(), name=f"{prefix}.webp")
    except Exception as e:
        logger.error("Image processing failed: %s", e)
        image_field.seek(0)
        return image_field
