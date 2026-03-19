from rest_framework import serializers
from .models import Category, Restaurant

# ============================================================
# SERIALIZADORES (Traducción Base de Datos -> JSON)
# ------------------------------------------------------------
# ¿Por qué necesitamos Serializadores?
# Aunque tenemos nuestros Modelos (como Restaurant), el celular (React Native) 
# no sabe leer "Trozos" de Python ni objetos directos de la base de datos PostgreSQL.
# El celular, como buena app Javascript, solo lee formato JSON.
# El Serializador actúa como un TRADUCTOR automático: toma el objeto de BD,
# extrae sus campos, y lo arma como un JSON bonito y estructurado.
# ============================================================

class CategorySerializer(serializers.ModelSerializer):
    """
    Traductor para el modelo Categoría.
    """
    class Meta:
        # 1. ¿Qué modelo queremos serializar?
        model = Category
        # 2. ¿Qué columnas/campos queremos que el celular reciba?
        fields = ['id', 'name']


class RestaurantSerializer(serializers.ModelSerializer):
    """
    Traductor principal para enviar la información de Restaurantes a HomeScreen.tsx
    """
    
    # Truco Profesional: Si no escribimos esto, Django solo enviaría "category": 1.
    # El celular tendría que hacer otra petición para saber que "1" significa "Japonesa".
    # Con source='category.name' forzamos a que el JSON envíe un string con el nombre descriptivo directamente, ahorrando tiempo y carga de red.
    category = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Restaurant
        # '__all__' es un atajo que le dice a Django: "Convierte a JSON
        # absolutamente todo lo que esté en la tabla de este restaurante
        # (latitud, longitud, imagen, whatsapp, etc.)".
        fields = '__all__'
