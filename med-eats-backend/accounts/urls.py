from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    FollowersListAPIView,
    FollowingListAPIView,
    FollowUserAPIView,
    LoginAPIView,
    MeAPIView,
    MyProfileAPIView,
    RegisterAPIView,
    UserProfileDetailAPIView,
)

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", MeAPIView.as_view(), name="me"),
    path("profile/me/", MyProfileAPIView.as_view(), name="my-profile"),
    path("profile/<str:username>/", UserProfileDetailAPIView.as_view(), name="profile-detail"),
    path("profile/<str:username>/follow/", FollowUserAPIView.as_view(), name="profile-follow"),
    path(
        "profile/<str:username>/followers/",
        FollowersListAPIView.as_view(),
        name="profile-followers",
    ),
    path(
        "profile/<str:username>/following/",
        FollowingListAPIView.as_view(),
        name="profile-following",
    ),
]
