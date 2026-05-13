from django.db.models import Avg
from rest_framework import serializers
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from .models import (
    Category,
    Post,
    PostComment,
    Restaurant,
    RestaurantBranch,
    Review,
    SavedRestaurant,
    VisitedRestaurant,
)
from .utils import geocoder

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
    owner_id = serializers.CharField(source="owner.id", read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    branches = serializers.SerializerMethodField()
    menu_pdf_url = serializers.SerializerMethodField()
    reviews_count = serializers.IntegerField(source="reviews.count", read_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        # '__all__' es un atajo que le dice a Django: "Convierte a JSON
        # absolutamente todo lo que esté en la tabla de este restaurante
        # (latitud, longitud, imagen, whatsapp, etc.)".
        fields = "__all__"

    def get_branches(self, obj):
        branches = obj.branches.all().order_by("-is_primary", "address")
        return RestaurantBranchSerializer(branches, many=True).data

    def get_menu_pdf_url(self, obj):
        if not obj.menu_pdf:
            return ""

        request = self.context.get("request")
        raw_val = str(obj.menu_pdf)

        if raw_val.startswith("http"):
            return raw_val

        if request and hasattr(obj.menu_pdf, "url"):
            try:
                return request.build_absolute_uri(obj.menu_pdf.url)
            except ValueError:
                return raw_val

        return raw_val

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg=Avg("rating"))["avg"]
        return round(float(avg), 1) if avg is not None else None


class RestaurantBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantBranch
        fields = [
            "id",
            "restaurant",
            "address",
            "latitude",
            "longitude",
            "is_primary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["restaurant", "created_at", "updated_at"]

    def validate(self, attrs):
        address = attrs.get("address", "").strip()
        if not address:
            raise serializers.ValidationError({"address": "Address is required."})
        
        # Priorizar coordenadas enviadas, sino usar geocodificador
        lat = attrs.get("latitude")
        lon = attrs.get("longitude")
        
        if not lat or not lon:
            lat_geo, lon_geo = geocoder.geocode(address)
            attrs["latitude"] = lat or lat_geo
            attrs["longitude"] = lon or lon_geo
        
        return attrs


class RestaurantOwnerWriteSerializer(serializers.ModelSerializer):
    image_file = serializers.ImageField(write_only=True, required=False, allow_null=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "category",
            "category_id",
            "image",
            "image_file",
            "latitude",
            "longitude",
            "location",
            "description",
            "whatsapp",
            "menu_pdf",
            "rating",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_menu_pdf(self, value):
        if not value:
            return value

        filename = getattr(value, "name", "") or ""
        if not filename.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are allowed for menu upload.")

        return value

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Solo validar location si se está enviando (no en partial updates como PDF)
        if "location" in attrs:
            location = attrs.get("location", "").strip()
            if not location:
                raise serializers.ValidationError({"location": "Address is required."})
        elif self.instance is None:
            raise serializers.ValidationError({"location": "Address is required."})

        if self.instance is None and user and user.is_authenticated:
            already_owned = Restaurant.objects.filter(owner=user).exists()
            if already_owned:
                raise serializers.ValidationError(
                    {
                        "detail": (
                            "Esta cuenta ya tiene un restaurante asociado. "
                            "Debes editar el existente, no crear otro."
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        image_file = validated_data.pop("image_file", None)
        category_id = validated_data.pop("category_id", None)
        
        if image_file:
            validated_data["image"] = image_file
        
        # Asignar categoría por ID o por defecto
        if category_id:
            validated_data["category_id"] = category_id
        elif not validated_data.get("category"):
            default_cat = Category.objects.filter(name__icontains="burger").first()
            if not default_cat:
                default_cat = Category.objects.first()
            if default_cat:
                validated_data["category"] = default_cat
        
        # Si el móvil no envió coordenadas, usar fallback del servidor
        if not validated_data.get("latitude") or not validated_data.get("longitude"):
            location = validated_data.get("location", "")
            lat, lon = geocoder.geocode(location)
            validated_data["latitude"] = lat
            validated_data["longitude"] = lon
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image_file = validated_data.pop("image_file", None)
        category_id = validated_data.pop("category_id", None)
        
        if image_file:
            instance.image = image_file
        
        if category_id:
            instance.category_id = category_id
        
        # Si el móvil no envió coordenadas nuevas, geocodificar como fallback
        new_lat = validated_data.get("latitude")
        new_lon = validated_data.get("longitude")
        new_location = validated_data.get("location", instance.location)
        
        if not new_lat and not new_lon and new_location != instance.location:
            lat, lon = geocoder.geocode(new_location)
            validated_data["latitude"] = lat
            validated_data["longitude"] = lon
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        instance.refresh_from_db()
        return instance


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)
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
            "restaurant_name",
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

        # Prefer uploaded image file URL when available, otherwise fallback to stored avatar_url
        if getattr(profile, "avatar_image", None):
            request = self.context.get("request")
            try:
                return request.build_absolute_uri(profile.avatar_image.url) if request else profile.avatar_image.url
            except Exception:
                return str(profile.avatar_image)

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

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        restaurant = attrs.get("restaurant")

        if (
            self.instance is None
            and user
            and user.is_authenticated
            and restaurant
            and Review.objects.filter(user=user, restaurant=restaurant).exists()
        ):
            raise serializers.ValidationError(
                {"detail": "You have already reviewed this restaurant."}
            )

        return attrs


class PostCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = PostComment
        fields = ["id", "username", "user_avatar", "content", "created_at"]
        read_only_fields = ["created_at"]

    def get_user_avatar(self, obj):
        profile = getattr(obj.user, "profile", None)
        if not profile:
            return ""
        return profile.avatar_url


class PostSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    user_avatar = serializers.SerializerMethodField()
    restaurant_id = serializers.CharField(source="restaurant.id", read_only=True)
    restaurant_name = serializers.CharField(source="restaurant.name", read_only=True)
    likes_count = serializers.IntegerField(source="likes.count", read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)
    is_liked = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

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

    def get_image(self, obj):
        if not obj.image:
            return ""
        
        raw_val = str(obj.image)
        if raw_val.startswith("http"):
            return raw_val
            
        request = self.context.get("request")
        if request and hasattr(obj.image, "url"):
            try:
                return request.build_absolute_uri(obj.image.url)
            except ValueError:
                return raw_val

        return raw_val

    def get_is_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        return obj.likes.filter(user=request.user).exists()

    def get_user_avatar(self, obj):
        profile = getattr(obj.user, "profile", None)
        if not profile:
            return ""

        # Prefer uploaded image file URL when available, otherwise fallback to stored avatar_url
        if getattr(profile, "avatar_image", None):
            request = self.context.get("request")
            try:
                return request.build_absolute_uri(profile.avatar_image.url) if request else profile.avatar_image.url
            except Exception:
                return str(profile.avatar_image)

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
