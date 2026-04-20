from rest_framework import serializers
from .models import (
    Category,
    Post,
    Restaurant,
    Review,
    SavedRestaurant,
    VisitedRestaurant,
)

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
        fields = ["id", "name"]


class RestaurantSerializer(serializers.ModelSerializer):
    """
    Traductor principal para enviar la información de Restaurantes a HomeScreen.tsx
    """

    # Truco Profesional: Si no escribimos esto, Django solo enviaría "category": 1.
    # El celular tendría que hacer otra petición para saber que "1" significa "Japonesa".
    # Con source='category.name' forzamos a que el JSON envíe un string con el nombre descriptivo directamente, ahorrando tiempo y carga de red.
    category = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Restaurant
        # '__all__' es un atajo que le dice a Django: "Convierte a JSON
        # absolutamente todo lo que esté en la tabla de este restaurante
        # (latitud, longitud, imagen, whatsapp, etc.)".
        fields = "__all__"


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    avatar = serializers.SerializerMethodField()
    restaurant_id = serializers.PrimaryKeyRelatedField(
        source="restaurant",
        queryset=Restaurant.objects.all(),
        write_only=True,
    )
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "restaurant_id",
            "username",
            "avatar",
            "rating",
            "comment",
            "created_at",
            "is_owner",
        ]
        read_only_fields = ["created_at"]

    def get_avatar(self, obj):
        profile = getattr(obj.user, "profile", None)
        if not profile:
            return ""

        return profile.avatar_url

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        return obj.user == request.user

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("La calificación debe estar entre 1 y 5.")

        return value


class PostSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    user_avatar = serializers.SerializerMethodField()
    restaurant_id = serializers.CharField(source="restaurant.id", read_only=True)
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "user_id",
            "username",
            "user_avatar",
            "restaurant_id",
            "restaurant_name",
            "image",
            "rating",
            "caption",
            "likes_count",
            "comments_count",
            "is_liked",
            "created_at",
        ]

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        return obj.likes.filter(user=request.user).exists()

    def get_user_avatar(self, obj):
        profile = getattr(obj.user, "profile", None)
        if not profile:
            return ""

        return profile.avatar_url


class PostCreateSerializer(serializers.ModelSerializer):
    restaurant_id = serializers.PrimaryKeyRelatedField(
        source="restaurant",
        queryset=Restaurant.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Post
        fields = ["restaurant_id", "image", "rating", "caption"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")

        return value


class SavedRestaurantSerializer(serializers.ModelSerializer):
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        source="restaurant",
        queryset=Restaurant.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = SavedRestaurant
        fields = ["id", "restaurant", "restaurant_id", "created_at"]


class VisitedRestaurantSerializer(serializers.ModelSerializer):
    restaurant = RestaurantSerializer(read_only=True)
    restaurant_id = serializers.PrimaryKeyRelatedField(
        source="restaurant",
        queryset=Restaurant.objects.all(),
        write_only=True,
    )

    class Meta:
        model = VisitedRestaurant
        fields = [
            "id",
            "restaurant",
            "restaurant_id",
            "rating",
            "visit_date",
            "note",
            "created_at",
            "updated_at",
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")

        return value
