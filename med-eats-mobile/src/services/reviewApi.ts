import { API_BASE_URL } from "@/src/config/api";
import { Review } from "@/src/models/domain";
import { apiRequest } from "@/src/services/httpClient";

type ReviewApiItem = {
  id: number | string;
  username: string;
  restaurant_name?: string;
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
    restaurantName: item.restaurant_name,
    username: item.username,
    avatar: (() => {
      const raw = item.avatar || "";
      if (!raw) return "";
      if (/^https?:\/\//i.test(raw)) return raw;
      // relative path -> prefix API_BASE_URL
      return raw.startsWith("/") ? `${API_BASE_URL}${raw}` : `${API_BASE_URL}/${raw}`;
    })(),
    rating: Number(item.rating) || 0,
    comment: item.comment,
    date: item.created_at?.slice(0, 10) || "",
    isOwner: item.is_owner ?? false,
  };
}

export async function fetchReviewsByRestaurantId(
  restaurantId: string
): Promise<Review[]> {
  const payload = await apiRequest<ReviewApiItem[]>(
    `/api/v1/reviews/?restaurant=${encodeURIComponent(restaurantId)}`
  );
  return payload.map((item) => mapReview(item, restaurantId));
}

export async function createReview(
  accessToken: string,
  input: { restaurantId: string; rating: number; comment: string }
): Promise<Review> {
  const payload = await apiRequest<ReviewApiItem>("/api/v1/reviews/", {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      restaurant_id: Number(input.restaurantId),
      rating: input.rating,
      comment: input.comment,
    }),
  });
  return mapReview(payload, input.restaurantId);
}

export async function updateReview(
  accessToken: string,
  reviewId: string,
  input: { rating: number; comment: string }
): Promise<Review> {
  const payload = await apiRequest<ReviewApiItem>(`/api/v1/reviews/${reviewId}/`, {
    method: "PATCH",
    accessToken,
    body: JSON.stringify({
      rating: input.rating,
      comment: input.comment,
    }),
  });
  return mapReview(payload, "");
}

export async function deleteReview(
  accessToken: string,
  reviewId: string
): Promise<void> {
  await apiRequest<void>(`/api/v1/reviews/${reviewId}/`, {
    method: "DELETE",
    accessToken,
  });
}
