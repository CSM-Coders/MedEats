from django.contrib import admin

from .models import Follow, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "account_type", "display_name", "location", "updated_at")
    list_filter = ("account_type",)
    search_fields = ("user__username", "display_name", "location")


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("follower", "following", "created_at")
    search_fields = ("follower__username", "following__username")
