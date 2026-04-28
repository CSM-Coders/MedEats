from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Restaurant, Category
from .serializers import RestaurantSerializer, CategorySerializer
from rest_framework.permissions import AllowAny
from .ai_service import (
    FoodieOutOfScopeError,
    get_foodie_recommendation,
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
                float(user_latitude) if user_latitude is not None and user_latitude != "" else None
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
