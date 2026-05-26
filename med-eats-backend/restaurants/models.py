from django.db import models
from django.conf import settings
from django.utils import timezone

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
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_restaurants",
        verbose_name="Propietario (cuenta restaurante)",
    )

    name = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name="Nombre del restaurante",
    )

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
        db_index=True,
        verbose_name="Calificación",
    )

    # URLField: Es similar a CharField, pero internamente Django valida que el texto escrito
    # sea obligatoriamente un formato de enlace HTTP/HTTPS válido.
    # ImageField: La forma profesional de manejar imágenes en Django.
    # Permite subir archivos directamente desde el celular y Django se encarga
    # de guardarlos en la carpeta 'media/restaurants/'.
    image = models.ImageField(
        upload_to="restaurants/",
        max_length=500,
        null=True,
        blank=True,
        verbose_name="Imagen del Restaurante",
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

    menu_pdf = models.FileField(
        upload_to="menus/",
        max_length=500,
        null=True,
        blank=True,
        verbose_name="Menú PDF",
    )

    # Campos de "Auditoría" (Buena práctica en empresas profesionales).
    # Se llenan automáticamente solos cuando se crea o modifica el registro por primera vez (auto_now_add y auto_now).
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner"],
                condition=models.Q(owner__isnull=False),
                name="unique_restaurant_per_owner",
            )
        ]
        # [P2-10] Índices para acelerar filtros frecuentes
        indexes = [
            models.Index(fields=["category"], name="restaurant_category_idx"),
            models.Index(fields=["owner"], name="restaurant_owner_idx"),
            models.Index(fields=["created_at"], name="restaurant_created_idx"),
        ]


class RestaurantBranch(models.Model):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="branches",
        verbose_name="Restaurante",
    )
    address = models.CharField(max_length=255, verbose_name="Dirección")
    latitude = models.FloatField(verbose_name="Latitud")
    longitude = models.FloatField(verbose_name="Longitud")
    is_primary = models.BooleanField(default=False, verbose_name="Sede principal")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Sede de restaurante"
        verbose_name_plural = "Sedes de restaurantes"
        ordering = ["-is_primary", "address"]

    def __str__(self):
        return f"{self.restaurant.name} - {self.address}"


class Review(models.Model):
    """
    Modelo que representa una reseña pública de un restaurante ligada a un usuario real.
    """

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Restaurante",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="restaurant_reviews",
        verbose_name="Usuario",
    )
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        verbose_name="Calificación",
    )
    comment = models.TextField(verbose_name="Comentario")
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Fecha de creación",
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Última actualización"
    )

    class Meta:
        verbose_name = "Reseña"
        verbose_name_plural = "Reseñas"
        unique_together = ("user", "restaurant")
        ordering = ["-created_at"]
        # [P2-10] Índices para acelerar listados por restaurante y usuario
        indexes = [
            models.Index(fields=["restaurant"], name="review_restaurant_idx"),
            models.Index(fields=["user"], name="review_user_idx"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.restaurant.name} ({self.rating})"


class Post(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
        verbose_name="Usuario",
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="posts",
        verbose_name="Restaurante",
    )
    image = models.FileField(
        upload_to="posts/", max_length=500, verbose_name="Imagen/Video"
    )
    rating = models.PositiveSmallIntegerField(verbose_name="Calificación")
    caption = models.TextField(blank=True, verbose_name="Caption")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        # [P2-10] Composite index alineado con el ordering del feed cursor-paginated
        indexes = [
            models.Index(fields=["-created_at", "-id"], name="post_feed_idx"),
            models.Index(fields=["user"], name="post_user_idx"),
            models.Index(fields=["restaurant"], name="post_restaurant_idx"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.restaurant.name}"


class PostLike(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="likes",
        verbose_name="Post",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_likes",
        verbose_name="Usuario",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["post", "user"],
                name="unique_post_like",
            )
        ]


class PostComment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments",
        verbose_name="Post",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_comments",
        verbose_name="Usuario",
    )
    content = models.TextField(verbose_name="Comentario")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class SavedRestaurant(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_restaurants",
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="saved_by_users",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "restaurant"],
                name="unique_saved_restaurant_per_user",
            )
        ]
        ordering = ["-created_at", "-id"]


class VisitedRestaurant(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="visited_restaurants",
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="visited_by_users",
    )
    rating = models.PositiveSmallIntegerField()
    visit_date = models.DateField(default=timezone.now)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "restaurant"],
                name="unique_visited_restaurant_per_user",
            )
        ]
        ordering = ["-visit_date", "-updated_at", "-id"]


# ============================================================
# [P2-1] Modelos de moderación y analytics
# ------------------------------------------------------------
# Estos modelos ya existían en la migración 0013 pero no estaban
# definidos como clases Python. Ahora son importables directamente
# desde models y AnalyticsOverviewAPIView ya no necesita try/except.
# ============================================================


