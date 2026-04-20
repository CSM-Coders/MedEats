from rest_framework import generics
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Category,
    Post,
    PostLike,
    Restaurant,
    Review,
    SavedRestaurant,
    VisitedRestaurant,
)
from .serializers import (
    CategorySerializer,
    PostCreateSerializer,
    PostSerializer,
    RestaurantSerializer,
    ReviewSerializer,
    SavedRestaurantSerializer,
    VisitedRestaurantSerializer,
)

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
    queryset = Restaurant.objects.all()

    # 2. Indicamos cómo debemos traducir esa información bruta a JSON
    # para tu frontend:
    serializer_class = RestaurantSerializer

    # Permiso de seguridad: En nuestro MVP permitimos que cualquier
    # persona que abra la app (sin haber hecho Log In) pueda ver los restaurantes en el mapa.
    permission_classes = [AllowAny]


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

    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [AllowAny]


class ReviewListAPIView(generics.ListAPIView):
    """
    Devuelve las reseñas de un restaurante específico.
    Se filtra por query param: ?restaurant=<id>
    """

    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Review.objects.select_related("restaurant").order_by("-date", "-id")
        restaurant_id = self.request.query_params.get("restaurant")

        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        return queryset


class PostListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        base_queryset = Post.objects.select_related(
            "user", "restaurant", "user__profile"
        ).prefetch_related("likes", "comments")

        following_ids = list(
            self.request.user.following_relationships.values_list("following_id", flat=True)
        )

        # Si el usuario todavía no sigue a nadie, devolvemos feed global como recomendaciones.
        if not following_ids:
            return base_queryset

        return base_queryset.filter(Q(user=self.request.user) | Q(user_id__in=following_ids))

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PostCreateSerializer

        return PostSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(user=request.user)

        output = PostSerializer(post, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = PostSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)


class PostLikeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = generics.get_object_or_404(Post, id=post_id)
        PostLike.objects.get_or_create(post=post, user=request.user)
        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, post_id):
        post = generics.get_object_or_404(Post, id=post_id)
        PostLike.objects.filter(post=post, user=request.user).delete()
        serializer = PostSerializer(post, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SavedRestaurantListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SavedRestaurantSerializer

    def get_queryset(self):
        return SavedRestaurant.objects.select_related("restaurant", "restaurant__category").filter(
            user=self.request.user
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_restaurant, _ = SavedRestaurant.objects.get_or_create(
            user=request.user,
            restaurant=serializer.validated_data["restaurant"],
        )
        output = SavedRestaurantSerializer(saved_restaurant)
        return Response(output.data, status=status.HTTP_201_CREATED)


class SavedRestaurantDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, restaurant_id):
        saved = SavedRestaurant.objects.filter(
            user=request.user,
            restaurant_id=restaurant_id,
        ).select_related("restaurant", "restaurant__category").first()

        if not saved:
            return Response({"is_saved": False}, status=status.HTTP_200_OK)

        payload = SavedRestaurantSerializer(saved).data
        payload["is_saved"] = True
        return Response(payload, status=status.HTTP_200_OK)

    def delete(self, request, restaurant_id):
        SavedRestaurant.objects.filter(user=request.user, restaurant_id=restaurant_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VisitedRestaurantListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VisitedRestaurantSerializer

    def get_queryset(self):
        return VisitedRestaurant.objects.select_related(
            "restaurant", "restaurant__category"
        ).filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        visited, _ = VisitedRestaurant.objects.update_or_create(
            user=request.user,
            restaurant=serializer.validated_data["restaurant"],
            defaults={
                "rating": serializer.validated_data["rating"],
                "visit_date": serializer.validated_data.get("visit_date"),
                "note": serializer.validated_data.get("note", ""),
            },
        )
        output = VisitedRestaurantSerializer(visited)
        return Response(output.data, status=status.HTTP_201_CREATED)


class VisitedRestaurantDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, restaurant_id):
        VisitedRestaurant.objects.filter(user=request.user, restaurant_id=restaurant_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
