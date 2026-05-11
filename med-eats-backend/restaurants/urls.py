from django.urls import path
from .views import (
    AdminRestaurantDetailAPIView,
    AdminRestaurantListCreateAPIView,
    RestaurantListAPIView,
    CategoryListAPIView,
    RestaurantDetailAPIView,
    OwnerRestaurantBranchDetailAPIView,
    OwnerRestaurantBranchListCreateAPIView,
    OwnerRestaurantDetailAPIView,
    OwnerRestaurantListCreateAPIView,
    OwnerRestaurantMenuUploadAPIView,
    OwnerRestaurantReviewsAPIView,
    FoodieAssistantAPIView,
    PostListCreateAPIView,
    PostDetailAPIView,
    PostCommentListCreateAPIView,
    PostLikeAPIView,
    ReviewListCreateAPIView,
    ReviewDetailAPIView,
    SavedRestaurantListCreateAPIView,
    SavedRestaurantDetailAPIView,
    VisitedRestaurantListCreateAPIView,
)

# ============================================================
# RUTAS DE LA APP RESTAURANTES
# ------------------------------------------------------------
# ¿Qué son las URLs?
# Es el equivalente a los "caminos" en un mapa. Conectan una dirección de internet
# específica (ejemplo /api/restaurants) con las "Vistas" que programamos en views.py.
# ============================================================

urlpatterns = [
    # Admin management endpoints (FR19, FR20)
    path(
        "admin/restaurants/",
        AdminRestaurantListCreateAPIView.as_view(),
        name="admin-restaurant-list-create",
    ),
    path(
        "admin/restaurants/<int:pk>/",
        AdminRestaurantDetailAPIView.as_view(),
        name="admin-restaurant-detail",
    ),
    # Restaurant account endpoints
    path(
        "owner/restaurants/",
        OwnerRestaurantListCreateAPIView.as_view(),
        name="owner-restaurant-list-create",
    ),
    path(
        "owner/restaurants/<int:pk>/",
        OwnerRestaurantDetailAPIView.as_view(),
        name="owner-restaurant-detail",
    ),
    path(
        "owner/restaurants/<int:restaurant_id>/branches/",
        OwnerRestaurantBranchListCreateAPIView.as_view(),
        name="owner-restaurant-branch-list-create",
    ),
    path(
        "owner/branches/<int:pk>/",
        OwnerRestaurantBranchDetailAPIView.as_view(),
        name="owner-restaurant-branch-detail",
    ),
    path(
        "owner/restaurants/<int:restaurant_id>/menu/",
        OwnerRestaurantMenuUploadAPIView.as_view(),
        name="owner-restaurant-menu-upload",
    ),
    path(
        "owner/reviews/",
        OwnerRestaurantReviewsAPIView.as_view(),
        name="owner-restaurant-reviews",
    ),
    # Si React Native hace un GET a http://localhost:8000/api/restaurants/
    # Se disparará nuestra lista completa de restaurantes convertida a JSON.
    path("restaurants/", RestaurantListAPIView.as_view(), name="restaurant-list"),
    # Si se hace a /api/categories/, enviará las categorías separadas.
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    # Vista de detalle pasándole el ID primary key (<int:pk>) en la URL base.
    path(
        "restaurants/<int:pk>/",
        RestaurantDetailAPIView.as_view(),
        name="restaurant-detail",
    ),
    path("ai/foodie-chat/", FoodieAssistantAPIView.as_view(), name="foodie-chat"),
    path("reviews/", ReviewListCreateAPIView.as_view(), name="review-list-create"),
    path("reviews/<int:pk>/", ReviewDetailAPIView.as_view(), name="review-detail"),
    path(
        "user/restaurants/saved/",
        SavedRestaurantListCreateAPIView.as_view(),
        name="saved-restaurant-list-create",
    ),
    path(
        "user/restaurants/saved/<int:restaurant_id>/",
        SavedRestaurantDetailAPIView.as_view(),
        name="saved-restaurant-detail",
    ),
    path(
        "user/restaurants/visited/",
        VisitedRestaurantListCreateAPIView.as_view(),
        name="visited-restaurant-list-create",
    ),
    # Posts endpoints - Feed Social
    path("posts/", PostListCreateAPIView.as_view(), name="post-list-create"),
    path("posts/<int:pk>/", PostDetailAPIView.as_view(), name="post-detail"),
    path(
        "posts/<int:post_id>/comments/",
        PostCommentListCreateAPIView.as_view(),
        name="post-comment-list-create",
    ),
    path("posts/<int:post_id>/like/", PostLikeAPIView.as_view(), name="post-like"),
]
