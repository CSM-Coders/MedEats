// ============================================================
// [P2-5] Hook: useRestaurants
// ------------------------------------------------------------
// Encapsula el fetching de restaurantes desde el backend y un
// filtro básico en memoria. Integrado en HomeScreen.tsx.
//
// HomeScreen consume `restaurants`, `loading` y `reload`; el
// filtrado más rico (con sedes y distancia) lo hace localmente
// la pantalla porque `filtered` aquí solo soporta filtros simples.
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
      // [Hardening] Filtrar restaurantes inválidos en la fuente
      const safe = (data || []).filter((r) => r && r.id);
      setRestaurants(safe);
    } catch (err) {
      console.error("[useRestaurants] fetch failed:", err);
      setError("No se pudieron cargar los restaurantes.");
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = (searchQuery || "").toLowerCase();
    return restaurants.filter((r) => {
      if (!r) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.minRating && (r.rating ?? 0) < filters.minRating) return false;
      if (query && !(r.name || "").toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [restaurants, filters, searchQuery]);

  return { restaurants, filtered, loading, error, reload: load };
}
