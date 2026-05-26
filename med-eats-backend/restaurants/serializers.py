from django.db.models import Avg
from rest_framework import serializers
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
    # [P1-6] SerializerMethodField para usar valores anotados y evitar N+1
    reviews_count = serializers.SerializerMethodField()
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

    def get_reviews_count(self, obj):
        return getattr(obj, "reviews_count_db", obj.reviews.count())

    def get_average_rating(self, obj):
        val = getattr(obj, "average_rating_db", None)
        if val is not None:
            return round(float(val), 1)
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

        # [P1-3] Usar coordenadas del cliente si existen; sino provisionales del
        # centro de Medellín. El dueño puede editar la sede para afinar la posición.
        attrs.setdefault("latitude", attrs.get("latitude") or 6.2442)
        attrs.setdefault("longitude", attrs.get("longitude") or -75.5812)

        return attrs


class RestaurantOwnerWriteSerializer(serializers.ModelSerializer):
    image_file = serializers.ImageField(
        write_only=True, required=False, allow_null=True
    )
    category_id = serializers.IntegerField(
        write_only=True, required=False, allow_null=True
    )

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

        # [P1-5] Validar tamaño (10 MB) y tipo real por magic bytes
        MAX_SIZE = 10 * 1024 * 1024
        if value.size > MAX_SIZE:
            raise serializers.ValidationError("El PDF no puede superar 10MB.")

        try:
            import magic  # python-magic

            header = value.read(8)
            value.seek(0)
            if not header.startswith(b"%PDF"):
                raise serializers.ValidationError("El archivo debe ser un PDF válido.")
        except ImportError:
            # Fallback si python-magic no está instalado: validar por extensión
            filename = getattr(value, "name", "") or ""
            if not filename.lower().endswith(".pdf"):
                raise serializers.ValidationError("Solo se permiten archivos PDF.")

        return value

    def validate_category_id(self, value):
        if value in (None, ""):
            return None

        if not Category.objects.filter(id=value).exists():
            raise serializers.ValidationError("La categoría seleccionada no existe.")

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
        # [P1-3] Geocodificación asíncrona — no bloquea el request HTTP
        from .tasks import geocode_restaurant_task

        image_file = validated_data.pop("image_file", None)
        category_id = validated_data.pop("category_id", None)

        if image_file:
            validated_data["image"] = image_file

        if category_id:
            validated_data["category_id"] = category_id
        elif not validated_data.get("category"):
            default_cat = Category.objects.filter(name__icontains="burger").first()
            if not default_cat:
                default_cat = Category.objects.first()
            if default_cat:
                validated_data["category"] = default_cat

        # Coordenadas provisionales del centro de Medellín — la task las actualiza
        if not validated_data.get("latitude") or not validated_data.get("longitude"):
            validated_data["latitude"] = 6.2442
            validated_data["longitude"] = -75.5812

        instance = super().create(validated_data)
        geocode_restaurant_task.delay(instance.id)
        return instance

    def update(self, instance, validated_data):
        # [P1-3] Geocodificación asíncrona solo si cambió la dirección
        from .tasks import geocode_restaurant_task

        image_file = validated_data.pop("image_file", None)
        category_id = validated_data.pop("category_id", None)

        if image_file:
            instance.image = image_file

        if category_id:
            instance.category_id = category_id

        new_location = validated_data.get("location", instance.location)
        location_changed = new_location != instance.location
        has_new_coords = validated_data.get("latitude") and validated_data.get("longitude")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if location_changed and not has_new_coords:
            geocode_restaurant_task.delay(instance.id)

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
                return (
                    request.build_absolute_uri(profile.avatar_image.url)
                    if request
                    else profile.avatar_image.url
                )
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
    # [P1-6] SerializerMethodField para usar valores anotados y evitar N+1
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
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

    def get_likes_count(self, obj):
        return getattr(obj, "likes_count_db", obj.likes.count())

    def get_comments_count(self, obj):
        return getattr(obj, "comments_count_db", obj.comments.count())

    def get_is_liked(self, obj):
        annotated = getattr(obj, "is_liked_db", None)
        if annotated is not None:
            return annotated
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
                return (
                    request.build_absolute_uri(profile.avatar_image.url)
                    if request
                    else profile.avatar_image.url
                )
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
