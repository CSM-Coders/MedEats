from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
	Category,
	Post,
	PostComment,
	PostLike,
	Restaurant,
	Review,
	SavedRestaurant,
	VisitedRestaurant,
)

User = get_user_model()


class ReviewApiTests(APITestCase):
	def setUp(self):
		self.owner = User.objects.create_user(
			username="review_owner",
			email="owner@example.com",
			password="OwnerPass123!",
		)
		self.other_user = User.objects.create_user(
			username="review_other",
			email="other@example.com",
			password="OtherPass123!",
		)

		self.category = Category.objects.create(name="Test Category")
		self.restaurant = Restaurant.objects.create(
			name="Test Restaurant",
			category=self.category,
			rating=4.5,
			image="https://example.com/image.jpg",
			latitude=6.24,
			longitude=-75.58,
			location="Medellín",
			description="Restaurant for tests",
			menu_highlights=["Dish 1"],
			whatsapp="+573001112233",
		)

		self.review = Review.objects.create(
			restaurant=self.restaurant,
			user=self.owner,
			rating=5,
			comment="Excellent",
		)

	def test_public_can_list_reviews(self):
		response = self.client.get(f"/api/v1/reviews/?restaurant={self.restaurant.id}")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)

	def test_unauthenticated_cannot_create_review(self):
		payload = {
			"restaurant_id": self.restaurant.id,
			"rating": 4,
			"comment": "Great place",
		}
		response = self.client.post("/api/v1/reviews/", payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_authenticated_user_can_create_review(self):
		self.client.force_authenticate(user=self.other_user)
		payload = {
			"restaurant_id": self.restaurant.id,
			"rating": 4,
			"comment": "Great place",
		}
		response = self.client.post("/api/v1/reviews/", payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data["username"], self.other_user.username)

	def test_user_cannot_create_duplicate_review_for_same_restaurant(self):
		self.client.force_authenticate(user=self.owner)
		payload = {
			"restaurant_id": self.restaurant.id,
			"rating": 4,
			"comment": "Second review attempt",
		}
		response = self.client.post("/api/v1/reviews/", payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_owner_can_update_review(self):
		self.client.force_authenticate(user=self.owner)

		response = self.client.patch(
			f"/api/v1/reviews/{self.review.id}/",
			{"rating": 3, "comment": "Updated"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["comment"], "Updated")

	def test_non_owner_cannot_update_review(self):
		self.client.force_authenticate(user=self.other_user)

		response = self.client.patch(
			f"/api/v1/reviews/{self.review.id}/",
			{"rating": 2, "comment": "Not allowed"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_owner_can_delete_review(self):
		self.client.force_authenticate(user=self.owner)

		response = self.client.delete(f"/api/v1/reviews/{self.review.id}/")

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(Review.objects.filter(id=self.review.id).exists())

	def test_non_owner_cannot_delete_review(self):
		self.client.force_authenticate(user=self.other_user)

		response = self.client.delete(f"/api/v1/reviews/{self.review.id}/")

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class FeedAndCollectionsApiTests(APITestCase):
	def setUp(self):
		self.owner = User.objects.create_user(
			username="owner_feed",
			email="owner_feed@example.com",
			password="OwnerPass123!",
		)
		self.followed = User.objects.create_user(
			username="followed_feed",
			email="followed_feed@example.com",
			password="FollowedPass123!",
		)
		self.not_followed = User.objects.create_user(
			username="not_followed_feed",
			email="not_followed_feed@example.com",
			password="NotFollowedPass123!",
		)

		self.category = Category.objects.create(name="Feed Category")
		self.restaurant = Restaurant.objects.create(
			name="Feed Restaurant",
			category=self.category,
			rating=4.7,
			image="https://example.com/feed.jpg",
			latitude=6.24,
			longitude=-75.58,
			location="Medellín",
			description="Feed restaurant",
			menu_highlights=["Dish 1"],
			whatsapp="+573001234567",
		)

	def _dummy_upload(self, filename="post.jpg"):
		return SimpleUploadedFile(filename, b"test-binary-data", content_type="image/jpeg")

	def test_posts_endpoint_requires_auth(self):
		response = self.client.get("/api/v1/posts/")
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_authenticated_user_can_create_post(self):
		self.client.force_authenticate(user=self.owner)
		payload = {
			"restaurant_id": self.restaurant.id,
			"rating": 5,
			"caption": "Great food",
			"image": self._dummy_upload(),
		}
		response = self.client.post("/api/v1/posts/", payload, format="multipart")

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(Post.objects.count(), 1)
		self.assertEqual(Post.objects.first().user, self.owner)

	def test_feed_returns_global_posts_when_user_follows_nobody(self):
		Post.objects.create(
			user=self.followed,
			restaurant=self.restaurant,
			image=self._dummy_upload("followed.jpg"),
			rating=5,
			caption="From followed",
		)
		Post.objects.create(
			user=self.not_followed,
			restaurant=self.restaurant,
			image=self._dummy_upload("not_followed.jpg"),
			rating=4,
			caption="From not followed",
		)

		self.client.force_authenticate(user=self.owner)
		response = self.client.get("/api/v1/posts/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertGreaterEqual(len(response.data), 2)

	def test_feed_returns_only_self_and_followed_when_following_exists(self):
		from accounts.models import Follow

		Follow.objects.create(follower=self.owner, following=self.followed)

		own_post = Post.objects.create(
			user=self.owner,
			restaurant=self.restaurant,
			image=self._dummy_upload("own.jpg"),
			rating=5,
			caption="My post",
		)
		followed_post = Post.objects.create(
			user=self.followed,
			restaurant=self.restaurant,
			image=self._dummy_upload("followed2.jpg"),
			rating=4,
			caption="Followed post",
		)
		Post.objects.create(
			user=self.not_followed,
			restaurant=self.restaurant,
			image=self._dummy_upload("notfollowed2.jpg"),
			rating=3,
			caption="Not followed post",
		)

		self.client.force_authenticate(user=self.owner)
		response = self.client.get("/api/v1/posts/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		response_ids = {str(item["id"]) for item in response.data}
		self.assertIn(str(own_post.id), response_ids)
		self.assertIn(str(followed_post.id), response_ids)
		self.assertEqual(len(response_ids), 2)

	def test_like_and_unlike_post(self):
		post = Post.objects.create(
			user=self.followed,
			restaurant=self.restaurant,
			image=self._dummy_upload("like.jpg"),
			rating=5,
			caption="Like me",
		)

		self.client.force_authenticate(user=self.owner)
		like_response = self.client.post(f"/api/v1/posts/{post.id}/like/")
		self.assertEqual(like_response.status_code, status.HTTP_200_OK)
		self.assertTrue(PostLike.objects.filter(post=post, user=self.owner).exists())

		unlike_response = self.client.delete(f"/api/v1/posts/{post.id}/like/")
		self.assertEqual(unlike_response.status_code, status.HTTP_200_OK)
		self.assertFalse(PostLike.objects.filter(post=post, user=self.owner).exists())

	def test_comment_create_and_list(self):
		post = Post.objects.create(
			user=self.followed,
			restaurant=self.restaurant,
			image=self._dummy_upload("comment.jpg"),
			rating=5,
			caption="Comment me",
		)

		self.client.force_authenticate(user=self.owner)
		create_response = self.client.post(
			f"/api/v1/posts/{post.id}/comments/",
			{"content": "Nice place"},
			format="json",
		)
		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(PostComment.objects.filter(post=post, user=self.owner).exists())

		list_response = self.client.get(f"/api/v1/posts/{post.id}/comments/")
		self.assertEqual(list_response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(list_response.data), 1)

	def test_save_restaurant_is_idempotent(self):
		self.client.force_authenticate(user=self.owner)

		first = self.client.post(
			"/api/v1/user/restaurants/saved/",
			{"restaurant_id": self.restaurant.id},
			format="json",
		)
		second = self.client.post(
			"/api/v1/user/restaurants/saved/",
			{"restaurant_id": self.restaurant.id},
			format="json",
		)

		self.assertEqual(first.status_code, status.HTTP_201_CREATED)
		self.assertEqual(second.status_code, status.HTTP_201_CREATED)
		self.assertEqual(
			SavedRestaurant.objects.filter(user=self.owner, restaurant=self.restaurant).count(),
			1,
		)

	def test_mark_visited_upserts_single_record(self):
		self.client.force_authenticate(user=self.owner)

		first = self.client.post(
			"/api/v1/user/restaurants/visited/",
			{"restaurant_id": self.restaurant.id, "rating": 4, "note": "First"},
			format="json",
		)
		second = self.client.post(
			"/api/v1/user/restaurants/visited/",
			{"restaurant_id": self.restaurant.id, "rating": 5, "note": "Updated"},
			format="json",
		)

		self.assertEqual(first.status_code, status.HTTP_201_CREATED)
		self.assertEqual(second.status_code, status.HTTP_201_CREATED)

		record = VisitedRestaurant.objects.get(user=self.owner, restaurant=self.restaurant)
		self.assertEqual(record.rating, 5)
		self.assertEqual(record.note, "Updated")
