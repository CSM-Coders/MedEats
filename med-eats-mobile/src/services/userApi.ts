import { API_BASE_URL } from "@/src/config/api";
import { AppUser } from "@/src/models/domain";
import { apiRequest, ApiError } from "@/src/services/httpClient";

type ApiProfile = {
  user_id: string | number;
  username: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  follow_status?: "following" | "requested" | "none";
  is_public?: boolean;
  posts_count?: number;
  saved_count?: number;
  visited_count?: number;
};

function mapProfile(item: ApiProfile): AppUser & { isFollowing: boolean } {
  let avatarUrl = item.avatar_url;
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    avatarUrl = avatarUrl.startsWith("/") ? `${API_BASE_URL}${avatarUrl}` : `${API_BASE_URL}/${avatarUrl}`;
  }

  return {
    id: String(item.user_id),
    username: item.username,
    name: item.name || item.username,
    avatarUrl,
    bio: item.bio ?? "",
    location: item.location ?? "",
    followers: Number(item.followers_count) || 0,
    following: Number(item.following_count) || 0,
    posts: Number(item.posts_count) || 0,
    savedCount: Number(item.saved_count) || 0,
    visitedCount: Number(item.visited_count) || 0,
    isFollowing: item.is_following ?? false,
    followStatus: item.follow_status ?? (item.is_following ? "following" : "none"),
    isPublic: item.is_public ?? true,
  };
}

export async function fetchUserProfileByUsername(
  accessToken: string,
  username: string
): Promise<AppUser & { isFollowing: boolean }> {
  // Mantener compatibilidad: callers que dependen de `statusCode` reciben el
  // ApiError con su `status` y mensaje original.
  const payload = await apiRequest<ApiProfile>(
    `/api/v1/auth/profile/${username}/`,
    { accessToken }
  );
  return mapProfile(payload);
}

export async function searchUsersWithAuth(
  query: string,
  accessToken: string
): Promise<(AppUser & { isFollowing: boolean })[]> {
  try {
    const payload = await apiRequest<ApiProfile[]>(
      `/api/v1/auth/search/?search=${encodeURIComponent(query)}`,
      { accessToken }
    );
    return payload.map(mapProfile);
  } catch (err) {
    if (!(err instanceof ApiError)) console.error("User search error:", err);
    return [];
  }
}

export async function followUser(accessToken: string, username: string): Promise<void> {
  await apiRequest<void>(`/api/v1/auth/profile/${username}/follow/`, {
    method: "POST",
    accessToken,
  });
}

export async function unfollowUser(accessToken: string, username: string): Promise<void> {
  await apiRequest<void>(`/api/v1/auth/profile/${username}/follow/`, {
    method: "DELETE",
    accessToken,
  });
}

export type FollowRequestRecord = {
  id: number;
  requester_id: number;
  username: string;
  name: string;
  avatar_url: string;
  created_at: string;
};

export async function fetchFollowRequests(accessToken: string): Promise<FollowRequestRecord[]> {
  const data = await apiRequest<FollowRequestRecord[]>("/api/v1/auth/requests/", {
    accessToken,
  });

  return data.map((item) => {
    let avatarUrl = item.avatar_url;
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
      avatarUrl = avatarUrl.startsWith("/") ? `${API_BASE_URL}${avatarUrl}` : `${API_BASE_URL}/${avatarUrl}`;
    }
    return {
      ...item,
      avatar_url: avatarUrl,
    };
  });
}

export async function acceptFollowRequest(accessToken: string, requestId: number): Promise<void> {
  await apiRequest<void>(`/api/v1/auth/requests/${requestId}/accept/`, {
    method: "POST",
    accessToken,
  });
}

export async function rejectFollowRequest(accessToken: string, requestId: number): Promise<void> {
  await apiRequest<void>(`/api/v1/auth/requests/${requestId}/reject/`, {
    method: "POST",
    accessToken,
  });
}
