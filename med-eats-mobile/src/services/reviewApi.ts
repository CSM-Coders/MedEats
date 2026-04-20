import { API_BASE_URL } from "@/src/config/api";
import { Review } from "@/src/models/domain";

type ReviewApiItem = {
  id: number | string;
  username: string;
  avatar: string;
  rating: string | number;
  comment: string;
  created_at: string;
  is_owner?: boolean;
};

function mapReview(item: ReviewApiItem, restaurantId: string): Review {
  return {
    id: String(item.id),
    restaurantId: restaurantId,
    username: item.username,
    avatar: item.avatar,
    rating: Number(item.rating) || 0,
    comment: item.comment,
    date: item.created_at?.slice(0, 10) || "",
    isOwner: item.is_owner ?? false,
  };
}

export async function fetchReviewsByRestaurantId(
  restaurantId: string
): Promise<Review[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/reviews/?restaurant=${encodeURIComponent(restaurantId)}`
  );

  if (!response.ok) {
    throw new Error("Unable to load reviews");
  }

  const payload = (await response.json()) as ReviewApiItem[];
  return payload.map((item) => mapReview(item, restaurantId));
}

export async function createReview(
  accessToken: string,
  input: { restaurantId: string; rating: number; comment: string }
): Promise<Review> {
  const response = await fetch(`${API_BASE_URL}/api/v1/reviews/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      restaurant_id: Number(input.restaurantId),
      rating: input.rating,
      comment: input.comment,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to create review");
  }

  const payload = (await response.json()) as ReviewApiItem;
  return mapReview(payload, input.restaurantId);
}

export async function updateReview(
  accessToken: string,
  reviewId: string,
  input: { rating: number; comment: string }
): Promise<Review> {
  const response = await fetch(`${API_BASE_URL}/api/v1/reviews/${reviewId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      rating: input.rating,
      comment: input.comment,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to update review");
  }

  const payload = (await response.json()) as ReviewApiItem;
  return mapReview(payload, ""); // restaurantId not strictly needed for UI sync here
}

export async function deleteReview(
  accessToken: string,
  reviewId: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/reviews/${reviewId}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to delete review");
  }
}
