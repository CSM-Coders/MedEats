from django.contrib import admin
from .models import (
    Category,
    Post,
    PostComment,
    PostLike,
    Restaurant,
    Review,
    SavedRestaurant,
    VisitedRestaurant,
)

# ============================================================
# PANEL DE ADMINISTRACIÓN (Django Admin)
# ------------------------------------------------------------
# ¿Para qué sirve admin.py?
# Django trae una página web secreta (el "Admin Panel") construida por defecto.
# Al registrar nuestros modelos (Category y Restaurant) aquí, Django
# lee la base de datos y crea un formulario visual automáticamente.
# Así tú como administrador puedes agregar restaurantes desde una página web
# sin tener que escribir código ni saber usar PostgreSQL.
# ============================================================


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    # list_display: Le dice al panel qué columnas mostrar en la lista general.
    list_display = ("id", "name")

    # search_fields: Añade una barra de búsqueda inteligente en la parte superior.
    search_fields = ("name",)


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    # En un restaurante nos interesa ver un resumen rápido antes de entrar al detalle.
    list_display = ("name", "category", "rating", "location")

    # list_filter: Crea un panel lateral que te permite filtrar (ej: "Mostrar solo comida italiana").
    list_filter = ("category",)

    # search_fields: Permite buscar restaurantes escribiendo su nombre o ubicación.
    search_fields = ("name", "location")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("restaurant", "username", "rating", "date")
    list_filter = ("restaurant",)
    search_fields = ("username", "comment")


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "restaurant", "rating", "created_at")
    list_filter = ("restaurant",)
    search_fields = ("user__username", "restaurant__name", "caption")


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "created_at")
    search_fields = ("user__username",)


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "created_at")
    search_fields = ("user__username", "content")


@admin.register(SavedRestaurant)
class SavedRestaurantAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "restaurant", "created_at")
    search_fields = ("user__username", "restaurant__name")


@admin.register(VisitedRestaurant)
class VisitedRestaurantAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "restaurant", "rating", "visit_date")
    search_fields = ("user__username", "restaurant__name", "note")
