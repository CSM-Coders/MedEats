from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Follow, UserProfile
from .serializers import (
    PublicProfileSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
    UserSummarySerializer,
)

User = get_user_model()


def build_auth_response(user):
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        },
        status=status.HTTP_200_OK,
    )


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            Q(username__iexact=username) | Q(email__iexact=username)
        ).first()
        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = authenticate(request=request, username=user.username, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return build_auth_response(user)


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        return Response(UserSerializer(request.user).data)


class MyProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = PublicProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileUpdateSerializer(
            profile, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            PublicProfileSerializer(profile, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class UserProfileDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        target_user = get_object_or_404(
            User.objects.select_related("profile"), username__iexact=username
        )
        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        serializer = PublicProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)


class FollowUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        target_user = get_object_or_404(User, username__iexact=username)

        if target_user == request.user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _, created = Follow.objects.get_or_create(
            follower=request.user,
            following=target_user,
        )

        profile, _ = UserProfile.objects.get_or_create(user=target_user)
        serializer = PublicProfileSerializer(profile, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, username):
        target_user = get_object_or_404(User, username__iexact=username)
        Follow.objects.filter(follower=request.user, following=target_user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowersListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        target_user = get_object_or_404(User, username__iexact=username)
        followers = (
            User.objects.filter(following_relationships__following=target_user)
            .select_related("profile")
            .order_by("username")
        )
        serializer = UserSummarySerializer(followers, many=True)
        return Response({"count": len(serializer.data), "results": serializer.data})


class FollowingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        target_user = get_object_or_404(User, username__iexact=username)
        following = (
            User.objects.filter(follower_relationships__follower=target_user)
            .select_related("profile")
            .order_by("username")
        )
        serializer = UserSummarySerializer(following, many=True)
        return Response({"count": len(serializer.data), "results": serializer.data})


class LogoutAPIView(APIView):
    """
    Invalida el refresh token del usuario añadiéndolo a la lista negra.
    Esto asegura un cierre de sesión seguro a nivel de servidor.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out."}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
