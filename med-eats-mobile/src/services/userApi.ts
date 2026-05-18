import { API_BASE_URL } from "@/src/config/api";
import { AppUser } from "@/src/models/domain";

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
  posts_count?: number;
  saved_count?: number;
  visited_count?: number;
};

function mapProfile(item: ApiProfile): AppUser & { isFollowing: boolean } {
  return {
    id: String(item.user_id),
    username: item.username,
    name: item.name || item.username,
    avatarUrl: item.avatar_url,
    bio: item.bio ?? "",
    location: item.location ?? "",
    followers: Number(item.followers_count) || 0,
    following: Number(item.following_count) || 0,
    posts: Number(item.posts_count) || 0,
    savedCount: Number(item.saved_count) || 0,
    visitedCount: Number(item.visited_count) || 0,
    isFollowing: item.is_following ?? false,
  };
}

function createApiError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

export async function fetchUserProfileByUsername(
  accessToken: string,
  username: string
): Promise<AppUser & { isFollowing: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile/${username}/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw createApiError(
      detail || "Unable to load user profile",
      response.status
    );
  }

  const payload = (await response.json()) as ApiProfile;
  return mapProfile(payload);
}

export async function searchUsersWithAuth(
  query: string,
  accessToken: string
): Promise<(AppUser & { isFollowing: boolean })[]> {
  // Use backend search endpoint with auth token
  const url = `${API_BASE_URL}/api/v1/auth/search/?search=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      const payload = (await response.json()) as ApiProfile[];
      return payload.map(mapProfile);
    }
  } catch (err) {
    console.error("User search error:", err);
  }
  return [];
}

export async function followUser(accessToken: string, username: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile/${username}/follow/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to follow user");
  }
}

export async function unfollowUser(accessToken: string, username: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile/${username}/follow/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to unfollow user");
  }
}
