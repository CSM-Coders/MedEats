from django.contrib import admin
from .models import Category, Restaurant

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
