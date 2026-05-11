// ============================================================
// HOME SCREEN
// ------------------------------------------------------------
// Pantalla principal de descubrimiento:
// - mapa con marcadores
// - búsqueda por texto
// - búsqueda semántica básica (AI-like)
// - filtros por categoría, rating y distancia
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
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
import { useFocusEffect } from "@react-navigation/native";
import { HomeFilters, Restaurant } from "@/src/models/domain";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import {
  getDistanceKm,
  MEDELLIN_REGION,
  restaurants as mockRestaurants,
  semanticCategoryMatches,
} from "@/src/services/mockData";
import MapView from "./components/mapView";
import RestaurantCard from "./components/restaurantCard";
import { API_BASE_URL } from "@/src/config/api";
import { fetchRestaurants as fetchRestaurantsApi } from "@/src/services/restaurantApi";

const initialFilters: HomeFilters = {
  category: null,
  minRating: null,
  maxDistanceKm: null,
};

type FoodieRecommendation = {
  restaurant: Restaurant;
  explanation: string;
};

type FoodieChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapApiRestaurant(item: any): Restaurant {
  return {
    id: String(item.id),
    name: item.name,
    category: item.category || "Restaurante",
    rating: parseFloat(item.rating) || 0,
    image: item.image,
    latitude: item.latitude,
    longitude: item.longitude,
    location: item.location,
    description: item.description,
    menuHighlights: item.menu_highlights || [],
    whatsapp: item.whatsapp || "",
  };
}

