from django.conf import settings
from django.db import models
from django.db.models import Q
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    ACCOUNT_TYPE_USER = "user"
    ACCOUNT_TYPE_RESTAURANT = "restaurant"
    ACCOUNT_TYPE_CHOICES = [
        (ACCOUNT_TYPE_USER, "User"),
        (ACCOUNT_TYPE_RESTAURANT, "Restaurant"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    GENDER_MALE = "male"
    GENDER_FEMALE = "female"
    GENDER_OTHER = "other"
    GENDER_NO_SAY = "no_say"
    GENDER_CHOICES = [
        (GENDER_MALE, "Male"),
        (GENDER_FEMALE, "Female"),
        (GENDER_OTHER, "Other"),
        (GENDER_NO_SAY, "Prefer not to say"),
    ]
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default=ACCOUNT_TYPE_USER,
        db_index=True,
    )
    display_name = models.CharField(max_length=150, blank=True)
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        default=GENDER_NO_SAY,
        blank=True,
    )
    is_public = models.BooleanField(default=True)
    avatar_image = models.ImageField(upload_to="avatars/", blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name or self.user.username


class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following_relationships",
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="follower_relationships",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["follower", "following"],
                name="unique_follow_relation",
            ),
            models.CheckConstraint(
                condition=~Q(follower=models.F("following")),
                name="prevent_self_follow",
            ),
        ]

    def __str__(self):
        return f"{self.follower.username} -> {self.following.username}"


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
