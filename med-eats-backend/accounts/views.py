from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Follow, UserProfile, FollowRequest
from .serializers import (
    PublicProfileSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
    UserSummarySerializer,
)

User = get_user_model()


def can_view_profile(request_user, target_user):
    if request_user.is_authenticated and request_user == target_user:
        return True

    profile = getattr(target_user, "profile", None)
    if not profile or profile.is_public:
        return True

    if not request_user.is_authenticated:
        return False

    return Follow.objects.filter(
        follower=request_user,
        following=target_user,
    ).exists()


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

        profile, _ = UserProfile.objects.get_or_create(user=target_user)

        # If already following, return profile
        is_following = Follow.objects.filter(
            follower=request.user,
            following=target_user,
        ).exists()
        if is_following:
            serializer = PublicProfileSerializer(profile, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # If target user has a private profile, create a FollowRequest instead of a direct Follow.
        # Only user accounts can be private (restaurant profiles are always public).
        if not profile.is_public and profile.account_type == UserProfile.ACCOUNT_TYPE_USER:
            follow_req, created = FollowRequest.objects.get_or_create(
                requester=request.user,
                target=target_user,
                defaults={"status": FollowRequest.STATUS_PENDING}
            )
            if not created and follow_req.status == FollowRequest.STATUS_REJECTED:
                follow_req.status = FollowRequest.STATUS_PENDING
                follow_req.save()

            serializer = PublicProfileSerializer(profile, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        # If public account, follow directly
        _, created = Follow.objects.get_or_create(
            follower=request.user,
            following=target_user,
        )

        serializer = PublicProfileSerializer(profile, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, username):
        target_user = get_object_or_404(User, username__iexact=username)
        
        # Delete follow relationship
        Follow.objects.filter(follower=request.user, following=target_user).delete()
        
        # Also delete any pending follow request
        FollowRequest.objects.filter(requester=request.user, target=target_user).delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class FollowersListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        target_user = get_object_or_404(User, username__iexact=username)
        if not can_view_profile(request.user, target_user):
            raise PermissionDenied("This profile is private.")

        followers = (
            User.objects.filter(following_relationships__following=target_user)
            .select_related("profile")
            .order_by("username")
        )
        serializer = UserSummarySerializer(
            followers,
            many=True,
            context={"request": request},
        )
        return Response({"count": len(serializer.data), "results": serializer.data})


class FollowingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        target_user = get_object_or_404(User, username__iexact=username)
        if not can_view_profile(request.user, target_user):
            raise PermissionDenied("This profile is private.")

        following = (
            User.objects.filter(follower_relationships__follower=target_user)
            .select_related("profile")
            .order_by("username")
        )
        serializer = UserSummarySerializer(
            following,
            many=True,
            context={"request": request},
        )
        return Response({"count": len(serializer.data), "results": serializer.data})


class UserSearchAPIView(APIView):
    """
    Search for users by username or name.
    Query parameter: ?search=<query>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("search", "").strip()

        if not query:
            return Response([], status=status.HTTP_200_OK)

        users = User.objects.filter(
            Q(username__icontains=query) | Q(profile__display_name__icontains=query)
        ).select_related("profile").distinct()[:50]

        serializer = UserSummarySerializer(
            users,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


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


class FollowRequestListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # List all pending follow requests received
        requests = FollowRequest.objects.filter(target=request.user, status="pending").select_related("requester", "requester__profile")
        data = []
        for req in requests:
            req_profile = getattr(req.requester, "profile", None)
            avatar_url = ""
            if req_profile and req_profile.avatar_image:
                avatar_url = request.build_absolute_uri(req_profile.avatar_image.url)
            elif req_profile:
                avatar_url = req_profile.avatar_url

            data.append({
                "id": req.id,
                "requester_id": req.requester.id,
                "username": req.requester.username,
                "name": req_profile.display_name if req_profile and req_profile.display_name else req.requester.username,
                "avatar_url": avatar_url,
                "created_at": req.created_at,
            })
        return Response(data, status=status.HTTP_200_OK)


class ApproveFollowRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        follow_req = get_object_or_404(FollowRequest, id=request_id, target=request.user)
        
        # Create follow relationship
        Follow.objects.get_or_create(
            follower=follow_req.requester,
            following=request.user,
        )
        
        # Delete follow request
        follow_req.delete()
        
        return Response({"detail": "Follow request accepted."}, status=status.HTTP_200_OK)


class RejectFollowRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        follow_req = get_object_or_404(FollowRequest, id=request_id, target=request.user)
        
        # Delete follow request
        follow_req.delete()
        
        return Response({"detail": "Follow request rejected."}, status=status.HTTP_200_OK)
