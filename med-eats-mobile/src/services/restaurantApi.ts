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
  const response = await fetch(`${API_BASE_URL}/api/restaurants/`);

  if (!response.ok) {
    throw new Error("Unable to load restaurants");
  }

  const payload = (await response.json()) as RestaurantApiItem[];
  return payload.map(mapRestaurant);
}

export async function fetchRestaurantById(id: string): Promise<Restaurant> {
  const response = await fetch(`${API_BASE_URL}/api/restaurants/${id}/`);

  if (!response.ok) {
    throw new Error("Unable to load restaurant");
  }

  const payload = (await response.json()) as RestaurantApiItem;
  return mapRestaurant(payload);
}
