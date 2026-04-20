// ============================================================
// MODELOS DE DOMINIO (Frontend)
// ------------------------------------------------------------
// Este archivo define las "formas" de datos que usa la app.
// Ventaja: cualquier pantalla que use `Restaurant`, `Post`, etc.
// tendrá consistencia y menos errores de tipos.
// ============================================================

export type Restaurant = {
  id: string;
  name: string;
  category: string;
  rating: number;
  image: string;
  latitude: number;
  longitude: number;
  location: string;
  description: string;
  menuHighlights: string[];
  whatsapp: string;
};

export type Review = {
  id: string;
  restaurantId: string;
  username: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  isOwner?: boolean;
};

export type Post = {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  restaurantId: string;
  restaurantName: string;
  image: string;
  rating: number;
  caption: string;
  likes: number;
  comments: number;
  date: string;
  isLiked?: boolean;
};

export type AppUser = {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  bio: string;
  location: string;
  followers: number;
  following: number;
};

export type VisitedRestaurant = {
  restaurantId: string;
  rating: number;
  visitDate: string;
};

export type SavedRestaurantRecord = {
  id: string;
  restaurant: Restaurant;
  createdAt: string;
};

export type VisitedRestaurantRecord = {
  id: string;
  restaurant: Restaurant;
  rating: number;
  visitDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type HomeFilters = {
  category: string | null;
  minRating: number | null;
  maxDistanceKm: number | null;
};
