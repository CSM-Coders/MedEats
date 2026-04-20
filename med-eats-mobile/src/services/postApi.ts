import { API_BASE_URL } from "@/src/config/api";
import { Post } from "@/src/models/domain";

type PostApiItem = {
  id: number | string;
  user_id: number | string;
  username: string;
  user_avatar?: string;
  restaurant_id: number | string;
  restaurant_name: string;
  image: string;
  rating: number;
  caption: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
};

function mapPost(item: PostApiItem): Post {
  return {
    id: String(item.id),
    userId: String(item.user_id),
    username: item.username,
    userAvatar:
      item.user_avatar ||
      "https://images.unsplash.com/photo-1614436201459-156d322d38c6?w=200",
    restaurantId: String(item.restaurant_id),
    restaurantName: item.restaurant_name,
    image: item.image,
    rating: Number(item.rating) || 0,
    caption: item.caption,
    likes: Number(item.likes_count) || 0,
    comments: Number(item.comments_count) || 0,
    date: item.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    isLiked: Boolean(item.is_liked),
  };
}

function getAuthHeaders(accessToken: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function fetchPosts(accessToken: string): Promise<Post[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/posts/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load posts");
  }

  const payload = (await response.json()) as PostApiItem[];
  return payload.map(mapPost);
}

export async function createPostApi(
  accessToken: string,
  input: { restaurantId: string; rating: number; caption: string; image: string }
): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/api/v1/posts/`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      restaurant_id: Number(input.restaurantId),
      rating: input.rating,
      caption: input.caption,
      image: input.image,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to create post");
  }

  const payload = (await response.json()) as PostApiItem;
  return mapPost(payload);
}

export async function likePost(accessToken: string, postId: string): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/like/`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Unable to like post");
  }

  const payload = (await response.json()) as PostApiItem;
  return mapPost(payload);
}

export async function unlikePost(accessToken: string, postId: string): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/like/`, {
    method: "DELETE",
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Unable to unlike post");
  }

  const payload = (await response.json()) as PostApiItem;
  return mapPost(payload);
}