class ContentReport(models.Model):
    REASON_CHOICES = [
        ("spam", "Spam"),
        ("harassment", "Acoso"),
        ("hate_speech", "Discurso de odio"),
        ("inappropriate_content", "Contenido inapropiado"),
        ("misinformation", "Desinformación"),
        ("other", "Otro"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("reviewed", "Revisado"),
        ("dismissed", "Rechazado"),
        ("actioned", "Accionado"),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="content_reports",
        verbose_name="Reportero",
    )
    post = models.ForeignKey(
        "Post",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reports",
        verbose_name="Post reportado",
    )
    comment = models.ForeignKey(
        "PostComment",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reports",
        verbose_name="Comentario reportado",
    )
    reason = models.CharField(
        max_length=50, choices=REASON_CHOICES, verbose_name="Razón del reporte"
    )
    description = models.TextField(blank=True, verbose_name="Descripción adicional")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        db_index=True,
        verbose_name="Estado",
    )
    admin_notes = models.TextField(blank=True, verbose_name="Notas del administrador")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_reports",
        verbose_name="Revisado por",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Reporte de contenido"
        verbose_name_plural = "Reportes de contenido"
        ordering = ["-created_at"]


class PlatformAnalytics(models.Model):
    date = models.DateField(db_index=True, verbose_name="Fecha")
    total_users = models.IntegerField(default=0, verbose_name="Total de usuarios")
    new_users = models.IntegerField(default=0, verbose_name="Nuevos usuarios")
    active_users = models.IntegerField(default=0, verbose_name="Usuarios activos")
    total_restaurants = models.IntegerField(default=0, verbose_name="Total de restaurantes")
    new_restaurants = models.IntegerField(default=0, verbose_name="Nuevos restaurantes")
    total_posts = models.IntegerField(default=0, verbose_name="Total de posts")
    new_posts = models.IntegerField(default=0, verbose_name="Nuevos posts")
    total_reviews = models.IntegerField(default=0, verbose_name="Total de reseñas")
    new_reviews = models.IntegerField(default=0, verbose_name="Nuevas reseñas")
    total_likes = models.IntegerField(default=0, verbose_name="Total de likes")
    total_comments = models.IntegerField(default=0, verbose_name="Total de comentarios")
    content_reports = models.IntegerField(default=0, verbose_name="Reportes de contenido")
    posts_removed = models.IntegerField(default=0, verbose_name="Posts removidos")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Analytics de la plataforma"
        verbose_name_plural = "Analytics de la plataforma"
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(fields=["date"], name="unique_analytics_per_date"),
        ]


class PostModeration(models.Model):
    ACTION_CHOICES = [
        ("hidden", "Oculto"),
        ("deleted", "Eliminado"),
        ("flagged", "Marcado para revisión"),
        ("restored", "Restaurado"),
    ]
    REASON_CHOICES = [
        ("spam", "Spam"),
        ("harassment", "Acoso"),
        ("hate_speech", "Discurso de odio"),
        ("inappropriate_content", "Contenido inapropiado"),
        ("misinformation", "Desinformación"),
        ("other", "Otro"),
    ]

    post = models.OneToOneField(
        "Post",
        on_delete=models.CASCADE,
        related_name="moderation",
        verbose_name="Post",
    )
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="moderated_posts",
        verbose_name="Moderador",
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name="Acción")
    reason = models.CharField(
        max_length=50, choices=REASON_CHOICES, verbose_name="Razón de moderación"
    )
    notes = models.TextField(blank=True, verbose_name="Notas")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Moderación de post"
        verbose_name_plural = "Moderaciones de posts"
        ordering = ["-created_at"]


class AdminAuditLog(models.Model):
    ACTION_CHOICES = [
        ("create", "Crear"),
        ("update", "Actualizar"),
        ("delete", "Eliminar"),
        ("moderate", "Moderar"),
        ("restore", "Restaurar"),
    ]
    MODEL_TYPE_CHOICES = [
        ("restaurant", "Restaurante"),
        ("post", "Post"),
        ("comment", "Comentario"),
        ("user", "Usuario"),
    ]

    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="admin_audit_logs",
        verbose_name="Usuario administrador",
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name="Acción")
    model_type = models.CharField(
        max_length=20, choices=MODEL_TYPE_CHOICES, verbose_name="Tipo de modelo"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID del objeto")
    object_name = models.CharField(max_length=255, verbose_name="Nombre del objeto")
    changes = models.JSONField(default=dict, blank=True, verbose_name="Cambios realizados")
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, verbose_name="Dirección IP"
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Log de auditoría del admin"
        verbose_name_plural = "Logs de auditoría del admin"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(
                fields=["admin_user", "-timestamp"],
                name="restaurants_admin_u_728c9f_idx",
            ),
            models.Index(
                fields=["model_type", "object_id"],
                name="restaurants_model_t_f7e0ab_idx",
            ),
        ]
