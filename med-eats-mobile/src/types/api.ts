// ============================================================
// [P2-8] TIPOS DE LA RESPUESTA DEL BACKEND
// ------------------------------------------------------------
// Estos tipos mapean exactamente el JSON que devuelve la API
// (snake_case del lado del backend). Los servicios los traducen
// a los modelos de dominio (camelCase) usando funciones map*.
// ============================================================

export type ApiRestaurantBranch = {
  id: number;
  restaurant: number;
  address: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
};

export type ApiRestaurant = {
  id: number;
  name: string;
  category: string;
  rating: string | null;
  average_rating: number | null;
  reviews_count: number;
  image: string | null;
  latitude: number;
  longitude: number;
  location: string;
  description: string;
  menu_highlights: string[];
  whatsapp: string;
  owner_id: string | null;
  owner_username: string | null;
  menu_pdf_url: string;
  branches: ApiRestaurantBranch[];
};

export type ApiPost = {
  id: number;
  user_id: number;
  username: string;
  user_avatar: string;
  restaurant_id: number;
  restaurant_name: string;
  image: string;
  rating: number;
  caption: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
};

export type ApiPaginatedResponse<T> = {
  count?: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
