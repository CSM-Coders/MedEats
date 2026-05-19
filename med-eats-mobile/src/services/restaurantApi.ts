import { API_BASE_URL } from "@/src/config/api";
import { Restaurant } from "@/src/models/domain";

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
  menu_highlights?: string[];
  whatsapp?: string;
  owner_id?: number | string;
  owner_username?: string;
  menu_pdf_url?: string;
  reviews_count?: number;
  average_rating?: number | string | null;
  branches?: RestaurantBranchApiItem[];
};

function mapRestaurant(item: RestaurantApiItem): Restaurant {
  // Normalize image URL: if backend returned a relative path (e.g. '/media/...')
  // convert it to absolute using API_BASE_URL so React Native Image can load it reliably.
  let imageUrl = item.image ?? "";
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    // ensure leading slash
    imageUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    imageUrl = `${API_BASE_URL}${imageUrl}`;
  }

  const branches = (item.branches ?? []).map((branch) => {
    const lat = Number(branch.latitude);
    const lon = Number(branch.longitude);
    return {
      id: String(branch.id),
      name: branch.name || branch.address || "Sede",
      address: branch.address,
      latitude: Number.isFinite(lat) ? lat : NaN,
      longitude: Number.isFinite(lon) ? lon : NaN,
      isPrimary: Boolean(branch.is_primary),
    };
  });

  let menuPdfUrl = item.menu_pdf_url ?? "";
  if (menuPdfUrl && !/^https?:\/\//i.test(menuPdfUrl)) {
    menuPdfUrl = menuPdfUrl.startsWith("/") ? `${API_BASE_URL}${menuPdfUrl}` : `${API_BASE_URL}/${menuPdfUrl}`;
  }

  return {
    id: String(item.id),
    name: item.name,
    category: item.category || "Restaurante",
    rating: Number(item.rating) || 0,
    image: imageUrl,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    location: item.location,
    description: item.description,
    menuHighlights: item.menu_highlights ?? [],
    whatsapp: item.whatsapp ?? "",
    ownerId: item.owner_id ? String(item.owner_id) : undefined,
    ownerUsername: item.owner_username ?? undefined,
    menuPdfUrl,
    reviewsCount: Number(item.reviews_count) || 0,
    averageRating:
      item.average_rating === null || item.average_rating === undefined
        ? null
        : Number(item.average_rating) || 0,
    branches,
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
