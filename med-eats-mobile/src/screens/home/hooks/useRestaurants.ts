// ============================================================
// [P2-5] Hook: useRestaurants
// ------------------------------------------------------------
// Encapsula el fetching de restaurantes, los filtros aplicados
// y la búsqueda por texto. Implementado exactamente como sugiere
// el plan de refactorización.
//
// NOTA: aún NO integrado en HomeScreen.tsx — la integración
// requiere validación en vivo del mapa/filtros y se hará en una
// segunda iteración con testing UI.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { HomeFilters, Restaurant } from "@/src/models/domain";
import { fetchRestaurants } from "@/src/services/restaurantApi";

export function useRestaurants(filters: HomeFilters, searchQuery: string) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRestaurants();
      setRestaurants(data);
    } catch {
      setError("No se pudieron cargar los restaurantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (filters.category && r.category !== filters.category) return false;
      if (filters.minRating && r.rating < filters.minRating) return false;
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [restaurants, filters, searchQuery]);

  return { restaurants, filtered, loading, error, reload: load };
}