function getRestaurantMapPoints(restaurant: Restaurant) {
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

function getDistanceKmBetween(
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

function hasProximityIntent(query: string): boolean {
  const normalized = normalizeText(query);
  return ["cerca", "cercano", "cercana", "near", "por aqui", "por aca", "alrededor"].some(
    (term) => normalized.includes(term)
  );
}

function rankLocalFoodieMatch(
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

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [navigationData, setNavigationData] = useState<{ distance: number; duration: number } | null>(null);
  const [navigationState, setNavigationState] = useState<"discovery" | "preview" | "active">("discovery");
  const [showFilters, setShowFilters] = useState(false);
  // `filters` = filtros APLICADOS al mapa (solo cambian al presionar "Buscar")
  // `stagedFilters` = filtros SELECCIONADOS en el panel (pueden cambiar sin afectar el mapa)
  const [filters, setFilters] = useState<HomeFilters>(initialFilters);
  const [stagedFilters, setStagedFilters] = useState<HomeFilters>(initialFilters);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodieLoading, setFoodieLoading] = useState(false);
  const [foodieRecommendation, setFoodieRecommendation] =
    useState<FoodieRecommendation | null>(null);
  const [isFoodieChatOpen, setIsFoodieChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatInputHeight, setChatInputHeight] = useState(42);
  const [chatMessages, setChatMessages] = useState<FoodieChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Soy Foodie AI. Cuéntame qué se te antoja y te recomiendo el mejor restaurante.",
    },
  ]);

  // ============================================================
  // CONEXIÓN CON EL BACKEND APENAS CARGA LA APP (Sprint 1)
  // ------------------------------------------------------------
  // Usamos un "useEffect": Es una función de React que ejecuta nuestro
  // código exactamente una vez cuando la pantalla se muestra por primera vez.
  // En lugar de usar los fijos de mockData.ts, pedimos a Django la lista por internet.
  // ============================================================
  const loadRestaurants = useCallback(async () => {
    try {
      const data = await fetchRestaurantsApi();
      setRestaurants(data.length > 0 ? data : mockRestaurants);
    } catch (error) {
      console.error("Error conectando con Django:", error);
      setRestaurants(mockRestaurants);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refrescar datos cada vez que el usuario vuelve a la pantalla de inicio
  useFocusEffect(
    useCallback(() => {
      loadRestaurants();
    }, [loadRestaurants])
  );

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
        skipResetRef.current = false;
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

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const flattened: any[] = [];

    restaurants.forEach((restaurant) => {
      const name = (restaurant.name || "").toLowerCase();
      const category = (restaurant.category || "").toLowerCase();
      const location = (restaurant.location || "").toLowerCase();

      const directMatch =
        !query ||
        name.includes(query) ||
        category.includes(query) ||
        location.includes(query);

      const semanticMatch = query
        ? semanticCategoryMatches(query, restaurant.category || "")
        : false;

      const searchMatch = directMatch || semanticMatch;

      const categoryMatch =
        !filters.category || restaurant.category === filters.category;

      const ratingMatch =
        !filters.minRating || restaurant.rating >= filters.minRating;

      // Solo procesamos si el restaurante base cumple los filtros de categoría/rating
      if (searchMatch && categoryMatch && ratingMatch) {
        const originLat = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
        const originLon = userLocation?.longitude ?? MEDELLIN_REGION.longitude;

        // 1. Sede Principal
        const distMain = getDistanceKm(originLat, originLon, restaurant.latitude, restaurant.longitude);
        if (!filters.maxDistanceKm || distMain <= filters.maxDistanceKm) {
          flattened.push({
            id: `main-${restaurant.id}`,
            restaurant,
            name: restaurant.name,
            location: restaurant.location,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            distance: distMain,
            isBranch: false,
          });
        }

        // 2. Sedes Adicionales
        (restaurant.branches || []).forEach((branch) => {
          const distBranch = getDistanceKm(originLat, originLon, branch.latitude, branch.longitude);
          if (!filters.maxDistanceKm || distBranch <= filters.maxDistanceKm) {
            flattened.push({
              id: `branch-${branch.id}`,
              restaurant,
              name: `${restaurant.name} (Sede)`,
              location: branch.address,
              latitude: branch.latitude,
              longitude: branch.longitude,
              distance: distBranch,
              isBranch: true,
            });
          }
        });
      }
    });

    return flattened.sort((a, b) => a.distance - b.distance);
  }, [filters, searchQuery, userLocation, restaurants]);

  const filteredRestaurants = useMemo(() => {
    const uniqueMap = new Map();
    searchResults.forEach(item => {
      uniqueMap.set(item.restaurant.id, item.restaurant);
    });
    return Array.from(uniqueMap.values());
  }, [searchResults]);


  const handleSearchSubmit = () => {
    Keyboard.dismiss();

    if (searchResults.length === 0) {
      return;
    }

    if (searchResults.length === 1) {
      const item = searchResults[0];
      mapRef.current?.animateToRegion(
        {
          latitude: item.latitude,
          longitude: item.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700
      );
      return;
    }

    // Solo animamos si hay 2 o más resultados válidos
    if (searchResults.length >= 2) {
      const mapPoints = searchResults.map((item) => ({
        latitude: item.latitude,
        longitude: item.longitude,
      }));
      mapRef.current?.fitToCoordinates(
        mapPoints,
        {
          edgePadding: { top: 160, right: 50, bottom: 60, left: 50 },
          animated: true,
        }
      );
    }
  };

  const handleShowRoute = (restaurant: Restaurant) => {
    Keyboard.dismiss();
    setNavigationState("preview");
    
    const destLat = selectedLocation?.latitude ?? restaurant.latitude;
    const destLon = selectedLocation?.longitude ?? restaurant.longitude;
    
    if (!selectedLocation) {
      setSelectedLocation({ latitude: destLat, longitude: destLon });
    }

    const userLat = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
    const userLon = userLocation?.longitude ?? MEDELLIN_REGION.longitude;

    mapRef.current?.fitToCoordinates(
      [
        { latitude: userLat, longitude: userLon },
        { latitude: destLat, longitude: destLon }
      ],
      {
        edgePadding: { top: 100, right: 100, bottom: 400, left: 100 },
        animated: true,
      }
    );
  };

  const handleStartNavigation = () => {
    setNavigationState("active");
    const userLat = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
    const userLon = userLocation?.longitude ?? MEDELLIN_REGION.longitude;

    // En modo navegación real, el usuario suele estar un poco más abajo del centro
    // para ver más camino adelante. Ajustamos ligeramente la latitud visual.
    mapRef.current?.animateCamera({
      center: { 
        latitude: userLat + 0.001, // Desplazamos la cámara un poco hacia adelante
        longitude: userLon 
      },
      pitch: 60,
      heading: 0,
      altitude: 500,
      zoom: 19,
    }, { duration: 1000 });
  };

  const handleExitNavigation = () => {
    // Primero detenemos cualquier animación de navegación
    const latitude = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
    const longitude = userLocation?.longitude ?? MEDELLIN_REGION.longitude;

    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude, longitude },
        pitch: 0,
        heading: 0,
        altitude: 15000,
        zoom: 13,
      }, { duration: 800 });
    }

    // Limpiamos los estados de navegación
    setNavigationState("discovery");
    setNavigationData(null);
    setSelectedRestaurant(null);
    setSelectedLocation(null);
  };

  const runFoodieSearch = async (question: string): Promise<FoodieRecommendation | null> => {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) return null;

    const fallbackRestaurant = rankLocalFoodieMatch(
      normalizedQuestion,
      restaurants,
      userLocation
    );
    const fallbackRecommendation = fallbackRestaurant
      ? {
          restaurant: fallbackRestaurant,
          explanation: `Te recomiendo ${fallbackRestaurant.name} porque encaja mejor con "${normalizedQuestion}".`,
        }
      : null;

    let recommendation: FoodieRecommendation | null = null;

    try {
      setFoodieLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/foodie-chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: normalizedQuestion,
          latitude: userLocation?.latitude ?? null,
          longitude: userLocation?.longitude ?? null,
          excluded_restaurant_id: foodieRecommendation ? Number(foodieRecommendation.restaurant.id) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo consultar Foodie AI");
      }

      const payload = await response.json();

      if (payload.detail && !payload.restaurant) {
        const assistantText = String(payload.detail);
        setChatMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", text: assistantText },
        ]);
        setFoodieRecommendation(null);
        return null;
      }

      const restaurant = mapApiRestaurant(payload.restaurant);

      recommendation = {
        restaurant,
        explanation: payload.explanation || "Te encontré una recomendación ideal para tu plan.",
      };

      setFoodieRecommendation(recommendation);
      setSelectedRestaurant(restaurant);

      const points = getRestaurantMapPoints(restaurant);
      mapRef.current?.animateToRegion(
        {
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700
      );
    } catch (error) {
      console.error("Error consultando Foodie AI:", error);
      const nearestFallback = rankLocalFoodieMatch(
        normalizedQuestion,
        restaurants,
        userLocation
      );
      recommendation = fallbackRecommendation;
      if (!recommendation && nearestFallback) {
        recommendation = {
          restaurant: nearestFallback,
          explanation: "Tomé una recomendación local basada en tu búsqueda y cercanía.",
        };
      }

      if (recommendation) {
        setFoodieRecommendation(recommendation);
        setSelectedRestaurant(recommendation.restaurant);
        const points = getRestaurantMapPoints(recommendation.restaurant);
        mapRef.current?.animateToRegion(
          {
            latitude: points[0].latitude,
            longitude: points[0].longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          700
        );
      }
    } finally {
      setFoodieLoading(false);
    }

    return recommendation;
  };

  const handleOpenFoodieChat = () => {
    Keyboard.dismiss();
    setIsFoodieChatOpen(true);
  };

  const handleSendFoodieMessage = async () => {
    const question = chatInput.trim();
    if (!question) return;

    setChatMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: question },
    ]);
    setChatInput("");

    const recommendation = await runFoodieSearch(question);
    const assistantText = recommendation
      ? `${recommendation.explanation}\n\nRecomendado: ${recommendation.restaurant.name}`
      : "No encontré una recomendación clara, intenta con más detalles.";

    setChatMessages((prev) => [
      ...prev,
      { id: `a-${Date.now()}`, role: "assistant", text: assistantText },
    ]);
  };

  const clearSearchAndFilters = () => {
    setSelectedRestaurant(null);
    setSelectedLocation(null);
    setFoodieRecommendation(null);
    Keyboard.dismiss();
    setSearchQuery("");
    setFilters(initialFilters);
    setStagedFilters(initialFilters);
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
      <Pressable 
        style={styles.container} 
        onPress={() => {
          if (navigationState === "discovery") {
            setSelectedRestaurant(null);
          }
        }}
      >
        {/* Cuando hay filtros activos, mostramos solo los restaurantes que coincidan.
            Cuando no hay filtros, mostramos TODOS para que ninún pin desaparezca. */}
        <MapView
          ref={mapRef}
          restaurants={
            filters.category || filters.minRating || filters.maxDistanceKm
              ? filteredRestaurants
              : restaurants
          }
          onMarkerPress={(restaurant, location) => {
            if (navigationState === "active") return;
            setSelectedRestaurant(restaurant);
            setSelectedLocation(location || { latitude: restaurant.latitude, longitude: restaurant.longitude });
          }}
          origin={userLocation}
          destination={selectedLocation}
          onDirectionsReady={(result) => {
            setNavigationData({
              distance: result.distance,
              duration: result.duration
            });
          }}
        />
      </Pressable>

      {navigationState === "discovery" && (
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

        <Pressable
          style={[styles.foodieAskButton, foodieLoading && styles.foodieAskButtonDisabled]}
          onPress={handleOpenFoodieChat}
          disabled={foodieLoading}
        >
          <Ionicons name="sparkles" size={16} color="#fff" />
          <Text style={styles.foodieAskButtonText}>
            {foodieLoading ? "Foodie AI está pensando..." : "Preguntarle a Foodie AI"}
          </Text>
        </Pressable>

        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {searchResults.length} {searchResults.length === 1 ? "ubicación" : "ubicaciones"}
          </Text>
          {isAiSearch && <Text style={styles.aiBadge}>AI</Text>}
        </View>

        {searchQuery.trim().length > 0 && searchResults.length > 0 && (
          <View style={styles.searchResultsPanel}>
            <Text style={styles.searchResultsTitle}>Resultados</Text>
            <ScrollView
              style={styles.searchResultsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {searchResults.slice(0, 8).map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.searchResultItem}
                  onPress={() => handleLocationPreviewPress(item)}
                >
                  <View style={styles.searchResultTextWrap}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultMeta}>
                      {item.restaurant.category} · {item.location}
                    </Text>
                  </View>
                  <View style={styles.searchResultRating}>
                    <Ionicons name="star" size={14} color="#FF6B35" />
                    <Text style={styles.searchResultRatingText}>
                      {item.restaurant.rating.toFixed(1)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {foodieRecommendation && (
          <View style={styles.foodieAnswerCard}>
            <Text style={styles.foodieAnswerTitle}>Foodie AI recomienda</Text>
            <Text style={styles.foodieAnswerRestaurant}>
              {foodieRecommendation.restaurant.name}
            </Text>
            <Text style={styles.foodieAnswerText}>{foodieRecommendation.explanation}</Text>
          </View>
        )}

        {showFilters && (
          <View style={styles.filterPanel}>
            <Text style={styles.filterTitle}>Filtros</Text>

            <Text style={styles.filterLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              <Pressable
                style={[styles.chip, !stagedFilters.category && styles.chipActive]}
                onPress={() => setStagedFilters((prev) => ({ ...prev, category: null }))}
              >
                <Text style={[styles.chipText, !stagedFilters.category && styles.chipTextActive]}>Todas</Text>
              </Pressable>

              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={[styles.chip, stagedFilters.category === category && styles.chipActive]}
                  onPress={() =>
                    setStagedFilters((prev) => ({
                      ...prev,
                      category: prev.category === category ? null : category,
                    }))
                  }
                >
                  <Text style={[styles.chipText, stagedFilters.category === category && styles.chipTextActive]}>
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
                  style={[styles.chip, stagedFilters.minRating === value && styles.chipActive]}
                  onPress={() =>
                    setStagedFilters((prev) => ({
                      ...prev,
                      minRating: prev.minRating === value ? null : value,
                    }))
                  }
                >
                  <Text style={[styles.chipText, stagedFilters.minRating === value && styles.chipTextActive]}>
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
                  style={[styles.chip, stagedFilters.maxDistanceKm === value && styles.chipActive]}
                  onPress={() =>
                    setStagedFilters((prev) => ({
                      ...prev,
                      maxDistanceKm: prev.maxDistanceKm === value ? null : value,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      stagedFilters.maxDistanceKm === value && styles.chipTextActive,
                    ]}
                  >
                    {value} km
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* BOTONES DE ACCIÓN DEL FILTRO */}
            <View style={styles.filterActions}>
              <Pressable
                style={styles.filterClearBtn}
                onPress={() => {
                  setStagedFilters(initialFilters);
                  setFilters(initialFilters);
                  setShowFilters(false);
                  mapRef.current?.animateToRegion(MEDELLIN_REGION, 600);
                }}
              >
                <Text style={styles.filterClearText}>Limpiar</Text>
              </Pressable>
              <Pressable
                style={styles.filterApplyBtn}
                onPress={() => {
                  setFilters(stagedFilters);
                  setShowFilters(false);
                  // Si no hay filtros activos, recentrar el mapa
                  const noFilters = !stagedFilters.category && !stagedFilters.minRating && !stagedFilters.maxDistanceKm;
                  if (noFilters) {
                    mapRef.current?.animateToRegion(MEDELLIN_REGION, 600);
                  }
                }}
              >
                <Text style={styles.filterApplyText}>Buscar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    )}

      <Pressable
        style={[
          styles.locationButton,
          navigationState === "active" 
            ? { top: insets.top + 20, right: 20, bottom: undefined } 
            : { bottom: 32, right: 16 }
        ]}
        onPress={() => {
          const latitude = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
          const longitude = userLocation?.longitude ?? MEDELLIN_REGION.longitude;

          if (navigationState === "active") {
            handleStartNavigation(); // Recentra la vista de conducción
          } else {
            mapRef.current?.animateToRegion(
              {
                latitude,
                longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              },
              700
            );
          }
        }}
      >
        <Ionicons 
          name={navigationState === "active" ? "locate" : "navigate"} 
          size={24} 
          color="#FF6B35" 
        />
      </Pressable>

      {selectedRestaurant && navigationState === "discovery" && (
        <View style={styles.cardContainer}>
          <RestaurantCard
            restaurant={selectedRestaurant}
            onClose={() => {
              setSelectedRestaurant(null);
              setSelectedLocation(null);
              setNavigationData(null);
            }}
            onShowRoute={() => handleShowRoute(selectedRestaurant)}
          />
        </View>
      )}

      {/* PREVIEW HUD - LA PRIMERA IMAGEN (TODA LA RUTA) */}
      {selectedRestaurant && selectedLocation && navigationState === "preview" && (
        <View style={[styles.navHud, { bottom: insets.bottom + 20 }]}>
          {!navigationData ? (
            <View style={styles.navLoading}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={styles.navLoadingText}>Trazando ruta...</Text>
            </View>
          ) : (
            <>
              <View style={styles.navInfo}>
                <View>
                  <Text style={styles.navTime}>{Math.round(navigationData.duration)} min</Text>
                  <Text style={styles.navDistance}>{navigationData.distance.toFixed(1)} km</Text>
                </View>
                <View style={styles.navDestWrap}>
                  <Text style={styles.navDestLabel}>Hacia</Text>
                  <Text style={styles.navDestName} numberOfLines={1}>{selectedRestaurant.name}</Text>
                </View>
              </View>

              <View style={styles.navActions}>
                <Pressable style={styles.startNavBtn} onPress={handleStartNavigation}>
                  <Ionicons name="navigate" size={24} color="#fff" />
                  <Text style={styles.startNavText}>Iniciar viaje</Text>
                </Pressable>
                
                <Pressable style={styles.exitNavBtn} onPress={handleExitNavigation}>
                  <Text style={styles.exitNavText}>Cancelar</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* ACTIVE NAVIGATION HUD - LA SEGUNDA IMAGEN (NAVEGANDO) */}
      {selectedRestaurant && navigationData && navigationState === "active" && (
        <View style={[styles.activeNavHud, { bottom: insets.bottom + 20 }]}>
          <View style={styles.activeNavContent}>
             <View style={styles.activeNavStats}>
                <Text style={styles.activeNavTime}>{Math.round(navigationData.duration)} min</Text>
                <Text style={styles.activeNavDistance}>{navigationData.distance.toFixed(1)} km</Text>
             </View>
             
             <Pressable style={styles.activeExitBtn} onPress={handleExitNavigation}>
                <Text style={styles.activeExitText}>Salir</Text>
             </Pressable>
          </View>
        </View>
      )}

      <Modal
        visible={isFoodieChatOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFoodieChatOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.chatOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.chatSheet}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Foodie AI</Text>
              <Pressable onPress={() => setIsFoodieChatOpen(false)}>
                <Ionicons name="close" size={22} color="#2D3436" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.chatMessagesContainer}
              contentContainerStyle={styles.chatMessagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {chatMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.chatBubble,
                    message.role === "assistant" ? styles.chatBubbleAssistant : styles.chatBubbleUser,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatBubbleText,
                      message.role === "assistant"
                        ? styles.chatBubbleTextAssistant
                        : styles.chatBubbleTextUser,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View
              style={[
                styles.chatComposer,
                Platform.OS === "ios" ? { paddingBottom: 18 } : null,
              ]}
            >
              <TextInput
                style={[styles.chatInput, { height: Math.max(42, chatInputHeight) }]}
                placeholder="Ej: Quiero pizza para parche"
                placeholderTextColor="#B2BEC3"
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={handleSendFoodieMessage}
                returnKeyType="send"
                autoFocus
                multiline
                blurOnSubmit={false}
                onContentSizeChange={(event) => {
                  const height = Math.min(110, Math.max(42, event.nativeEvent.contentSize.height));
                  setChatInputHeight(height);
                }}
              />
              <Pressable
                style={[styles.chatSendBtn, (!chatInput.trim() || foodieLoading) && styles.chatSendBtnDisabled]}
                disabled={!chatInput.trim() || foodieLoading}
                onPress={handleSendFoodieMessage}
              >
                <Ionicons name="send" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  exitNavText: {
    color: "#FF6B35",
    fontWeight: "700",
    fontSize: 16,
  },
  // NAVEGACIÓN HUD
  navHud: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  navInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    paddingBottom: 15,
  },
  navTime: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2D3436",
  },
  navDistance: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "600",
  },
  navDestWrap: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: 20,
  },
  navDestLabel: {
    fontSize: 12,
    color: "#B2BEC3",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  navDestName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B35",
  },
  navLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 12,
  },
  navLoadingText: {
    fontSize: 16,
    color: "#636E72",
    fontWeight: "500",
  },
  navActions: {
    flexDirection: "row",
    gap: 12,
  },
  startNavBtn: {
    flex: 2,
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
  },
  startNavText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  exitNavBtn: {
    flex: 1,
    backgroundColor: "#FFF1EC",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
  },
  exitNavBtnSmall: {
    backgroundColor: "#FAB1A0",
  },
  navProgress: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F2F6",
    borderRadius: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  navProgressPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00B894",
  },
  navProgressText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3436",
  },
  // ACTIVE NAV HUD (GOOGLE MAPS STYLE)
  activeNavHud: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 40,
    paddingHorizontal: 25,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  activeNavContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeNavStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  activeNavTime: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2D3436",
  },
  activeNavDistance: {
    fontSize: 18,
    color: "#636E72",
    fontWeight: "600",
  },
  activeExitBtn: {
    backgroundColor: "#FF4757",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  activeExitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
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
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 16,
  },
  filterClearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DFE6E9",
    alignItems: "center",
  },
  filterClearText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636E72",
  },
  filterApplyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    alignItems: "center",
  },
  filterApplyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  foodieAskButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#2D3436",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  foodieAskButtonDisabled: {
    opacity: 0.65,
  },
  foodieAskButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  foodieAnswerCard: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFE5D8",
    padding: 12,
  },
  foodieAnswerTitle: {
    color: "#D35400",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  foodieAnswerRestaurant: {
    color: "#2D3436",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  foodieAnswerText: {
    color: "#636E72",
    fontSize: 13,
    lineHeight: 18,
  },
  searchResultsPanel: {
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
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 8,
  },
  searchResultsList: {
    maxHeight: 210,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
    gap: 10,
  },
  searchResultTextWrap: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D3436",
  },
  searchResultMeta: {
    fontSize: 12,
    color: "#636E72",
    marginTop: 2,
  },
  searchResultRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchResultRatingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D3436",
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  chatSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: "55%",
    maxHeight: "82%",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F6",
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2D3436",
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  chatBubble: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: "88%",
  },
  chatBubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#F6F7FB",
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#2D3436",
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatBubbleTextAssistant: {
    color: "#2D3436",
  },
  chatBubbleTextUser: {
    color: "#fff",
  },
  chatComposer: {
    borderTopWidth: 1,
    borderTopColor: "#F1F2F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DFE6E9",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2D3436",
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  chatSendBtnDisabled: {
    opacity: 0.5,
  },
});
