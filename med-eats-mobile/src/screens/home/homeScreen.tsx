// ============================================================
// HOME SCREEN
// ------------------------------------------------------------
// Pantalla principal de descubrimiento:
// - mapa con marcadores
// - búsqueda por texto
// - búsqueda semántica básica (AI-like)
// - filtros por categoría, rating y distancia
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapViewComponent from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeFilters, Restaurant } from "@/src/models/domain";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import {
  getDistanceKm,
  MEDELLIN_REGION,
  semanticCategoryMatches,
} from "@/src/services/mockData";
import MapView from "./components/mapView";
import RestaurantCard from "./components/restaurantCard";

const initialFilters: HomeFilters = {
  category: null,
  minRating: null,
  maxDistanceKm: null,
};

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<HomeFilters>(initialFilters);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // CONEXIÓN CON EL BACKEND APENAS CARGA LA APP (Sprint 1)
  // ------------------------------------------------------------
  // Usamos un "useEffect": Es una función de React que ejecuta nuestro
  // código exactamente una vez cuando la pantalla se muestra por primera vez.
  // En lugar de usar los fijos de mockData.ts, pedimos a Django la lista por internet.
  // ============================================================
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Al estar probando en tu iPhone físico con Expo, "localhost" no funciona
        // porque apuntaría al teléfono mismo. Usamos la IP de red Wi-Fi de tu Mac:
        // NOTA DE RED: Tu router asignó un nuevo IP a tu Mac (192.168.1.2).
        // Si vuelves a cambiar de Wi-Fi, deberás actualizar este IP.
        const response = await fetch("http://192.168.1.2:8000/api/restaurants/");
        
        if (!response.ok) {
          throw new Error("Respuesta de red incorrecta");
        }
        
        const data = await response.json();
        // ============================================================
        // TRANSFORMACIÓN DE DATOS (API snake_case → Frontend camelCase)
        // ------------------------------------------------------------
        // Django envía los campos en snake_case (menu_highlights, created_at)
        // pero nuestro TypeScript espera camelCase (menuHighlights).
        // También el rating viene como string "4.8" y lo necesitamos como número.
        // ============================================================
        const transformed: Restaurant[] = data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          category: item.category,
          rating: parseFloat(item.rating) || 0,
          image: item.image,
          latitude: item.latitude,
          longitude: item.longitude,
          location: item.location,
          description: item.description,
          menuHighlights: item.menu_highlights || [],
          whatsapp: item.whatsapp || "",
        }));
        setRestaurants(transformed);
      } catch (error) {
        console.error("Error conectando con Django:", error);
      } finally {
        // Apagamos el circulito de carga de la pantalla, haya funcionado o fallado.
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // ============================================================
  // FIX: Cuando el usuario borra el texto de búsqueda MANUALMENTE,
  // devolvemos la cámara del mapa a la vista completa de Medellín.
  // Usamos un flag (skipResetRef) para NO resetear cuando se borra
  // por haber tocado una sugerencia (que tiene su propio zoom).
  // ============================================================
  const skipResetRef = useRef(false);
  useEffect(() => {
    if (searchQuery === "") {
      if (skipResetRef.current) {
        skipResetRef.current = false; // Consumimos el flag
      } else {
        mapRef.current?.animateToRegion(MEDELLIN_REGION, 500);
      }
    }
  }, [searchQuery]);

  const mapRef = useRef<MapViewComponent>(null);
  const insets = useSafeAreaInsets();
  const { location: userLocation } = useUserLocation();

  const categories = useMemo(
    () => [...new Set(restaurants.map((restaurant) => restaurant.category))],
    [restaurants] // <-- ¡Actualizado! Ahora depende de los restaurantes que vienen de BD
  );

  const isAiSearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return false;
    }

    return restaurants.some((restaurant) =>
      semanticCategoryMatches(searchQuery, restaurant.category)
    );
  }, [searchQuery, restaurants]); // <-- ¡Actualizado! Funciona en tiempo real

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return restaurants.filter((restaurant) => {
      const directMatch =
        !query ||
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.category.toLowerCase().includes(query);

      const semanticMatch = query
        ? semanticCategoryMatches(query, restaurant.category)
        : false;

      const searchMatch = directMatch || semanticMatch;

      const categoryMatch =
        !filters.category || restaurant.category === filters.category;

      const ratingMatch =
        !filters.minRating || restaurant.rating >= filters.minRating;

      const originLat = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
      const originLon = userLocation?.longitude ?? MEDELLIN_REGION.longitude;
      const distance = getDistanceKm(
        originLat,
        originLon,
        restaurant.latitude,
        restaurant.longitude
      );
      const distanceMatch =
        !filters.maxDistanceKm || distance <= filters.maxDistanceKm;

      return searchMatch && categoryMatch && ratingMatch && distanceMatch;
    });
  }, [filters, searchQuery, userLocation, restaurants]);

  // ============================================================
  // SUGERENCIAS DE BÚSQUEDA (Autocomplete)
  // Filtra restaurantes cuyo nombre contenga lo que el usuario escribe.
  // Solo aparece si hay texto y hay coincidencias.
  // ============================================================
  const searchSuggestions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query || query.length < 2) return [];
    return restaurants.filter((r) =>
      r.name.toLowerCase().includes(query)
    ).slice(0, 5); // Máximo 5 sugerencias
  }, [searchQuery, restaurants]);

  // Al tocar una sugerencia, hacemos zoom al restaurante y abrimos su tarjeta
  const handleSuggestionPress = (restaurant: Restaurant) => {
    Keyboard.dismiss();
    skipResetRef.current = true; // Evita que el useEffect resetee el mapa
    setSearchQuery("");
    setSelectedRestaurant(restaurant);
    mapRef.current?.animateToRegion(
      {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      700
    );
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();

    // Protección: Si no hay resultados, no intentamos mover la cámara
    // (fitToCoordinates con array vacío causa un crash en iOS).
    if (filteredRestaurants.length === 0) {
      return;
    }

    if (filteredRestaurants.length === 1) {
      const restaurant = filteredRestaurants[0];
      mapRef.current?.animateToRegion(
        {
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700
      );
      return;
    }

    // Solo animamos si hay 2 o más resultados válidos
    if (filteredRestaurants.length >= 2) {
      mapRef.current?.fitToCoordinates(
        filteredRestaurants.map((restaurant) => ({
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
        })),
        {
          edgePadding: { top: 160, right: 50, bottom: 60, left: 50 },
          animated: true,
        }
      );
    }
  };

  const clearSearchAndFilters = () => {
    setSelectedRestaurant(null);
    Keyboard.dismiss();
    setSearchQuery("");
    setFilters(initialFilters);
    setShowFilters(false);

    mapRef.current?.animateToRegion(MEDELLIN_REGION, 700);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ marginTop: 12, color: "#636E72" }}>Cargando restaurantes desde PostgreSQL...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.container} onPress={() => setSelectedRestaurant(null)}>
        {/* IMPORTANTE: Siempre pasamos TODOS los restaurantes al mapa.
            La búsqueda solo mueve la cámara, nunca elimina marcadores.
            Esto evita un bug de iOS donde los markers eliminados no reaparecen. */}
        <MapView
          ref={mapRef}
          restaurants={restaurants}
          onMarkerPress={setSelectedRestaurant}
        />
      </Pressable>

      <View style={[styles.searchContainer, { top: insets.top + 8 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or food type"
            placeholderTextColor="#B2BEC3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />

          <Pressable
            onPress={() => setShowFilters((value) => !value)}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Ionicons name="options-outline" size={20} color="#636E72" />
          </Pressable>

          {(searchQuery.length > 0 || filters.category || filters.minRating || filters.maxDistanceKm) && (
            <Pressable onPress={clearSearchAndFilters} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#B2BEC3" />
            </Pressable>
          )}
        </View>

        {/* ===== DROPDOWN DE SUGERENCIAS ===== */}
        {searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {searchSuggestions.map((restaurant) => (
              <Pressable
                key={restaurant.id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(restaurant)}
              >
                <Ionicons name="location-outline" size={16} color="#FF6B35" />
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionName}>{restaurant.name}</Text>
                  <Text style={styles.suggestionCategory}>{restaurant.category} · {restaurant.location}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {filteredRestaurants.length} resultado{filteredRestaurants.length === 1 ? "" : "s"}
          </Text>
          {isAiSearch && <Text style={styles.aiBadge}>AI</Text>}
        </View>

        {showFilters && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterTitle}>Filtros</Text>

            <Text style={styles.filterLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              <Pressable
                style={[styles.chip, !filters.category && styles.chipActive]}
                onPress={() => setFilters((prev) => ({ ...prev, category: null }))}
              >
                <Text style={[styles.chipText, !filters.category && styles.chipTextActive]}>Todas</Text>
              </Pressable>

              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={[styles.chip, filters.category === category && styles.chipActive]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      category: prev.category === category ? null : category,
                    }))
                  }
                >
                  <Text style={[styles.chipText, filters.category === category && styles.chipTextActive]}>
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Rating mínimo</Text>
            <View style={styles.inlineRow}>
              {[4, 4.5].map((value) => (
                <Pressable
                  key={value}
                  style={[styles.chip, filters.minRating === value && styles.chipActive]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      minRating: prev.minRating === value ? null : value,
                    }))
                  }
                >
                  <Text style={[styles.chipText, filters.minRating === value && styles.chipTextActive]}>
                    {value}+
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Distancia</Text>
            <View style={styles.inlineRow}>
              {[2, 5].map((value) => (
                <Pressable
                  key={value}
                  style={[styles.chip, filters.maxDistanceKm === value && styles.chipActive]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      maxDistanceKm: prev.maxDistanceKm === value ? null : value,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.maxDistanceKm === value && styles.chipTextActive,
                    ]}
                  >
                    {value} km
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <Pressable
        style={styles.locationButton}
        onPress={() => {
          const latitude = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
          const longitude = userLocation?.longitude ?? MEDELLIN_REGION.longitude;

          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            },
            700
          );
        }}
      >
        <Ionicons name="navigate" size={22} color="#FF6B35" />
      </Pressable>

      {selectedRestaurant && (
        <View style={styles.cardContainer}>
          <RestaurantCard
            restaurant={selectedRestaurant}
            onClose={() => setSelectedRestaurant(null)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#2D3436",
  },
  iconButton: {
    paddingHorizontal: 4,
  },
  resultsCount: {
    marginTop: 8,
    backgroundColor: "#2D3436",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultsText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  aiBadge: {
    color: "#FF6B35",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  filterPanel: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: "#636E72",
    marginBottom: 8,
    marginTop: 8,
  },
  chipsRow: {
    flexGrow: 0,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: {
    borderColor: "#FF6B35",
    backgroundColor: "#FFF1EC",
  },
  chipText: {
    fontSize: 12,
    color: "#636E72",
  },
  chipTextActive: {
    color: "#FF6B35",
    fontWeight: "600",
  },
  locationButton: {
    position: "absolute",
    bottom: 32,
    right: 16,
    backgroundColor: "#fff",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  cardContainer: {
    position: "absolute",
    bottom: 32,
    left: 24,
    right: 24,
    zIndex: 20,
  },
  // ===== Estilos del Dropdown de Sugerencias =====
  suggestionsContainer: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3436",
  },
  suggestionCategory: {
    fontSize: 12,
    color: "#636E72",
    marginTop: 2,
  },
});
