import { API_BASE_URL } from "@/src/config/api";
import {
  Restaurant,
  RestaurantBranch,
  RestaurantWriteInput,
  Review,
} from "@/src/models/domain";

type RestaurantBranchApiItem = {
  id: number | string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
};

type RestaurantApiItem = {
  id: number | string;
  name: string;
  category: string | null;
  rating: string | number | null;
  image: string | null;
  latitude: number;
  longitude: number;
  location: string;
  description: string;
  whatsapp?: string;
  owner_id?: number | string;
  owner_username?: string;
  menu_pdf_url?: string;
  reviews_count?: number;
  average_rating?: number | string | null;
  branches?: RestaurantBranchApiItem[];
};

type ReviewApiItem = {
  id: number | string;
  restaurant_name?: string;
  username: string;
  avatar: string;
  rating: string | number;
  comment: string;
  created_at: string;
  is_owner?: boolean;
};

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function mapBranch(item: RestaurantBranchApiItem): RestaurantBranch {
  return {
    id: String(item.id),
    name: item.name,
    address: item.address,
    latitude: item.latitude,
    longitude: item.longitude,
    isPrimary: Boolean(item.is_primary),
  };
}

function mapRestaurant(item: RestaurantApiItem): Restaurant {
  return {
    id: String(item.id),
    name: item.name,
    category: item.category ?? "",
    rating: Number(item.rating) || 0,
    image: item.image ?? "",
    latitude: item.latitude,
    longitude: item.longitude,
    location: item.location,
    description: item.description,
    menuHighlights: [],
    whatsapp: item.whatsapp ?? "",
    ownerId: item.owner_id ? String(item.owner_id) : undefined,
    ownerUsername: item.owner_username ?? undefined,
    menuPdfUrl: item.menu_pdf_url ?? "",
    reviewsCount: Number(item.reviews_count) || 0,
    averageRating:
      item.average_rating === null || item.average_rating === undefined
        ? null
        : Number(item.average_rating) || 0,
    branches: (item.branches ?? []).map(mapBranch),
  };
}

function mapReview(item: ReviewApiItem): Review {
  return {
    id: String(item.id),
    restaurantId: "",
    restaurantName: item.restaurant_name,
    username: item.username,
    avatar: item.avatar,
    rating: Number(item.rating) || 0,
    comment: item.comment,
    date: item.created_at?.slice(0, 10) || "",
    isOwner: item.is_owner ?? false,
  };
}

function toRestaurantWritePayload(input: RestaurantWriteInput) {
  return {
    name: input.name,
    category: input.category,
    image: input.image,
    location: input.location,
    description: input.description,
    whatsapp: input.whatsapp ?? "",
    rating: input.rating,
  };
}

export async function fetchMyRestaurants(accessToken: string): Promise<Restaurant[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/owner/restaurants/`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Unable to load your restaurants");
  }

  const payload = (await response.json()) as RestaurantApiItem[];
  return payload.map(mapRestaurant);
}

export async function createMyRestaurant(
  accessToken: string,
  input: RestaurantWriteInput | FormData
): Promise<Restaurant> {
  const response = await fetch(`${API_BASE_URL}/api/v1/owner/restaurants/`, {
    method: "POST",
    headers: {
      ...authHeaders(accessToken),
      ...(input instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
    body: input instanceof FormData ? input : JSON.stringify(toRestaurantWritePayload(input as RestaurantWriteInput)),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || errorData.message || JSON.stringify(errorData) || "Unable to create restaurant";
    throw new Error(message);
  }

  const payload = (await response.json()) as RestaurantApiItem;
  return mapRestaurant(payload);
}

export async function updateMyRestaurant(
  accessToken: string,
  restaurantId: string,
  input: Partial<RestaurantWriteInput> | FormData
): Promise<Restaurant> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/owner/restaurants/${Number(restaurantId)}/`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(accessToken),
        ...(input instanceof FormData ? {} : { "Content-Type": "application/json" }),
      },
      body: input instanceof FormData ? input : JSON.stringify(toRestaurantWritePayload(input as RestaurantWriteInput)),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || errorData.message || JSON.stringify(errorData) || "Unable to update restaurant";
    throw new Error(message);
  }

  const payload = (await response.json()) as RestaurantApiItem;
  return mapRestaurant(payload);
}

export async function addRestaurantBranch(
  accessToken: string,
  restaurantId: string,
  input: {
    address: string;
    isPrimary?: boolean;
    latitude?: number;
    longitude?: number;
  }
): Promise<RestaurantBranch> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/owner/restaurants/${Number(restaurantId)}/branches/`,
    {
      method: "POST",
      headers: {
        ...authHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: input.address,
        is_primary: Boolean(input.isPrimary),
        latitude: input.latitude,
        longitude: input.longitude,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Unable to create branch");
  }

  const payload = (await response.json()) as RestaurantBranchApiItem;
  return mapBranch(payload);
}

export async function deleteRestaurantBranch(
  accessToken: string,
  branchId: string | number
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/owner/branches/${Number(branchId)}/`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken),
    }
  );

  if (!response.ok) {
    throw new Error("Unable to delete branch");
  }
}

export async function uploadRestaurantMenuPdf(
  accessToken: string,
  restaurantId: string,
  file: { uri: string; name: string; mimeType?: string }
): Promise<Restaurant> {
  const body = new FormData();
  const filename = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
  body.append("menu_pdf", {
    uri: file.uri,
    name: filename,
    type: file.mimeType || "application/pdf",
  } as any);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/owner/restaurants/${Number(restaurantId)}/menu/`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(accessToken),
      },
      body,
    }
  );

  if (!response.ok) {
    throw new Error("Unable to upload menu PDF");
  }

  const payload = (await response.json()) as RestaurantApiItem;
  return mapRestaurant(payload);
}

export async function fetchOwnerReviews(
  accessToken: string,
  restaurantId?: string
): Promise<Review[]> {
  const query = restaurantId ? `?restaurant=${encodeURIComponent(restaurantId)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/v1/owner/reviews/${query}`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Unable to load owner reviews");
  }

  const payload = (await response.json()) as ReviewApiItem[];
  return payload.map(mapReview);
}
