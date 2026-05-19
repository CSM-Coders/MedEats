from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import UserProfile, FollowRequest

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    account_type = serializers.ChoiceField(
        choices=UserProfile.ACCOUNT_TYPE_CHOICES,
        required=False,
        default=UserProfile.ACCOUNT_TYPE_USER,
    )

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
        account_type = validated_data.pop("account_type", UserProfile.ACCOUNT_TYPE_USER)
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        profile, _ = UserProfile.objects.get_or_create(user=user)
        if profile.account_type != account_type:
            profile.account_type = account_type
            profile.save(update_fields=["account_type", "updated_at"])
        return user


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    account_type = serializers.CharField(source="profile.account_type", read_only=True)
    is_restaurant_account = serializers.SerializerMethodField()
    avatar_url = serializers.CharField(source="profile.avatar_url", read_only=True)
    gender = serializers.CharField(source="profile.gender", read_only=True)
    is_public = serializers.BooleanField(source="profile.is_public", read_only=True)
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
            "account_type",
            "is_restaurant_account",
            "avatar_url",
            "gender",
            "is_public",
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

    def get_is_restaurant_account(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile:
            return False

        return profile.account_type == UserProfile.ACCOUNT_TYPE_RESTAURANT

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = getattr(instance, "profile", None)
        if profile and profile.avatar_image:
            request = self.context.get("request")
            data["avatar_url"] = (
                request.build_absolute_uri(profile.avatar_image.url)
                if request
                else profile.avatar_image.url
            )
        return data


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False, allow_blank=False)
    avatar_file = serializers.ImageField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "display_name",
            "avatar_url",
            "avatar_file",
            "gender",
            "is_public",
            "bio",
            "location",
        ]

    def validate_username(self, value):
        normalized = value.strip()
        user = self.instance.user if self.instance else None
        query = User.objects.filter(username__iexact=normalized)
        if user:
            query = query.exclude(id=user.id)
        if query.exists():
            raise serializers.ValidationError("Username is already taken.")
        return normalized

    def validate_avatar_file(self, value):
        if not value:
            return value
        if (
            not getattr(value, "name", "")
            .lower()
            .endswith((".jpg", ".jpeg", ".png", ".webp"))
        ):
            raise serializers.ValidationError(
                "Only JPG, PNG or WEBP images are allowed."
            )
        return value

    def update(self, instance, validated_data):
        user = instance.user
        username = validated_data.pop("username", None)
        avatar_file = validated_data.pop("avatar_file", None)

        if username:
            user.username = username
            user.save(update_fields=["username"])

        if avatar_file:
            if instance.avatar_image:
                try:
                    default_storage.delete(instance.avatar_image.name)
                except Exception:
                    pass
            instance.avatar_image = avatar_file
            instance.avatar_url = ""

        if "display_name" in validated_data:
            instance.display_name = validated_data["display_name"]
        if "gender" in validated_data:
            instance.gender = validated_data["gender"]
        if "is_public" in validated_data:
            instance.is_public = validated_data["is_public"]
        if "bio" in validated_data:
            instance.bio = validated_data["bio"]
        if "location" in validated_data:
            instance.location = validated_data["location"]
        if "avatar_url" in validated_data:
            instance.avatar_url = validated_data["avatar_url"]

        instance.save()
        return instance

    def to_representation(self, instance):
        return PublicProfileSerializer(instance, context=self.context).data


class PublicProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.CharField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    name = serializers.SerializerMethodField()
    account_type = serializers.CharField(read_only=True)
    is_restaurant_account = serializers.SerializerMethodField()
    gender = serializers.CharField(read_only=True)
    is_public = serializers.BooleanField(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    follow_status = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    saved_count = serializers.SerializerMethodField()
    visited_count = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "user_id",
            "username",
            "name",
            "account_type",
            "is_restaurant_account",
            "gender",
            "is_public",
            "display_name",
            "avatar_url",
            "bio",
            "location",
            "followers_count",
            "following_count",
            "is_following",
            "follow_status",
            "posts_count",
            "saved_count",
            "visited_count",
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

    def get_saved_count(self, obj):
        return obj.user.saved_restaurants.count()

    def get_visited_count(self, obj):
        return obj.user.visited_restaurants.count()

    def get_followers_count(self, obj):
        return obj.user.follower_relationships.count()

    def get_following_count(self, obj):
        return obj.user.following_relationships.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        return obj.user.follower_relationships.filter(follower=request.user).exists()

    def get_follow_status(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return "none"
        if obj.user.follower_relationships.filter(follower=request.user).exists():
            return "following"
        if FollowRequest.objects.filter(
            requester=request.user, target=obj.user, status="pending"
        ).exists():
            return "requested"
        return "none"

    def get_is_restaurant_account(self, obj):
        return obj.account_type == UserProfile.ACCOUNT_TYPE_RESTAURANT

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar_image:
            request = self.context.get("request")
            if request:
                data["avatar_url"] = request.build_absolute_uri(
                    instance.avatar_image.url
                )
            else:
                data["avatar_url"] = instance.avatar_image.url
        return data


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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = getattr(instance, "profile", None)
        if profile and profile.avatar_image:
            request = self.context.get("request")
            data["avatar_url"] = (
                request.build_absolute_uri(profile.avatar_image.url)
                if request
                else profile.avatar_image.url
            )
        return data
