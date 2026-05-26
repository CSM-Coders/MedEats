import { API_BASE_URL } from "@/src/config/api";
import { Post, PostComment } from "@/src/models/domain";
import { apiRequest } from "@/src/services/httpClient";

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
  const userAvatar = item.user_avatar
    ? /^https?:\/\//i.test(item.user_avatar)
      ? item.user_avatar
      : item.user_avatar.startsWith("/")
      ? `${API_BASE_URL}${item.user_avatar}`
      : `${API_BASE_URL}/${item.user_avatar}`
    : "";

  // Normalize image: if relative path, prefix API
  let imageUrl = item.image || "";
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    imageUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    imageUrl = `${API_BASE_URL}${imageUrl}`;
  }

  return {
    id: String(item.id),
    userId: String(item.user_id),
    username: item.username,
    userAvatar,
    restaurantId: String(item.restaurant_id),
    restaurantName: item.restaurant_name,
    image: imageUrl,
    rating: Number(item.rating) || 0,
    caption: item.caption,
    likes: Number(item.likes_count) || 0,
    comments: Number(item.comments_count) || 0,
    date: item.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    isLiked: Boolean(item.is_liked),
  };
}

type PaginatedPostsResponse = {
  results: PostApiItem[];
  next: string | null;
  previous: string | null;
};

function extractCursor(nextUrl: string | null): string | null {
  if (!nextUrl) return null;
  try {
    const url = new URL(nextUrl);
    return url.searchParams.get("cursor");
  } catch {
    return null;
  }
}

// [P2-7] fetchPosts ahora devuelve posts + cursor para paginación infinita
export async function fetchPosts(
  accessToken: string,
  cursor?: string
): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const path = cursor
    ? `/api/v1/posts/?cursor=${encodeURIComponent(cursor)}`
    : `/api/v1/posts/`;

  const payload = await apiRequest<PaginatedPostsResponse>(path, { accessToken });
  return {
    posts: payload.results.map(mapPost),
    nextCursor: extractCursor(payload.next),
  };
}

export async function fetchPostById(accessToken: string, postId: string): Promise<Post> {
  const payload = await apiRequest<PostApiItem>(`/api/v1/posts/${postId}/`, {
    accessToken,
  });
  return mapPost(payload);
}

// [P2-7] fetchUserPosts también maneja respuesta paginada
export async function fetchUserPosts(accessToken: string, username: string): Promise<Post[]> {
  const payload = await apiRequest<PaginatedPostsResponse>(
    `/api/v1/posts/?username=${encodeURIComponent(username)}`,
    { accessToken }
  );
  return payload.results.map(mapPost);
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
    formData.append("image", input.image);
  }

  const payload = await apiRequest<PostApiItem>("/api/v1/posts/", {
    method: "POST",
    accessToken,
    body: formData,
  });
  return mapPost(payload);
}

export async function likePost(accessToken: string, postId: string): Promise<Post> {
  const payload = await apiRequest<PostApiItem>(`/api/v1/posts/${postId}/like/`, {
    method: "POST",
    accessToken,
  });
  return mapPost(payload);
}

export async function unlikePost(accessToken: string, postId: string): Promise<Post> {
  const payload = await apiRequest<PostApiItem>(`/api/v1/posts/${postId}/like/`, {
    method: "DELETE",
    accessToken,
  });
  return mapPost(payload);
}

export async function fetchPostComments(
  accessToken: string,
  postId: string
): Promise<PostComment[]> {
  type ApiComment = {
    id: number | string;
    username: string;
    user_avatar?: string;
    content: string;
    created_at?: string;
  };

  const payload = await apiRequest<ApiComment[]>(
    `/api/v1/posts/${postId}/comments/`,
    { accessToken }
  );
  return payload.map((item) => ({
    id: String(item.id),
    username: item.username,
    userAvatar: item.user_avatar || "",
    content: item.content,
    date: item.created_at?.slice(0, 10) || "",
  }));
}

export async function addCommentApi(
  accessToken: string,
  postId: string,
  content: string
): Promise<PostComment> {
  type ApiComment = {
    id: number | string;
    username: string;
    user_avatar?: string;
    content: string;
    created_at?: string;
  };

  const item = await apiRequest<ApiComment>(`/api/v1/posts/${postId}/comments/`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ content }),
  });
  return {
    id: String(item.id),
    username: item.username,
    userAvatar: item.user_avatar || "",
    content: item.content,
    date: item.created_at?.slice(0, 10) || "",
  };
}

export async function deletePost(accessToken: string, postId: string): Promise<void> {
  await apiRequest<void>(`/api/v1/posts/${postId}/`, {
    method: "DELETE",
    accessToken,
  });
}
