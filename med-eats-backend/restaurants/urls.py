from django.urls import path
from .views import RestaurantListAPIView, CategoryListAPIView

# ============================================================
# RUTAS DE LA APP RESTAURANTES 
# ------------------------------------------------------------
# ¿Qué son las URLs?
# Es el equivalente a los "caminos" en un mapa. Conectan una dirección de internet
# específica (ejemplo /api/restaurants) con las "Vistas" que programamos en views.py.
# ============================================================

urlpatterns = [
    # Si React Native hace un GET a http://localhost:8000/api/restaurants/
    # Se disparará nuestra lista completa de restaurantes convertida a JSON.
    path('restaurants/', RestaurantListAPIView.as_view(), name='restaurant-list'),
    
    # Si se hace a /api/categories/, enviará las categorías separadas.
    path('categories/', CategoryListAPIView.as_view(), name='category-list'),
]
