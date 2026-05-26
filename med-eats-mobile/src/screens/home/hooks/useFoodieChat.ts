// ============================================================
// [P2-5] Hook: useFoodieChat
// ------------------------------------------------------------
// Encapsula el estado del chat con Foodie AI y la lógica de
// consulta al backend `/api/v1/ai/foodie-chat/`. Si la petición
// falla, hace fallback a un ranking local con `rankLocalFoodieMatch`.
//
// NOTA: aún NO integrado en HomeScreen.tsx. La integración requiere
// coordinar refs del mapa y estado de selección — se hará con
// testing UI en una segunda iteración.
// ============================================================

import { useCallback, useState } from "react";
import { Restaurant } from "@/src/models/domain";
import { API_BASE_URL } from "@/src/config/api";
import {
  mapApiRestaurant,
  rankLocalFoodieMatch,
} from "@/src/screens/home/utils/foodieMatching";

export type FoodieChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export type FoodieRecommendation = {
  restaurant: Restaurant;
  explanation: string;
};

const WELCOME_MESSAGE: FoodieChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Soy Foodie AI. Cuéntame qué se te antoja y te recomiendo el mejor restaurante.",
};

export function useFoodieChat(
  restaurants: Restaurant[],
  userLocation?: { latitude: number; longitude: number } | null
) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<FoodieChatMessage[]>([WELCOME_MESSAGE]);
  const [recommendation, setRecommendation] =
    useState<FoodieRecommendation | null>(null);

  const ask = useCallback(
    async (question: string): Promise<FoodieRecommendation | null> => {
      const normalized = question.trim();
      if (!normalized) return null;

      const fallbackRestaurant = rankLocalFoodieMatch(
        normalized,
        restaurants,
        userLocation
      );
      const fallbackRecommendation = fallbackRestaurant
        ? {
            restaurant: fallbackRestaurant,
            explanation: `Te recomiendo ${fallbackRestaurant.name} porque encaja mejor con "${normalized}".`,
          }
        : null;

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/v1/ai/foodie-chat/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: normalized,
            latitude: userLocation?.latitude ?? null,
            longitude: userLocation?.longitude ?? null,
            excluded_restaurant_id: recommendation
              ? Number(recommendation.restaurant.id)
              : null,
          }),
        });

        if (!response.ok) {
          throw new Error("No se pudo consultar Foodie AI");
        }

        const payload = await response.json();

        if (payload.detail && !payload.restaurant) {
          setMessages((prev) => [
            ...prev,
            { id: `a-${Date.now()}`, role: "assistant", text: String(payload.detail) },
          ]);
          setRecommendation(null);
          return null;
        }

        const restaurant = mapApiRestaurant(payload.restaurant);
        const nextRecommendation: FoodieRecommendation = {
          restaurant,
          explanation:
            payload.explanation || "Te encontré una recomendación ideal para tu plan.",
        };
        setRecommendation(nextRecommendation);
        return nextRecommendation;
      } catch {
        if (fallbackRecommendation) {
          setRecommendation(fallbackRecommendation);
          return fallbackRecommendation;
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [restaurants, userLocation, recommendation]
  );

  const reset = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setRecommendation(null);
  }, []);

  return {
    isOpen,
    setIsOpen,
    loading,
    messages,
    setMessages,
    recommendation,
    setRecommendation,
    ask,
    reset,
  };
}
