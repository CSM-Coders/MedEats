from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Avg, Count, Exists, OuterRef
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.generic import TemplateView
from django.contrib.admin.views.decorators import staff_member_required
from datetime import datetime, timedelta
from rest_framework import generics, status
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import (
    AllowAny,
    IsAdminUser,
    IsAuthenticated,
    IsAuthenticatedOrReadOnly,
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from accounts.views import can_view_profile
from config.pagination import PostCursorPagination
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
# [P1-6] Helpers de querysets con annotate() para eliminar N+1
# ============================================================

def get_annotated_restaurant_queryset():
    """Queryset de restaurantes con rating y conteo calculados en SQL."""
    return (
        Restaurant.objects.annotate(
            average_rating_db=Avg("reviews__rating"),
            reviews_count_db=Count("reviews", distinct=True),
        )
        .select_related("category", "owner")
        .prefetch_related("branches")
    )


def get_annotated_post_queryset(user=None):
    """Queryset de posts con likes, comments e is_liked calculados en SQL."""
    qs = Post.objects.select_related(
        "user", "user__profile", "restaurant", "restaurant__category"
    ).prefetch_related("likes", "comments")

    if user and user.is_authenticated:
        qs = qs.annotate(
            likes_count_db=Count("likes", distinct=True),
            comments_count_db=Count("comments", distinct=True),
            is_liked_db=Exists(
                PostLike.objects.filter(post=OuterRef("pk"), user=user)
            ),
        )
    else:
        qs = qs.annotate(
            likes_count_db=Count("likes", distinct=True),
            comments_count_db=Count("comments", distinct=True),
        )
    return qs


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
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # [P1-6] Usa queryset anotado para evitar N+1 en rating y reviews_count
        queryset = get_annotated_restaurant_queryset()

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
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # [P1-9] Categorías creadas por seed_categories — no get_or_create en request
        return Category.objects.all().order_by("name")

    # [P1-8] Cache 1 hora — las categorías cambian muy raramente
    @method_decorator(cache_page(60 * 60))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class RestaurantDetailAPIView(generics.RetrieveAPIView):
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # [P1-6] Usa queryset anotado
        return get_annotated_restaurant_queryset()


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
    permission_classes = [
        IsAuthenticated,
        IsRestaurantAccount,
        IsRestaurantOwnerOrAdmin,
    ]

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
                {
                    "detail": "No tienes permisos para ver las sedes de este restaurante."
                },
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

        # [P1-3] Las coordenadas provisionales las maneja el serializer.validate()
        branch = serializer.save(restaurant=restaurant)
        return Response(
            RestaurantBranchSerializer(branch).data,
            status=status.HTTP_201_CREATED,
        )


class OwnerRestaurantBranchDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RestaurantBranchSerializer
    permission_classes = [
        IsAuthenticated,
        IsRestaurantAccount,
        IsRestaurantOwnerOrAdmin,
    ]
    queryset = RestaurantBranch.objects.select_related(
        "restaurant", "restaurant__owner"
    )


class OwnerRestaurantMenuUploadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsRestaurantAccount]

    def patch(self, request, restaurant_id):
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        if not request.user.is_staff and restaurant.owner_id != request.user.id:
            return Response(
                {
                    "detail": "No tienes permisos para editar el menú de este restaurante."
                },
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
        queryset = Review.objects.select_related(
            "user", "restaurant", "user__profile"
        ).filter(restaurant__owner=self.request.user)

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
    GET: Lista todos los posts del feed social (paginado con cursor).
    POST: Crea un nuevo post (requiere autenticación).
    Soporta filtrado por username con query parameter ?username=algo.
    """

    permission_classes = [IsAuthenticated]
    # [P1-7] Paginación cursor-based — el frontend debe usar ?cursor= para paginar
    pagination_class = PostCursorPagination

    def get_queryset(self):
        # [P1-6] Usa queryset anotado para evitar N+1
        queryset = get_annotated_post_queryset(self.request.user)

        username = self.request.query_params.get("username", None)
        if username:
            target_user = get_object_or_404(User, username__iexact=username)
            if not can_view_profile(self.request.user, target_user):
                raise PermissionDenied("This profile is private.")
            queryset = queryset.filter(user=target_user)
        else:
            # Feed general: excluir posts de perfiles privados que no sigue
            if self.request.user.is_authenticated:
                from accounts.models import Follow
                from django.db.models import Q

                following_ids = Follow.objects.filter(
                    follower=self.request.user
                ).values_list("following_id", flat=True)
                queryset = queryset.filter(
                    Q(user__profile__is_public=True)
                    | Q(user=self.request.user)
                    | Q(user_id__in=following_ids)
                )

        return queryset

    def get_serializer_class(self):
        """Usa diferente serializer para reads vs writes"""
        if self.request.method == "POST":
            return PostCreateSerializer
        return PostSerializer

    def perform_create(self, serializer):
        # [P1-10] Procesar imagen: redimensionar a 1080x1080 y convertir a WebP
        from .image_utils import process_image, MAX_POST_IMAGE_SIZE

        image = self.request.FILES.get("image")
        if image:
            processed = process_image(image, MAX_POST_IMAGE_SIZE, prefix="post")
            serializer.save(user=self.request.user, image=processed)
        else:
            serializer.save(user=self.request.user)


class AnalyticsOverviewAPIView(APIView):
    """
    Endpoint que devuelve métricas agregadas de la plataforma.
    Protegido: solo `is_staff` / admins pueden acceder.
    Query params: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD). Si faltan, usa últimos 7 días.
    """

    authentication_classes = [SessionAuthentication, JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Parsear fechas
        from_param = request.query_params.get("from")
        to_param = request.query_params.get("to")

        try:
            if to_param:
                to_date = datetime.strptime(to_param, "%Y-%m-%d").date()
            else:
                to_date = timezone.localdate()

            if from_param:
                from_date = datetime.strptime(from_param, "%Y-%m-%d").date()
            else:
                from_date = to_date - timedelta(days=6)
        except ValueError:
            return Response(
                {"detail": "Formato de fecha inválido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # [P1-8] Cache de 5 minutos para analytics
        cache_key = f"analytics:{from_date}:{to_date}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # Conteos generales
        total_users = User.objects.count()
        new_users = User.objects.filter(
            date_joined__date__gte=from_date, date_joined__date__lte=to_date
        ).count()

        total_restaurants = Restaurant.objects.count()
        new_restaurants = Restaurant.objects.filter(
            created_at__date__gte=from_date, created_at__date__lte=to_date
        ).count()

        total_posts = Post.objects.count()
        new_posts = Post.objects.filter(
            created_at__date__gte=from_date, created_at__date__lte=to_date
        ).count()

        total_reviews = Review.objects.count()
        new_reviews = Review.objects.filter(
            created_at__date__gte=from_date, created_at__date__lte=to_date
        ).count()

        total_likes = PostLike.objects.count()
        total_comments = PostComment.objects.count()

        # Campos opcionales si los modelos existen (migraciones previas)
        try:
            from .models import ContentReport

            content_reports = ContentReport.objects.filter(
                created_at__date__gte=from_date, created_at__date__lte=to_date
            ).count()
        except Exception:
            content_reports = 0

        try:
            from .models import PostModeration

            posts_removed = PostModeration.objects.filter(
                action="deleted",
                created_at__date__gte=from_date,
                created_at__date__lte=to_date,
            ).count()
        except Exception:
            posts_removed = 0

        payload = {
            "from": from_date.isoformat(),
            "to": to_date.isoformat(),
            "total_users": total_users,
            "new_users": new_users,
            "total_restaurants": total_restaurants,
            "new_restaurants": new_restaurants,
            "total_posts": total_posts,
            "new_posts": new_posts,
            "total_reviews": total_reviews,
            "new_reviews": new_reviews,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "content_reports": content_reports,
            "posts_removed": posts_removed,
        }

        cache.set(cache_key, payload, timeout=300)
        return Response(payload, status=status.HTTP_200_OK)


@method_decorator(staff_member_required, name="dispatch")
class AnalyticsDashboardView(TemplateView):
    """Simple admin dashboard page that loads analytics data and renders charts."""

    template_name = "restaurants/analytics_dashboard.html"


class PostDetailAPIView(generics.RetrieveDestroyAPIView):
    """
    GET: Obtiene los detalles de un solo post.
    DELETE: Elimina un post (solo el propietario puede hacerlo).
    """

    permission_classes = [IsAuthenticated]
    queryset = Post.objects.select_related("user", "restaurant").prefetch_related(
        "likes", "comments"
    )
    serializer_class = PostSerializer

    def delete(self, request, *args, **kwargs):
        """
        Permite eliminar un post solo si el usuario autenticado es el propietario.
        """
        post = self.get_object()
        if post.user != request.user:
            return Response(
                {"detail": "No tienes permiso para eliminar este post."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().delete(request, *args, **kwargs)


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
            if not can_view_profile(request.user, target_user):
                return Response(
                    {"detail": "This profile is private."},
                    status=status.HTTP_403_FORBIDDEN,
                )
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
            if not can_view_profile(request.user, target_user):
                return Response(
                    {"detail": "This profile is private."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            target_user = request.user

        visited_restaurants = (
            VisitedRestaurant.objects.select_related(
                "restaurant", "restaurant__category"
            )
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
