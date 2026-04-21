import { API_BASE_URL } from "@/src/config/api";
import { Post, PostComment } from "@/src/models/domain";

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
  const formData = new FormData();
  formData.append("restaurant_id", input.restaurantId);
  formData.append("rating", String(input.rating));
  formData.append("caption", input.caption);

  // Check if it's a local file URI (from image picker) or a web URL
  if (input.image.startsWith("file://") || input.image.startsWith("content://")) {
    const filename = input.image.split("/").pop() || "upload.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append("image", {
      uri: input.image,
      name: filename,
      type,
    } as any);
  } else {
    // Fallback if it's somehow just a string URL
    formData.append("image", input.image);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/posts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Fetch will automatically add the multipart boundary header
    },
    body: formData,
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

export async function fetchPostComments(
  accessToken: string,
  postId: string
): Promise<PostComment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/comments/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load comments");
  }

  const payload = (await response.json()) as any[];
  return payload.map((item) => ({
    id: String(item.id),
    username: item.username,
    userAvatar: item.user_avatar || "https://ui-avatars.com/api/?name=" + item.username,
    content: item.content,
    date: item.created_at?.slice(0, 10) || "",
  }));
}

export async function addCommentApi(
  accessToken: string,
  postId: string,
  content: string
): Promise<PostComment> {
  const response = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}/comments/`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("Unable to add comment");
  }

  const item = await response.json();
  return {
    id: String(item.id),
    username: item.username,
    userAvatar: item.user_avatar || "https://ui-avatars.com/api/?name=" + item.username,
    content: item.content,
    date: item.created_at?.slice(0, 10) || "",
  };
}
