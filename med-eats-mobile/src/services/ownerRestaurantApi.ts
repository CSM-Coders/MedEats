import { API_BASE_URL } from "@/src/config/api";
import {
  Restaurant,
  RestaurantBranch,
  RestaurantWriteInput,
  Review,
} from "@/src/models/domain";
import { apiRequest, ApiError } from "@/src/services/httpClient";

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

export type FoodCategory = {
  id: number;
  name: string;
};

type CategoryApiItem = {
  id: number;
  name: string;
};

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
  let imageUrl = item.image ?? "";
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    imageUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    imageUrl = `${API_BASE_URL}${imageUrl}`;
  }

  const branches = (item.branches ?? []).map((b) => {
    const lat = Number(b.latitude);
    const lon = Number(b.longitude);
    return {
      id: String(b.id),
      name: b.name,
      address: b.address,
      latitude: Number.isFinite(lat) ? lat : NaN,
      longitude: Number.isFinite(lon) ? lon : NaN,
      isPrimary: Boolean(b.is_primary),
    };
  });

  return {
    id: String(item.id),
    name: item.name,
    category: item.category ?? "",
    rating: Number(item.rating) || 0,
    image: imageUrl,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
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
    branches,
  };
}

function mapReview(item: ReviewApiItem): Review {
  return {
    id: String(item.id),
    restaurantId: "",
    restaurantName: item.restaurant_name,
    username: item.username,
    avatar: (() => {
      const raw = item.avatar || "";
      if (!raw) return "";
      if (/^https?:\/\//i.test(raw)) return raw;
      return raw.startsWith("/") ? `${API_BASE_URL}${raw}` : `${API_BASE_URL}/${raw}`;
    })(),
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

// Envuelve apiRequest reemplazando el mensaje del ApiError por uno con contexto
// específico de la operación (p.ej. "Unable to create restaurant").
async function ownerApiRequest<T>(
  path: string,
  fallbackMessage: string,
  options: Parameters<typeof apiRequest>[1] = {}
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError) {
      const detail = err.message && err.message !== `HTTP ${err.status}` ? err.message : "";
      const combined = detail
        ? `${fallbackMessage} (HTTP ${err.status}): ${detail}`
        : `${fallbackMessage} (HTTP ${err.status})`;
      throw new Error(combined);
    }
    throw err;
  }
}

export async function fetchMyRestaurants(accessToken: string): Promise<Restaurant[]> {
  const payload = await ownerApiRequest<RestaurantApiItem[]>(
    "/api/v1/owner/restaurants/",
    "Unable to load your restaurants",
    { accessToken }
  );
  return payload.map(mapRestaurant);
}

export async function fetchFoodCategories(): Promise<FoodCategory[]> {
  const payload = await ownerApiRequest<CategoryApiItem[]>(
    "/api/v1/categories/",
    "Unable to load categories"
  );
  return payload.map((item) => ({
    id: Number(item.id),
    name: item.name,
  }));
}

export async function createMyRestaurant(
  accessToken: string,
  input: RestaurantWriteInput | FormData
): Promise<Restaurant> {
  const body =
    input instanceof FormData
      ? input
      : JSON.stringify(toRestaurantWritePayload(input as RestaurantWriteInput));

  const payload = await ownerApiRequest<RestaurantApiItem>(
    "/api/v1/owner/restaurants/",
    "Unable to create restaurant",
    { method: "POST", accessToken, body }
  );
  return mapRestaurant(payload);
}

export async function updateMyRestaurant(
  accessToken: string,
  restaurantId: string,
  input: Partial<RestaurantWriteInput> | FormData
): Promise<Restaurant> {
  const body =
    input instanceof FormData
      ? input
      : JSON.stringify(toRestaurantWritePayload(input as RestaurantWriteInput));

  const payload = await ownerApiRequest<RestaurantApiItem>(
    `/api/v1/owner/restaurants/${Number(restaurantId)}/`,
    "Unable to update restaurant",
    { method: "PATCH", accessToken, body }
  );
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
  const payload = await ownerApiRequest<RestaurantBranchApiItem>(
    `/api/v1/owner/restaurants/${Number(restaurantId)}/branches/`,
    "Unable to create branch",
    {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        address: input.address,
        is_primary: Boolean(input.isPrimary),
        latitude: input.latitude,
        longitude: input.longitude,
      }),
    }
  );
  return mapBranch(payload);
}

export async function deleteRestaurantBranch(
  accessToken: string,
  branchId: string | number
): Promise<void> {
  await ownerApiRequest<void>(
    `/api/v1/owner/branches/${Number(branchId)}/`,
    "Unable to delete branch",
    { method: "DELETE", accessToken }
  );
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

  const payload = await ownerApiRequest<RestaurantApiItem>(
    `/api/v1/owner/restaurants/${Number(restaurantId)}/menu/`,
    "Unable to upload menu PDF",
    { method: "PATCH", accessToken, body }
  );
  return mapRestaurant(payload);
}

export async function fetchOwnerReviews(
  accessToken: string,
  restaurantId?: string
): Promise<Review[]> {
  const path = restaurantId
    ? `/api/v1/owner/reviews/?restaurant=${encodeURIComponent(restaurantId)}`
    : "/api/v1/owner/reviews/";

  const payload = await ownerApiRequest<ReviewApiItem[]>(
    path,
    "Unable to load owner reviews",
    { accessToken }
  );
  return payload.map(mapReview);
}
