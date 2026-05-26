// ============================================================
// HOME SCREEN
// ------------------------------------------------------------
// Pantalla principal de descubrimiento:
// - mapa con marcadores
// - búsqueda por texto
// - búsqueda semántica básica (AI-like)
// - filtros por categoría, rating y distancia
//
// [P2-5] La lógica de mapa, fetching de restaurantes y chat con Foodie
// vive ahora en hooks dedicados (useMapNavigation, useRestaurants,
// useFoodieChat). Este componente solo se encarga de:
//   - estado local de búsqueda / filtros / inputs
//   - composición JSX
//   - coordinar el flujo entre los hooks (ej. al recibir una
//     recomendación de Foodie, seleccionar el restaurante en el mapa)
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { HomeFilters, Restaurant } from "@/src/models/domain";
import { useUserLocation } from "@/src/hooks/useUserLocation";
import {
  getDistanceKm,
  MEDELLIN_REGION,
  semanticCategoryMatches,
} from "../../services/mockData";
import MapView from "./components/mapView";
import RestaurantCard from "./components/restaurantCard";
import { colors, radii, spacing } from "../../theme/designTokens";
// [P2-5] Helpers puros + hooks extraídos
import { getRestaurantMapPoints } from "./utils/foodieMatching";
import { useRestaurants } from "./hooks/useRestaurants";
import { useMapNavigation } from "./hooks/useMapNavigation";
import { useFoodieChat } from "./hooks/useFoodieChat";

const initialFilters: HomeFilters = {
  category: null,
  minRating: null,
  maxDistanceKm: null,
};

