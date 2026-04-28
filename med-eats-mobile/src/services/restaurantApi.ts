import { API_BASE_URL } from "@/src/config/api";
import { Restaurant } from "@/src/models/domain";

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
    menuHighlights: item.menu_highlights ?? [],
    whatsapp: item.whatsapp ?? "",
  };
}

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const url = `${API_BASE_URL}/api/v1/restaurants/`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(`Network error when fetching restaurants from ${url}: ${String(err)}`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "<no body>");
    throw new Error(`Unable to load restaurants from ${url} (status ${response.status}): ${text}`);
  }

  const payload = (await response.json()) as RestaurantApiItem[];
  return payload.map(mapRestaurant);
}

export async function fetchRestaurantById(id: string): Promise<Restaurant> {
  const response = await fetch(`${API_BASE_URL}/api/v1/restaurants/${id}/`);

  if (!response.ok) {
    throw new Error("Unable to load restaurant");
  }

  const payload = (await response.json()) as RestaurantApiItem;
  return mapRestaurant(payload);
}

export async function fetchSavedRestaurants(accessToken: string, username?: string): Promise<Restaurant[]> {
  const url = username 
    ? `${API_BASE_URL}/api/v1/user/restaurants/saved/?username=${username}`
    : `${API_BASE_URL}/api/v1/user/restaurants/saved/`;
    
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("Unable to load saved restaurants");

  const payload = (await response.json()) as any[];
  // El backend devuelve { id, restaurant, ... }
  return payload.map(item => mapRestaurant(item.restaurant));
}

export async function fetchVisitedRestaurants(accessToken: string, username?: string): Promise<Restaurant[]> {
  const url = username 
    ? `${API_BASE_URL}/api/v1/user/restaurants/visited/?username=${username}`
    : `${API_BASE_URL}/api/v1/user/restaurants/visited/`;
    
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error("Unable to load visited restaurants");

  const payload = (await response.json()) as any[];
  // El backend devuelve { id, restaurant, ... }
  return payload.map(item => mapRestaurant(item.restaurant));
}
