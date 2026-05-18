from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserSearchAPIView,
    FollowersListAPIView,
    FollowingListAPIView,
    FollowUserAPIView,
    LoginAPIView,
    LogoutAPIView,
    MeAPIView,
    MyProfileAPIView,
    RegisterAPIView,
    UserProfileDetailAPIView,
    FollowRequestListAPIView,
    ApproveFollowRequestAPIView,
    RejectFollowRequestAPIView,
)

urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("me/", MeAPIView.as_view(), name="me"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
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
    path("search/", UserSearchAPIView.as_view(), name="user-search"),
    path("requests/", FollowRequestListAPIView.as_view(), name="follow-requests-list"),
    path("requests/<int:request_id>/accept/", ApproveFollowRequestAPIView.as_view(), name="follow-request-accept"),
    path("requests/<int:request_id>/reject/", RejectFollowRequestAPIView.as_view(), name="follow-request-reject"),
]
