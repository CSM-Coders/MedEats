from django.db import models

# ============================================================
# MODELOS DE DOMINIO BACKEND (Sprint 1)
# ------------------------------------------------------------
# ¿Qué es un "Modelo" en Django?
# Es una clase de Python que representa una tabla en la base de datos PostgreSQL.
# Al heredar de `models.Model`, Django se encarga de crear las tablas por nosotros
# sin que tengamos que escribir código SQL (como CREATE TABLE). Además, nos da
# funciones automáticas para buscar, guardar y borrar registros.
# ============================================================


class Category(models.Model):
    """
    Modelo que representa una Categoría de comida.
    Ejemplos que crearemos: "Colombian Traditional", "Italian & Pizza".
    """

    # CharField es un campo de texto corto. "max_length" es obligatorio
    # para no desperdiciar espacio en la base de datos PostgreSQL.
    # unique=True garantiza que la base de datos no permita crear dos categorías con el mismo exacto nombre.
    name = models.CharField(
        max_length=100, unique=True, verbose_name="Nombre de la categoría"
    )

    # __str__ es una función especial de Python (metodo mágico o dunder method).
    # Define cómo se mostrará este objeto como texto, por ejemplo cuando tú entres
    # al panel de Administrador de Django para agregar comida, verás el nombre real y no algo raro como "Category Object (1)".
    def __str__(self):
        return self.name


class Restaurant(models.Model):
    """
    Modelo que representa un Restaurante físico en Medellín.
    Reemplaza todos los datos estáticos que antes estaban en mockData.ts.
    """

    # Nombre del restaurante.
    name = models.CharField(max_length=200, verbose_name="Nombre del restaurante")

    # ForeignKey: Es el concepto de "Llave Foránea" en Bases de Datos Relacionales.
    # Significa "Muchos a Uno": Muchos restaurantes pueden pertenecer a Una misma Categoría.
    # on_delete=models.SET_NULL: Instrucción de seguridad. Si mañana decides borrar la categoría "Italiana",
    # los restaurantes italianos NO se borrarán de la base de datos, simplemente su campo categoría quedará vacío (nulo).
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="restaurants",
        verbose_name="Categoría",
    )

    # DecimalField: Guarda números con decimales. Aquí guardamos la calificación (ej. 4.8).
    # null=True, blank=True: Permite que el administrador cree un restaurante nuevo que todavía no tiene calificación obligatoria.
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name="Calificación",
    )

    # URLField: Es similar a CharField, pero internamente Django valida que el texto escrito
    # sea obligatoriamente un formato de enlace HTTP/HTTPS válido.
    image = models.URLField(
        max_length=500, null=True, blank=True, verbose_name="URL de la Imagen"
    )

    # FloatField: Para coordenadas geográficas reales.
    # Es obligatorio para poder pintar los "Markers" (Pines) en tu MapView de React Native.
    latitude = models.FloatField(verbose_name="Latitud")
    longitude = models.FloatField(verbose_name="Longitud")

    # Ubicación en texto legible humano. Ejemplo: "El Poblado, Medellín".
    location = models.CharField(max_length=255, verbose_name="Ubicación/Barrio")

    # TextField: Es para textos largos sin límite estricto de caracteres, ideal para la bio/descripción.
    description = models.TextField(verbose_name="Descripción")

    # JSONField: Un poder especial de PostgreSQL que Django aprovecha.
    # Permite guardar listas completas de strings (ej: ["Arepa", "Empanada", "Bandeja"]) en un solo campo
    # de la base de datos sin necesidad de crear una tabla relacional separada para los platos destacados.
    menu_highlights = models.JSONField(
        default=list, blank=True, verbose_name="Platos Destacados"
    )

    # Número de contacto. Es CharField porque los números de teléfono pueden tener "+", "()", o espacios.
    whatsapp = models.CharField(
        max_length=50, blank=True, verbose_name="Número de WhatsApp"
    )

    # Campos de "Auditoría" (Buena práctica en empresas profesionales).
    # Se llenan automáticamente solos cuando se crea o modifica el registro por primera vez (auto_now_add y auto_now).
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Review(models.Model):
    """
    Modelo que representa una reseña pública de un restaurante.
    """

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Restaurante",
    )
    username = models.CharField(max_length=150, verbose_name="Usuario")
    avatar = models.URLField(
        max_length=500, blank=True, verbose_name="URL del avatar"
    )
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        verbose_name="Calificación",
    )
    comment = models.TextField(verbose_name="Comentario")
    date = models.DateField(auto_now_add=True, verbose_name="Fecha")

    def __str__(self):
        return f"{self.username} - {self.restaurant.name}"
