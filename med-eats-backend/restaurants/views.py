from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import (
    AllowAny,
    IsAdminUser,
    IsAuthenticated,
    IsAuthenticatedOrReadOnly,
)
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import (
    Restaurant,
    RestaurantBranch,
    Category,
    Post,
    PostLike,
    PostComment,
    Review,
    SavedRestaurant,
    VisitedRestaurant,
)
from .serializers import (
    RestaurantSerializer,
    RestaurantOwnerWriteSerializer,
    RestaurantBranchSerializer,
    CategorySerializer,
    PostSerializer,
    PostCreateSerializer,
    PostCommentSerializer,
    ReviewSerializer,
    SavedRestaurantSerializer,
    VisitedRestaurantSerializer,
)
from .ai_service import (
    FoodieOutOfScopeError,
    get_foodie_recommendation,
)
from .permissions import (
    IsOwnerOrReadOnly,
    IsRestaurantAccount,
    IsRestaurantOwnerOrAdmin,
)

User = get_user_model()

# ============================================================
# VISTAS DE LA API (Endponits REST)
# ------------------------------------------------------------
# ¿Qué es una "Vista" (View)?
# Es el "cerebro" donde ocurre la lógica cuando el celular (React Native)
# busca una dirección específica de internet (URL).
#
# En este caso usamos "generics.ListAPIView", una función ultra-optimizada
# de Django diseñada exclusivamente para un fin: "Sacar una lista de la base
# de datos y enviarla hacia el Serializador sin la necesidad de escribir
# bucles repetitivos (for) manualmente".
# ============================================================


class RestaurantListAPIView(generics.ListAPIView):
    """
    Ruta web que devuelve tu lista completa de restaurantes.
    Simulará exactamente lo que hace tu archivo mockData.ts (const restaurants).
    """

    # 1. Indicamos qué datos queremos consultar del PostgreSQL:
    # "Selecciona ABSOLUTAMENTE TODOS los objetos guardados en la tabla Restaurant"
    serializer_class = RestaurantSerializer

    # Permiso de seguridad: En nuestro MVP permitimos que cualquier
    # persona que abra la app (sin haber hecho Log In) pueda ver los restaurantes en el mapa.
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Restaurant.objects.select_related("category", "owner").prefetch_related(
            "branches",
            "reviews",
        )

        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(name__icontains=search)

        category = self.request.query_params.get("category", "").strip()
        if category:
            queryset = queryset.filter(category__name__icontains=category)

        owner = self.request.query_params.get("owner", "").strip()
        if owner:
            queryset = queryset.filter(owner__username__iexact=owner)

        return queryset.order_by("name")