export default function HomeScreen() {
  // Estado local que no cubren los hooks (búsqueda, filtros, inputs del chat)
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<HomeFilters>(initialFilters);
  const [stagedFilters, setStagedFilters] = useState<HomeFilters>(initialFilters);
  const [chatInput, setChatInput] = useState("");
  const [chatInputHeight, setChatInputHeight] = useState(42);

  const insets = useSafeAreaInsets();
  const { location: userLocation } = useUserLocation();

  // [P2-5] Hook: mapa + selección + estado de navegación
  const mapNav = useMapNavigation(userLocation);

  // [P2-5] Hook: fetching y caché en memoria de los restaurantes.
  // Los argumentos se pasan vacíos porque homeScreen aplica un filtrado más
  // rico (con sedes y distancia) y usa solo `restaurants` y `loading`.
  const { restaurants, loading, reload } = useRestaurants(initialFilters, "");

  // [P2-5] Hook: chat con Foodie AI + recomendación
  const foodieChat = useFoodieChat(restaurants, userLocation);

  // Refrescar datos cada vez que el usuario vuelve a la pantalla de inicio
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
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
        mapNav.resetCamera();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const isRestaurantCardOpen = Boolean(
    mapNav.selectedRestaurant && mapNav.navigationState === "discovery"
  );

  const categories = useMemo(
    () => [
      ...new Set(
        restaurants
          .filter((r) => r && r.category)
          .map((restaurant) => restaurant.category)
      ),
    ],
    [restaurants]
  );

  const isAiSearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return false;
    }

    return restaurants.some((restaurant) =>
      semanticCategoryMatches(searchQuery, restaurant.category)
    );
  }, [searchQuery, restaurants]);

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const flattened: any[] = [];

    restaurants
      .filter((r) => r && r.id)
      .forEach((restaurant) => {
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

        if (searchMatch && categoryMatch && ratingMatch) {
          const originLat = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
          const originLon = userLocation?.longitude ?? MEDELLIN_REGION.longitude;

          // 1. Sede principal
          const distMain = getDistanceKm(
            originLat,
            originLon,
            restaurant.latitude,
            restaurant.longitude
          );
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

          // 2. Sedes adicionales
          (restaurant.branches || []).forEach((branch) => {
            const distBranch = getDistanceKm(
              originLat,
              originLon,
              branch.latitude,
              branch.longitude
            );
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
    searchResults.forEach((item) => {
      uniqueMap.set(item.restaurant.id, item.restaurant);
    });
    return Array.from(uniqueMap.values());
  }, [searchResults]);

  const handleSearchSubmit = () => {
    if (mapNav.selectedRestaurant) return;
    Keyboard.dismiss();

    if (searchResults.length === 0) {
      return;
    }

    const item = searchResults[0];
    skipResetRef.current = true;
    mapNav.setSelectedRestaurant(item.restaurant);
    mapNav.setSelectedLocation({ latitude: item.latitude, longitude: item.longitude });
    mapNav.setNavigationData(null);
    setShowFilters(false);
    setSearchQuery("");

    mapNav.focusOnMap(item.latitude, item.longitude);
  };

  const handleShowRoute = (restaurant: Restaurant) => {
    Keyboard.dismiss();
    mapNav.setNavigationState("preview");

    const destLat = mapNav.selectedLocation?.latitude ?? restaurant.latitude;
    const destLon = mapNav.selectedLocation?.longitude ?? restaurant.longitude;

    if (!mapNav.selectedLocation) {
      mapNav.setSelectedLocation({ latitude: destLat, longitude: destLon });
    }

    mapNav.fitRouteOnMap(destLat, destLon);
  };

  const handleLocationPreviewPress = (item: any) => {
    if (mapNav.selectedRestaurant) return;
    Keyboard.dismiss();
    skipResetRef.current = true;
    mapNav.setSelectedRestaurant(item.restaurant);
    mapNav.setSelectedLocation({ latitude: item.latitude, longitude: item.longitude });
    mapNav.setNavigationState("discovery");
    mapNav.setNavigationData(null);
    setShowFilters(false);
    setSearchQuery("");

    mapNav.focusOnMap(item.latitude, item.longitude);
  };

  // Orquestación: chat → selección + animación de cámara
  const runFoodieSearch = async (question: string) => {
    const recommendation = await foodieChat.ask(question);
    if (recommendation) {
      mapNav.setSelectedRestaurant(recommendation.restaurant);
      const points = getRestaurantMapPoints(recommendation.restaurant);
      mapNav.mapRef.current?.animateToRegion(
        {
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        700
      );
    }
    return recommendation;
  };

  const handleOpenFoodieChat = () => {
    Keyboard.dismiss();
    foodieChat.setIsOpen(true);
  };

  const handleSendFoodieMessage = async () => {
    const question = chatInput.trim();
    if (!question) return;

    foodieChat.setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: question },
    ]);
    setChatInput("");

    const recommendation = await runFoodieSearch(question);
    const assistantText = recommendation
      ? `${recommendation.explanation}\n\nRecomendado: ${recommendation.restaurant.name}`
      : "No encontré una recomendación clara, intenta con más detalles.";

    foodieChat.setMessages((prev) => [
      ...prev,
      { id: `a-${Date.now()}`, role: "assistant", text: assistantText },
    ]);
  };

  const clearSearchAndFilters = () => {
    mapNav.setSelectedRestaurant(null);
    mapNav.setSelectedLocation(null);
    foodieChat.setRecommendation(null);
    Keyboard.dismiss();
    setSearchQuery("");
    setFilters(initialFilters);
    setStagedFilters(initialFilters);
    setShowFilters(false);

    setTimeout(() => {
      mapNav.resetCamera();
    }, 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>
          Cargando restaurantes desde PostgreSQL...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.container}
        onPress={() => {
          if (mapNav.navigationState === "discovery") {
            mapNav.setSelectedRestaurant(null);
          }
        }}
      >
        {/* Cuando hay filtros activos, mostramos solo los restaurantes que coincidan.
            Cuando no hay filtros, mostramos TODOS para que ninún pin desaparezca. */}
        <MapView
          ref={mapNav.mapRef}
          restaurants={
            filters.category || filters.minRating || filters.maxDistanceKm
              ? filteredRestaurants
              : restaurants
          }
          selectedMarker={{
            restaurantId: mapNav.selectedRestaurant?.id ?? null,
            latitude: mapNav.selectedLocation?.latitude ?? null,
            longitude: mapNav.selectedLocation?.longitude ?? null,
          }}
          onMarkerPress={(restaurant, location) => {
            if (mapNav.navigationState === "active" || isRestaurantCardOpen) return;
            mapNav.setSelectedRestaurant(restaurant);
            const focusLocation =
              location || { latitude: restaurant.latitude, longitude: restaurant.longitude };
            mapNav.setSelectedLocation(focusLocation);
            mapNav.focusOnMap(focusLocation.latitude, focusLocation.longitude);
          }}
          origin={userLocation}
          destination={mapNav.navigationState !== "discovery" ? mapNav.selectedLocation : null}
          onDirectionsReady={(result) => {
            mapNav.setNavigationData({
              distance: result.distance,
              duration: result.duration,
            });
          }}
        />
      </Pressable>

      {mapNav.navigationState === "discovery" && (
        <View style={[styles.searchContainer, { top: insets.top + 8 }]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or food type"
              placeholderTextColor={colors.placeholder}
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
              <Ionicons name="options-outline" size={20} color={colors.textMuted} />
            </Pressable>

            {(searchQuery.length > 0 ||
              filters.category ||
              filters.minRating ||
              filters.maxDistanceKm) && (
              <Pressable onPress={clearSearchAndFilters} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.placeholder} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.foodieAskButton, foodieChat.loading && styles.foodieAskButtonDisabled]}
            onPress={handleOpenFoodieChat}
            disabled={foodieChat.loading}
          >
            <Ionicons name="sparkles" size={16} color={colors.background} />
            <Text style={styles.foodieAskButtonText}>
              {foodieChat.loading ? "Foodie AI está pensando..." : "Preguntarle a Foodie AI"}
            </Text>
          </Pressable>

          {searchQuery.trim().length > 0 && searchResults.length > 0 && (
            <View style={styles.resultsCount}>
              <Text style={styles.resultsText}>
                {searchResults.length} {searchResults.length === 1 ? "ubicación" : "ubicaciones"}
              </Text>
              {isAiSearch && <Text style={styles.aiBadge}>AI</Text>}
            </View>
          )}

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
                      <Ionicons name="star" size={14} color={colors.primary} />
                      <Text style={styles.searchResultRatingText}>
                        {item.restaurant.rating.toFixed(1)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {foodieChat.recommendation && (
            <View style={styles.foodieAnswerCard}>
              <Pressable
                onPress={() => foodieChat.setRecommendation(null)}
                style={styles.foodieAnswerClose}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
              <Text style={styles.foodieAnswerTitle}>Foodie AI recomienda</Text>
              <Text style={styles.foodieAnswerRestaurant}>
                {foodieChat.recommendation.restaurant.name}
              </Text>
              <Text style={styles.foodieAnswerText}>{foodieChat.recommendation.explanation}</Text>
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
                  <Text style={[styles.chipText, !stagedFilters.category && styles.chipTextActive]}>
                    Todas
                  </Text>
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
                    <Text
                      style={[
                        styles.chipText,
                        stagedFilters.category === category && styles.chipTextActive,
                      ]}
                    >
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
                    <Text
                      style={[
                        styles.chipText,
                        stagedFilters.minRating === value && styles.chipTextActive,
                      ]}
                    >
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

              {/* Botones de acción del filtro */}
              <View style={styles.filterActions}>
                <Pressable
                  style={styles.filterClearBtn}
                  onPress={() => {
                    setStagedFilters(initialFilters);
                    setFilters(initialFilters);
                    setShowFilters(false);
                    setTimeout(() => {
                      mapNav.resetCamera();
                    }, 100);
                  }}
                >
                  <Text style={styles.filterClearText}>Limpiar</Text>
                </Pressable>
                <Pressable
                  style={styles.filterApplyBtn}
                  onPress={() => {
                    setFilters(stagedFilters);
                    setShowFilters(false);
                    const noFilters =
                      !stagedFilters.category &&
                      !stagedFilters.minRating &&
                      !stagedFilters.maxDistanceKm;
                    if (noFilters) {
                      setTimeout(() => {
                        mapNav.resetCamera();
                      }, 100);
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
          mapNav.navigationState === "active"
            ? { top: insets.top + 20, right: 20, bottom: undefined }
            : { bottom: 32, right: 16 },
        ]}
        onPress={() => {
          const latitude = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
          const longitude = userLocation?.longitude ?? MEDELLIN_REGION.longitude;

          if (mapNav.navigationState === "active") {
            mapNav.startNavigation();
          } else {
            mapNav.mapRef.current?.animateToRegion(
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
          name={mapNav.navigationState === "active" ? "locate" : "navigate"}
          size={24}
          color={colors.primary}
        />
      </Pressable>

      {mapNav.selectedRestaurant && mapNav.navigationState === "discovery" && (
        <View style={styles.cardContainer}>
          <RestaurantCard
            restaurant={mapNav.selectedRestaurant}
            onClose={() => {
              mapNav.setSelectedRestaurant(null);
              mapNav.setSelectedLocation(null);
              mapNav.setNavigationData(null);
            }}
            onShowRoute={() => handleShowRoute(mapNav.selectedRestaurant!)}
          />
        </View>
      )}

      {/* PREVIEW HUD - LA PRIMERA IMAGEN (TODA LA RUTA) */}
      {mapNav.selectedRestaurant && mapNav.selectedLocation && mapNav.navigationState === "preview" && (
        <View style={[styles.navHud, { bottom: insets.bottom + 20 }]}>
          {!mapNav.navigationData ? (
            <View style={styles.navLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.navLoadingText}>Trazando ruta...</Text>
            </View>
          ) : (
            <>
              <View style={styles.navInfo}>
                <View>
                  <Text style={styles.navTime}>{Math.round(mapNav.navigationData.duration)} min</Text>
                  <Text style={styles.navDistance}>{mapNav.navigationData.distance.toFixed(1)} km</Text>
                </View>
                <View style={styles.navDestWrap}>
                  <Text style={styles.navDestLabel}>Hacia</Text>
                  <Text style={styles.navDestName} numberOfLines={1}>
                    {mapNav.selectedRestaurant.name}
                  </Text>
                </View>
              </View>

              <View style={styles.navActions}>
                <Pressable style={styles.startNavBtn} onPress={mapNav.startNavigation}>
                  <Ionicons name="navigate" size={24} color={colors.background} />
                  <Text style={styles.startNavText}>Iniciar viaje</Text>
                </Pressable>

                <Pressable style={styles.exitNavBtn} onPress={mapNav.exitNavigation}>
                  <Text style={styles.exitNavText}>Cancelar</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* ACTIVE NAVIGATION HUD - LA SEGUNDA IMAGEN (NAVEGANDO) */}
      {mapNav.selectedRestaurant && mapNav.navigationData && mapNav.navigationState === "active" && (
        <View style={[styles.activeNavHud, { bottom: insets.bottom + 20 }]}>
          <View style={styles.activeNavContent}>
            <View style={styles.activeNavStats}>
              <Text style={styles.activeNavTime}>{Math.round(mapNav.navigationData.duration)} min</Text>
              <Text style={styles.activeNavDistance}>{mapNav.navigationData.distance.toFixed(1)} km</Text>
            </View>

            <Pressable style={styles.activeExitBtn} onPress={mapNav.exitNavigation}>
              <Text style={styles.activeExitText}>Salir</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Modal
        visible={foodieChat.isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => foodieChat.setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.chatOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.chatSheet}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Foodie AI</Text>
              <Pressable onPress={() => foodieChat.setIsOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.chatMessagesContainer}
              contentContainerStyle={styles.chatMessagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {foodieChat.messages.map((message) => (
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
                placeholderTextColor={colors.placeholder}
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
                style={[
                  styles.chatSendBtn,
                  (!chatInput.trim() || foodieChat.loading) && styles.chatSendBtnDisabled,
                ]}
                disabled={!chatInput.trim() || foodieChat.loading}
                onPress={handleSendFoodieMessage}
              >
                <Ionicons name="send" size={16} color={colors.background} />
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
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radii.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  iconButton: {
    paddingHorizontal: 4,
  },
  resultsCount: {
    marginTop: spacing.sm,
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.lg,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  resultsText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "500",
  },
  aiBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: colors.background,
    borderRadius: radii.sm + 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  filterPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chipsRow: {
    flexGrow: 0,
  },
  inlineRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginRight: spacing.sm,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  exitNavText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  navHud: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: radii.xl + 4,
    padding: spacing.xl,
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
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.lg,
  },
  navTime: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  navDistance: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "600",
  },
  navDestWrap: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: spacing.xl,
  },
  navDestLabel: {
    fontSize: 12,
    color: colors.placeholder,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  navDestName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  navLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  navLoadingText: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
  },
  navActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  startNavBtn: {
    flex: 2,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  startNavText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: "800",
  },
  exitNavBtn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: radii.lg,
  },
  exitNavBtnSmall: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  navProgress: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  navProgressPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  navProgressText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  activeNavHud: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: radii.round,
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
    color: colors.text,
  },
  activeNavDistance: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: "600",
  },
  activeExitBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: radii.round,
  },
  activeExitText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 15,
  },
  locationButton: {
    position: "absolute",
    bottom: 32,
    right: 16,
    backgroundColor: colors.background,
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
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 20,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  filterClearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    alignItems: "center",
  },
  filterClearText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  filterApplyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  filterApplyText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.background,
  },
  foodieAskButton: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.text,
    borderRadius: radii.lg + 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  foodieAskButtonDisabled: {
    opacity: 0.65,
  },
  foodieAskButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "700",
  },
  foodieAnswerCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
    padding: spacing.md,
    position: "relative",
  },
  foodieAnswerClose: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 5,
    padding: 4,
  },
  foodieAnswerTitle: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  foodieAnswerRestaurant: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  foodieAnswerText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  searchResultsPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchResultsList: {
    maxHeight: 210,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  searchResultTextWrap: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  searchResultMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchResultRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  searchResultRatingText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  chatSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    minHeight: "55%",
    maxHeight: "82%",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatMessagesContent: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chatBubble: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    maxWidth: "88%",
  },
  chatBubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: colors.text,
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatBubbleTextAssistant: {
    color: colors.text,
  },
  chatBubbleTextUser: {
    color: colors.background,
  },
  chatComposer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
    color: colors.text,
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  chatSendBtnDisabled: {
    opacity: 0.5,
  },
});
