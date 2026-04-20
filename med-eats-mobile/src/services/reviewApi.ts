import { API_BASE_URL } from "@/src/config/api";
import { Review } from "@/src/models/domain";

type ReviewApiItem = {
  id: number | string;
  restaurant: number | string;
  username: string;
  avatar: string;
  rating: string | number;
  comment: string;
  date: string;
};

function mapReview(item: ReviewApiItem): Review {
  return {
    id: String(item.id),
    restaurantId: String(item.restaurant),
    username: item.username,
    avatar: item.avatar,
    rating: Number(item.rating) || 0,
    comment: item.comment,
    date: item.date,
  };
}

export async function fetchReviewsByRestaurantId(
  restaurantId: string
): Promise<Review[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews/?restaurant=${encodeURIComponent(restaurantId)}`
  );

  if (!response.ok) {
    throw new Error("Unable to load reviews");
  }

  const payload = (await response.json()) as ReviewApiItem[];
  return payload.map(mapReview);
}