class CategoryListAPIView(generics.ListAPIView):
    """
    Ruta adicional para ver todas las categorías de comida que existen.
    (Ayudará muchísimo para crear los filtros automáticos en tu HomeScreen).
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class RestaurantDetailAPIView(generics.RetrieveAPIView):
    """
    Ruta para ver los detalles de un solo restaurante usando su ID.
    Permitirá que la App móvil consulte y muestre los datos reales en su pantalla RestaurantDetailScreen.
    """

    queryset = Restaurant.objects.select_related("category", "owner").prefetch_related(
        "branches",
        "reviews",
    )
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]


class AdminRestaurantListCreateAPIView(generics.ListCreateAPIView):
    """
    CRUD administrativo de restaurantes.
    Solo staff/admin puede gestionar toda la data.
    """

    permission_classes = [IsAdminUser]
    serializer_class = RestaurantOwnerWriteSerializer
    queryset = Restaurant.objects.select_related("category", "owner").prefetch_related(
        "branches",
        "reviews",
    )


class AdminRestaurantDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = RestaurantOwnerWriteSerializer
    queryset = Restaurant.objects.select_related("category", "owner").prefetch_related(
        "branches",
        "reviews",
    )


class OwnerRestaurantListCreateAPIView(generics.ListCreateAPIView):
    """
    Gestión de restaurantes del dueño (cuenta restaurante).
    """

    permission_classes = [IsAuthenticated, IsRestaurantAccount]

    def get_queryset(self):
        return (
            Restaurant.objects.select_related("category", "owner")
            .prefetch_related("branches", "reviews")
            .filter(owner=self.request.user)
            .order_by("name")
        )

    def get_serializer_class(self):
        if self.request.method == "GET":
            return RestaurantSerializer
        return RestaurantOwnerWriteSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class OwnerRestaurantDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsRestaurantAccount, IsRestaurantOwnerOrAdmin]

    def get_queryset(self):
        return Restaurant.objects.select_related("category", "owner").prefetch_related(
            "branches",
            "reviews",
        )

    def get_serializer_class(self):
        if self.request.method == "GET":
            return RestaurantSerializer
        return RestaurantOwnerWriteSerializer


class OwnerRestaurantBranchListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurantAccount]

    def get_restaurant(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        if not request.user.is_staff and restaurant.owner_id != request.user.id:
            return None
        return restaurant

    def get(self, request, restaurant_id):
        restaurant = self.get_restaurant(request, restaurant_id)
        if not restaurant:
            return Response(
                {"detail": "No tienes permisos para ver las sedes de este restaurante."},
                status=status.HTTP_403_FORBIDDEN,
            )

        branches = restaurant.branches.all().order_by("-is_primary", "address")
        return Response(RestaurantBranchSerializer(branches, many=True).data)

    def post(self, request, restaurant_id):
        restaurant = self.get_restaurant(request, restaurant_id)
        if not restaurant:
            return Response(
                {"detail": "No tienes permisos para crear sedes en este restaurante."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RestaurantBranchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Priorizar coordenadas del móvil, sino usar geocodificador
        lat = request.data.get("latitude")
        lon = request.data.get("longitude")
        
        if not lat or not lon:
            address = request.data.get("address", "").strip()
            from .utils import geocoder
            lat_geo, lon_geo = geocoder.geocode(address)
            lat = lat or lat_geo
            lon = lon or lon_geo
        
        branch = serializer.save(restaurant=restaurant, latitude=lat, longitude=lon)
        return Response(
            RestaurantBranchSerializer(branch).data,
            status=status.HTTP_201_CREATED,
        )


class OwnerRestaurantBranchDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RestaurantBranchSerializer
    permission_classes = [IsAuthenticated, IsRestaurantAccount, IsRestaurantOwnerOrAdmin]
    queryset = RestaurantBranch.objects.select_related("restaurant", "restaurant__owner")


class OwnerRestaurantMenuUploadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurantAccount]

    def patch(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        if not request.user.is_staff and restaurant.owner_id != request.user.id:
            return Response(
                {"detail": "No tienes permisos para editar el menú de este restaurante."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Usar request.FILES para asegurar que el PDF se reciba correctamente
        pdf_file = request.FILES.get("menu_pdf") or request.data.get("menu_pdf")
        
        serializer = RestaurantOwnerWriteSerializer(
            restaurant,
            data={"menu_pdf": pdf_file},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            RestaurantSerializer(restaurant, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class OwnerRestaurantReviewsAPIView(generics.ListAPIView):
    """
    Dashboard de reseñas para cuentas restaurante.
    """

    permission_classes = [IsAuthenticated, IsRestaurantAccount]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        queryset = Review.objects.select_related("user", "restaurant", "user__profile").filter(
            restaurant__owner=self.request.user
        )

        restaurant_id = self.request.query_params.get("restaurant")
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        return queryset.order_by("-created_at", "-id")


class FoodieAssistantAPIView(APIView):
    """
    Endpoint tipo chat para recomendar un restaurante usando IA.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        message = str(request.data.get("message", "")).strip()
        if not message:
            return Response(
                {"detail": "El campo 'message' es obligatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = Restaurant.objects.select_related("category").all()
        restaurants = list(
            queryset.values(
                "id",
                "name",
                "description",
                "location",
                "latitude",
                "longitude",
                "category__name",
            )
        )

        for item in restaurants:
            item["category"] = item.pop("category__name")

        user_latitude = request.data.get("latitude")
        user_longitude = request.data.get("longitude")
        excluded_restaurant_id = request.data.get("excluded_restaurant_id")

        try:
            user_latitude = (
                float(user_latitude)
                if user_latitude is not None and user_latitude != ""
                else None
            )
            user_longitude = (
                float(user_longitude)
                if user_longitude is not None and user_longitude != ""
                else None
            )
        except (TypeError, ValueError):
            user_latitude = None
            user_longitude = None

        try:
            excluded_restaurant_id = (
                int(excluded_restaurant_id)
                if excluded_restaurant_id is not None and excluded_restaurant_id != ""
                else None
            )
        except (TypeError, ValueError):
            excluded_restaurant_id = None

        try:
            result = get_foodie_recommendation(
                user_message=message,
                restaurants=restaurants,
                user_latitude=user_latitude,
                user_longitude=user_longitude,
                excluded_restaurant_id=excluded_restaurant_id,
            )
        except FoodieOutOfScopeError as exc:
            return Response(
                {
                    "detail": str(exc),
                    "source": "guard",
                },
                status=status.HTTP_200_OK,
            )
        restaurant = queryset.filter(id=result.restaurant_id).first()

        if not restaurant:
            return Response(
                {"detail": "No se encontró restaurante recomendado."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "restaurant": RestaurantSerializer(restaurant).data,
                "explanation": result.explanation,
                "source": result.source,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# VISTAS PARA POSTS (Feed Social)
# ============================================================


class PostListCreateAPIView(generics.ListCreateAPIView):
    """
    GET: Lista todos los posts del feed social.
    POST: Crea un nuevo post (requiere autenticación).
    Soporta filtrado por username con query parameter ?username=algo.
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = (
            Post.objects.select_related("user", "restaurant")
            .prefetch_related("likes", "comments")
            .all()
        )

        # Filtro opcional por username del usuario que creó el post
        username = self.request.query_params.get("username", None)
        if username:
            queryset = queryset.filter(user__username=username)

        return queryset

    def get_serializer_class(self):
        """Usa diferente serializer para reads vs writes"""
        if self.request.method == "POST":
            return PostCreateSerializer
        return PostSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PostDetailAPIView(generics.RetrieveAPIView):
    """
    GET: Obtiene los detalles de un solo post.
    """

    permission_classes = [IsAuthenticated]
    queryset = Post.objects.select_related("user", "restaurant").prefetch_related(
        "likes", "comments"
    )
    serializer_class = PostSerializer


class PostCommentListCreateAPIView(generics.ListCreateAPIView):
    """
    GET: Lista todos los comentarios de un post específico.
    POST: Crea un nuevo comentario en el post (requiere autenticación).
    """

    serializer_class = PostCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs.get("post_id")
        return PostComment.objects.filter(post_id=post_id).select_related("user")

    def perform_create(self, serializer):
        post_id = self.kwargs.get("post_id")
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            raise status.HTTP_404_NOT_FOUND

        serializer.save(user=self.request.user, post=post)


class PostLikeAPIView(APIView):
    """
    POST: Dale un like a un post (requiere autenticación).
    DELETE: Quita el like del post.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        """Agregar un like al post"""
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response(
                {"detail": "Post no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Crear el like si no existe, o recuperarlo si ya existe
        like, created = PostLike.objects.get_or_create(post=post, user=request.user)

        # Retornar los datos del post actualizado
        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, post_id):
        """Eliminar un like del post"""
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            return Response(
                {"detail": "Post no encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Eliminar el like si existe
        try:
            like = PostLike.objects.get(post=post, user=request.user)
            like.delete()
        except PostLike.DoesNotExist:
            pass  # Ya no tiene like, nada que eliminar

        # Retornar los datos del post actualizado
        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================================================
# VISTAS PARA RESEÑAS DE RESTAURANTES
# ============================================================


class ReviewListCreateAPIView(generics.ListCreateAPIView):
    """
    GET: Lista reseñas. Soporta filtro opcional por restaurante (?restaurant=ID).
    POST: Crea una nueva reseña autenticada.
    """

    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Review.objects.select_related("user", "restaurant", "user__profile")

        restaurant_id = self.request.query_params.get("restaurant")
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        return queryset.order_by("-created_at", "-id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReviewDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PATCH/DELETE de una reseña individual.
    """

    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    queryset = Review.objects.select_related("user", "restaurant", "user__profile")


# ============================================================
# VISTAS PARA RESTAURANTES GUARDADOS Y VISITADOS
# ============================================================


class SavedRestaurantListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.query_params.get("username")
        if username:
            target_user = get_object_or_404(User, username__iexact=username)
        else:
            target_user = request.user

        saved_restaurants = (
            SavedRestaurant.objects.select_related("restaurant", "restaurant__category")
            .filter(user=target_user)
            .order_by("-created_at", "-id")
        )
        serializer = SavedRestaurantSerializer(saved_restaurants, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SavedRestaurantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        restaurant = serializer.validated_data["restaurant"]
        saved_restaurant, _ = SavedRestaurant.objects.get_or_create(
            user=request.user,
            restaurant=restaurant,
        )

        return Response(
            SavedRestaurantSerializer(saved_restaurant).data,
            status=status.HTTP_201_CREATED,
        )


class SavedRestaurantDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, restaurant_id):
        is_saved = SavedRestaurant.objects.filter(
            user=request.user,
            restaurant_id=restaurant_id,
        ).exists()
        return Response({"is_saved": is_saved}, status=status.HTTP_200_OK)

    def delete(self, request, restaurant_id):
        SavedRestaurant.objects.filter(
            user=request.user,
            restaurant_id=restaurant_id,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VisitedRestaurantListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.query_params.get("username")
        if username:
            target_user = get_object_or_404(User, username__iexact=username)
        else:
            target_user = request.user

        visited_restaurants = (
            VisitedRestaurant.objects.select_related("restaurant", "restaurant__category")
            .filter(user=target_user)
            .order_by("-visit_date", "-updated_at", "-id")
        )
        serializer = VisitedRestaurantSerializer(visited_restaurants, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = VisitedRestaurantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        restaurant = serializer.validated_data["restaurant"]
        rating = serializer.validated_data["rating"]
        note = serializer.validated_data.get("note", "")
        visit_date = serializer.validated_data.get("visit_date") or timezone.localdate()

        visited_restaurant, _ = VisitedRestaurant.objects.update_or_create(
            user=request.user,
            restaurant=restaurant,
            defaults={
                "rating": rating,
                "note": note,
                "visit_date": visit_date,
            },
        )

        return Response(
            VisitedRestaurantSerializer(visited_restaurant).data,
            status=status.HTTP_201_CREATED,
        )
