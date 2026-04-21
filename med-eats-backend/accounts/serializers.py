from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import UserProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_username(self, value):
        normalized = value.strip()
        if User.objects.filter(username__iexact=normalized).exists():
            raise serializers.ValidationError("Username is already taken.")
        return normalized

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Email is already registered.")
        return normalized

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        UserProfile.objects.get_or_create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avatar_url = serializers.CharField(source="profile.avatar_url", read_only=True)
    bio = serializers.CharField(source="profile.bio", read_only=True)
    location = serializers.CharField(source="profile.location", read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "avatar_url",
            "bio",
            "location",
            "followers_count",
            "following_count",
        ]

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        if full_name:
            return full_name

        profile = getattr(obj, "profile", None)
        if profile and profile.display_name:
            return profile.display_name

        return obj.username

    def get_followers_count(self, obj):
        return obj.follower_relationships.count()

    def get_following_count(self, obj):
        return obj.following_relationships.count()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["display_name", "avatar_url", "bio", "location"]


class PublicProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    name = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "user_id",
            "username",
            "name",
            "display_name",
            "avatar_url",
            "bio",
            "location",
            "followers_count",
            "following_count",
            "is_following",
            "posts_count",
        ]

    def get_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        if full_name:
            return full_name
        if obj.display_name:
            return obj.display_name
        return obj.user.username

    def get_posts_count(self, obj):
        return obj.user.posts.count()

    def get_followers_count(self, obj):
        return obj.user.follower_relationships.count()

    def get_following_count(self, obj):
        return obj.user.following_relationships.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        return obj.user.follower_relationships.filter(follower=request.user).exists()


class UserSummarySerializer(serializers.ModelSerializer):
    avatar_url = serializers.CharField(source="profile.avatar_url", read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "name", "avatar_url"]

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        if full_name:
            return full_name

        profile = getattr(obj, "profile", None)
        if profile and profile.display_name:
            return profile.display_name

        return obj.username
