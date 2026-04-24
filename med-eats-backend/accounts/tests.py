from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Follow, UserProfile

User = get_user_model()


class AccountsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="owner_user",
            email="owner@example.com",
            password="OwnerPass123!",
        )
        self.other_user = User.objects.create_user(
            username="target_user",
            email="target@example.com",
            password="TargetPass123!",
        )

    def test_register_creates_user_and_profile(self):
        payload = {
            "username": "new_user",
            "email": "new_user@example.com",
            "password": "StrongPass123",
        }
        response = self.client.post("/api/v1/auth/register/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        created_user = User.objects.get(username="new_user")
        self.assertTrue(UserProfile.objects.filter(user=created_user).exists())

    def test_login_with_invalid_credentials_returns_401(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": self.user.username, "password": "wrong"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)

    def test_follow_and_unfollow_flow(self):
        self.client.force_authenticate(user=self.user)

        follow_response = self.client.post(f"/api/v1/auth/profile/{self.other_user.username}/follow/")
        self.assertIn(
            follow_response.status_code,
            (status.HTTP_200_OK, status.HTTP_201_CREATED),
        )
        self.assertTrue(
            Follow.objects.filter(follower=self.user, following=self.other_user).exists()
        )

        unfollow_response = self.client.delete(
            f"/api/v1/auth/profile/{self.other_user.username}/follow/"
        )
        self.assertEqual(unfollow_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Follow.objects.filter(follower=self.user, following=self.other_user).exists()
        )

    def test_user_cannot_follow_self(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/v1/auth/profile/{self.user.username}/follow/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
