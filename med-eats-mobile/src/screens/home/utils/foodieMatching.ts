// ============================================================
// [P2-5] HELPERS PUROS EXTRAÍDOS DE homeScreen.tsx
// ------------------------------------------------------------
// Funciones sin estado de React, usadas por la pantalla principal
// y por los hooks de filtros/chat. Aisladas aquí para que la
// pantalla principal quede más liviana y los hooks puedan testearse
// independientemente.
// ============================================================

import { Restaurant } from "@/src/models/domain";
import { ApiRestaurant } from "@/src/types/api";

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function mapApiRestaurant(item: Partial<ApiRestaurant>): Restaurant {
  return {
    id: String(item.id),
    name: item.name ?? "",
    category: item.category || "Restaurante",
    rating: parseFloat(item.rating ?? "0") || 0,
    image: item.image ?? "",
    latitude: item.latitude ?? 0,
    longitude: item.longitude ?? 0,
    location: item.location ?? "",
    description: item.description ?? "",
    menuHighlights: item.menu_highlights || [],
    whatsapp: item.whatsapp || "",
  };
}

export function getRestaurantMapPoints(restaurant: Restaurant) {
  if (restaurant.branches?.length) {
    return restaurant.branches.map((branch) => ({
      latitude: branch.latitude,
      longitude: branch.longitude,
    }));
  }

  return [
    {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    },
  ];
}

export function getDistanceKmBetween(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(latB - latA);
  const dLon = toRad(lonB - lonA);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(latA)) *
      Math.cos(toRad(latB)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earth * c;
}

export function hasProximityIntent(query: string): boolean {
  const normalized = normalizeText(query);
  return ["cerca", "cercano", "cercana", "near", "por aqui", "por aca", "alrededor"].some(
    (term) => normalized.includes(term)
  );
}

export function rankLocalFoodieMatch(
  query: string,
  restaurantsPool: Restaurant[],
  userLocation?: { latitude: number; longitude: number } | null
): Restaurant | null {
  const tokens = normalizeText(query)
    .split(" ")
    .filter((token) => token.length >= 3);
  if (!tokens.length) return null;

  const semanticGroups = [
    ["pizza", "italian", "italiana", "napolitana"],
    ["sushi", "japanese", "japonesa", "asiatica", "asiatico"],
    ["burger", "hamburguesa", "grill", "parrilla"],
    ["healthy", "fit", "saludable", "vegano", "vegana"],
    ["mexican", "mexicana", "tacos", "taqueria"],
  ];

  const ranked = [...restaurantsPool].sort((left, right) => {
    const scoreFor = (restaurant: Restaurant) => {
      const name = normalizeText(restaurant.name);
      const category = normalizeText(restaurant.category);
      const description = normalizeText(restaurant.description);
      const location = normalizeText(restaurant.location);

      let score = 0;
      for (const token of tokens) {
        if (name.includes(token)) score += 3;
        if (category.includes(token)) score += 5;
        if (description.includes(token)) score += 2;
        if (location.includes(token)) score += 0.5;
      }

      for (const group of semanticGroups) {
        const queryHitsGroup = group.some((term) => tokens.some((token) => token.includes(term)));
        const restaurantHitsGroup = group.some(
          (term) => name.includes(term) || category.includes(term) || description.includes(term)
        );
        if (queryHitsGroup && restaurantHitsGroup) score += 6;
      }

      if (userLocation && hasProximityIntent(query)) {
        const distanceKm = getDistanceKmBetween(
          userLocation.latitude,
          userLocation.longitude,
          restaurant.latitude,
          restaurant.longitude
        );
        score += Math.max(0, 15 - distanceKm);
      }

      return score;
    };

    return scoreFor(right) - scoreFor(left);
  });

  return ranked[0] ?? null;
}
