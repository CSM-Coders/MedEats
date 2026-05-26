import { API_BASE_URL } from "@/src/config/api";
import {
  Restaurant,
  SavedRestaurantRecord,
  VisitedRestaurantRecord,
} from "@/src/models/domain";
import { apiRequest, ApiError } from "@/src/services/httpClient";

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
  menu_highlights?: string[];
  whatsapp?: string;
};

type SavedApiItem = {
  id: number | string;
  restaurant: RestaurantApiItem;
  created_at: string;
  is_saved?: boolean;
};

type VisitedApiItem = {
  id: number | string;
  restaurant: RestaurantApiItem;
  rating: number;
  visit_date: string;
  note?: string;
  created_at: string;
  updated_at: string;
};

function mapRestaurant(item: RestaurantApiItem): Restaurant {
  let imageUrl = item.image ?? "";
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    imageUrl = imageUrl.startsWith("/") ? `${API_BASE_URL}${imageUrl}` : `${API_BASE_URL}/${imageUrl}`;
  }

  return {
    id: String(item.id),
    name: item.name,
    category: item.category ?? "",
    rating: Number(item.rating) || 0,
    image: imageUrl,
    latitude: item.latitude,
    longitude: item.longitude,
    location: item.location,
    description: item.description,
    menuHighlights: item.menu_highlights ?? [],
    whatsapp: item.whatsapp ?? "",
  };
}

function mapSaved(item: SavedApiItem): SavedRestaurantRecord {
  return {
    id: String(item.id),
    restaurant: mapRestaurant(item.restaurant),
    createdAt: item.created_at,
  };
}

function mapVisited(item: VisitedApiItem): VisitedRestaurantRecord {
  return {
    id: String(item.id),
    restaurant: mapRestaurant(item.restaurant),
    rating: Number(item.rating) || 0,
    visitDate: item.visit_date,
    note: item.note ?? "",
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export async function fetchSavedRestaurants(
  accessToken: string,
  username?: string
): Promise<SavedRestaurantRecord[]> {
  const path = username
    ? `/api/v1/user/restaurants/saved/?username=${encodeURIComponent(username)}`
    : `/api/v1/user/restaurants/saved/`;

  const payload = await apiRequest<SavedApiItem[]>(path, { accessToken });
  return payload.map(mapSaved);
}

export async function fetchVisitedRestaurants(
  accessToken: string,
  username?: string
): Promise<VisitedRestaurantRecord[]> {
  const path = username
    ? `/api/v1/user/restaurants/visited/?username=${encodeURIComponent(username)}`
    : `/api/v1/user/restaurants/visited/`;

  const payload = await apiRequest<VisitedApiItem[]>(path, { accessToken });
  return payload.map(mapVisited);
}

export async function saveRestaurant(
  accessToken: string,
  restaurantId: string
): Promise<SavedRestaurantRecord> {
  const payload = await apiRequest<SavedApiItem>("/api/v1/user/restaurants/saved/", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ restaurant_id: Number(restaurantId) }),
  });
  return mapSaved(payload);
}

export async function unsaveRestaurant(
  accessToken: string,
  restaurantId: string
): Promise<void> {
  // 404 al borrar es aceptable: significa que el restaurante ya no estaba guardado.
  try {
    await apiRequest<void>(
      `/api/v1/user/restaurants/saved/${Number(restaurantId)}/`,
      { method: "DELETE", accessToken }
    );
  } catch (err) {
    if (err instanceof ApiError && err.isNotFound) return;
    throw err;
  }
}

export async function isRestaurantSaved(
  accessToken: string,
  restaurantId: string
): Promise<boolean> {
  const payload = await apiRequest<{ is_saved?: boolean }>(
    `/api/v1/user/restaurants/saved/${Number(restaurantId)}/`,
    { accessToken }
  );
  return Boolean(payload.is_saved);
}

export async function markRestaurantVisited(
  accessToken: string,
  input: { restaurantId: string; rating: number; note?: string }
): Promise<VisitedRestaurantRecord> {
  const payload = await apiRequest<VisitedApiItem>(
    "/api/v1/user/restaurants/visited/",
    {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        restaurant_id: Number(input.restaurantId),
        rating: input.rating,
        note: input.note ?? "",
      }),
    }
  );
  return mapVisited(payload);
}
