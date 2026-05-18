import { API_BASE_URL } from "@/src/config/api";
import {
  Restaurant,
  SavedRestaurantRecord,
  VisitedRestaurantRecord,
} from "@/src/models/domain";

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

function getAuthHeaders(accessToken: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
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
  const url = username 
    ? `${API_BASE_URL}/api/v1/user/restaurants/saved/?username=${username}`
    : `${API_BASE_URL}/api/v1/user/restaurants/saved/`;
    
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load saved restaurants");
  }

  const payload = (await response.json()) as SavedApiItem[];
  return payload.map(mapSaved);
}

export async function fetchVisitedRestaurants(
  accessToken: string,
  username?: string
): Promise<VisitedRestaurantRecord[]> {
  const url = username 
    ? `${API_BASE_URL}/api/v1/user/restaurants/visited/?username=${username}`
    : `${API_BASE_URL}/api/v1/user/restaurants/visited/`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load visited restaurants");
  }

  const payload = (await response.json()) as VisitedApiItem[];
  return payload.map(mapVisited);
}

export async function saveRestaurant(
  accessToken: string,
  restaurantId: string
): Promise<SavedRestaurantRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/user/restaurants/saved/`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ restaurant_id: Number(restaurantId) }),
  });

  if (!response.ok) {
    throw new Error("Unable to save restaurant");
  }

  const payload = (await response.json()) as SavedApiItem;
  return mapSaved(payload);
}

export async function unsaveRestaurant(
  accessToken: string,
  restaurantId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/user/restaurants/saved/${Number(restaurantId)}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error("Unable to remove saved restaurant");
  }
}

export async function isRestaurantSaved(
  accessToken: string,
  restaurantId: string
): Promise<boolean> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/user/restaurants/saved/${Number(restaurantId)}/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Unable to check saved state");
  }

  const payload = (await response.json()) as { is_saved?: boolean };
  return Boolean(payload.is_saved);
}

export async function markRestaurantVisited(
  accessToken: string,
  input: { restaurantId: string; rating: number; note?: string }
): Promise<VisitedRestaurantRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/user/restaurants/visited/`, {
    method: "POST",
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      restaurant_id: Number(input.restaurantId),
      rating: input.rating,
      note: input.note ?? "",
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to mark restaurant as visited");
  }

  const payload = (await response.json()) as VisitedApiItem;
  return mapVisited(payload);
}
