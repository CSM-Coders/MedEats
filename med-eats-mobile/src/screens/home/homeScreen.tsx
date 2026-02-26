import { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapViewComponent from "react-native-maps";
import MapView from "./components/mapView";
import RestaurantCard from "./components/restaurantCard";
import { restaurants, Restaurant, MEDELLIN_REGION } from "./mocks";
import { useUserLocation } from "@/src/hooks/useUserLocation";

export default function HomeScreen() {
  // ============================================================
  // Estado (state) del componente
  // ============================================================
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // useRef: crea una referencia al componente del mapa
  // Es como guardar un "control remoto" del mapa para poder
  // decirle "muévete aquí" más adelante
  const mapRef = useRef<MapViewComponent>(null);

  const insets = useSafeAreaInsets();

  // ============================================================
  // Ubicación del usuario: pide permisos y obtiene coordenadas GPS
  // ============================================================
  const { location: userLocation } = useUserLocation();

  // ============================================================
  // useMemo: filtra los restaurantes cada vez que searchQuery cambia
  // ============================================================
  // Devuelve solo los restaurantes que coinciden con la búsqueda.
  // Se usa para el zoom del mapa y el contador de resultados.
  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) {
      return restaurants;
    }

    const query = searchQuery.toLowerCase().trim();

    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // ============================================================
  // Funciones
  // ============================================================

  // Cuando el usuario ESCRIBE en la barra de búsqueda
  const handleSearchChange = (text: string) => {
    setSelectedRestaurant(null);

    const wasSearching = searchQuery.trim().length > 0;
    const isNowEmpty = !text.trim();

    setSearchQuery(text);

    // Si el usuario borró todo el texto, animamos el mapa de vuelta a Medellín
    if (wasSearching && isNowEmpty) {
      try {
        mapRef.current?.animateToRegion(MEDELLIN_REGION, 500);
      } catch {}
    }
  };

  // Cuando el usuario da ENTER en el teclado
  // Aquí sí movemos el mapa hacia los resultados
  const handleSearchSubmit = () => {
    Keyboard.dismiss();

    if (!searchQuery.trim()) {
      try {
        mapRef.current?.animateToRegion(MEDELLIN_REGION, 800);
      } catch {}
      return;
    }

    // Usamos filteredRestaurants que ya fue calculado por useMemo
    if (filteredRestaurants.length === 0) return;

    // setTimeout: esperamos un momento para que React termine de
    // actualizar los marcadores en el mapa antes de animarlo.
    // Sin esto, el mapa puede crashear si intenta animar mientras
    // los marcadores están cambiando.
    setTimeout(() => {
      try {
        if (filteredRestaurants.length === 1) {
          mapRef.current?.animateToRegion(
            {
              latitude: filteredRestaurants[0].latitude,
              longitude: filteredRestaurants[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            800
          );
        } else {
          mapRef.current?.fitToCoordinates(
            filteredRestaurants.map((r) => ({
              latitude: r.latitude,
              longitude: r.longitude,
            })),
            {
              edgePadding: { top: 150, right: 50, bottom: 50, left: 50 },
              animated: true,
            }
          );
        }
      } catch {
        // Silenciamos errores de animación del mapa nativo
      }
    }, 100);
  };

  // Cuando el usuario toca la X para limpiar la búsqueda
  const handleClearSearch = () => {
    setSelectedRestaurant(null);
    Keyboard.dismiss();
    setSearchQuery("");

    try {
      mapRef.current?.animateToRegion(MEDELLIN_REGION, 500);
    } catch {}
  };

  // Cuando el usuario toca un marcador en el mapa
  const handleMarkerPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  // Cuando el usuario toca el mapa (fuera de un marcador)
  const handleMapPress = () => {
    setSelectedRestaurant(null);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* ====== CAPA 1: El mapa (ocupa toda la pantalla) ====== */}
      {/* Siempre mostramos todos los restaurantes en el mapa */}
      <Pressable style={styles.container} onPress={handleMapPress}>
        <MapView
          ref={mapRef}
          restaurants={restaurants}
          onMarkerPress={handleMarkerPress}
        />
      </Pressable>

      {/* ====== CAPA 2: Barra de búsqueda ====== */}
      <View style={[styles.searchContainer, { top: insets.top + 8 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants or food (e.g. burgers, su..."
            placeholderTextColor="#B2BEC3"
            value={searchQuery}
            onChangeText={handleSearchChange}
            // onSubmitEditing: se ejecuta cuando el usuario presiona Enter/Search
            onSubmitEditing={handleSearchSubmit}
            // returnKeyType: cambia el botón del teclado de "return" a "search"
            returnKeyType="search"
          />
          {/* Botón X para limpiar — solo aparece si hay texto escrito */}
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#B2BEC3" />
            </Pressable>
          )}
        </View>

        {/* Contador de resultados — solo aparece durante una búsqueda */}
        {searchQuery.length > 0 && (
          <View style={styles.resultsCount}>
            <Text style={styles.resultsText}>
              {filteredRestaurants.length === 0
                ? "No se encontraron restaurantes"
                : `${filteredRestaurants.length} restaurante${filteredRestaurants.length !== 1 ? "s" : ""} encontrado${filteredRestaurants.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        )}
      </View>

      {/* ====== CAPA 3: Etiqueta "Restaurante" ====== */}
      <View style={[styles.tagContainer, { top: insets.top + 64 }]}>
        <View style={styles.tag}>
          <View style={styles.tagDot} />
          <Text style={styles.tagText}>Restaurante</Text>
        </View>
      </View>

      {/* ====== CAPA 4: Botón de ubicación ====== */}
      {/* Al tocar, centra el mapa en la ubicación actual del usuario */}
      <Pressable
        style={styles.locationButton}
        onPress={() => {
          try {
            if (userLocation) {
              // Si tenemos ubicación del usuario, centramos en él
              mapRef.current?.animateToRegion(
                {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.01,   // Zoom cercano para ver alrededores
                  longitudeDelta: 0.01,
                },
                800
              );
            } else {
              // Si no hay ubicación (permisos denegados), vamos a Medellín
              mapRef.current?.animateToRegion(MEDELLIN_REGION, 800);
            }
          } catch {}
        }}
      >
        <Ionicons name="navigate" size={22} color="#FF6B35" />
      </Pressable>

      {/* ====== CAPA 5: Tarjeta del restaurante ====== */}
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

  // ---------- Barra de búsqueda ----------
  searchContainer: {
    position: "absolute",       // Flota sobre el mapa
    left: 16,
    right: 16,
    zIndex: 10,                 // Se asegura de estar encima del mapa
  },
  searchBar: {
    flexDirection: "row",       // Icono y texto en fila
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#2D3436",
  },
  resultsCount: {
    marginTop: 8,
    backgroundColor: "#2D3436",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",     // Solo tan ancho como el texto
  },
  resultsText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },

  // ---------- Etiqueta "Restaurante" ----------
  tagContainer: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,            // Círculo perfecto
    backgroundColor: "#FF6B35",
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3436",
  },

  // ---------- Botón de ubicación ----------
  locationButton: {
    position: "absolute",
    bottom: 32,
    right: 16,
    backgroundColor: "#fff",
    width: 48,
    height: 48,
    borderRadius: 24,           // Círculo
    alignItems: "center",
    justifyContent: "center",
    // Sombra
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  // ---------- Tarjeta de restaurante ----------
  cardContainer: {
    position: "absolute",
    bottom: 32,
    left: 24,
    right: 24,
    zIndex: 20,
  },
});
