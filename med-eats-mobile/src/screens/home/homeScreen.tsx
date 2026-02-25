import { useState } from "react";
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
import MapView from "./components/mapView";
import RestaurantCard from "./components/restaurantCard";
import { restaurants, Restaurant } from "./mocks";

export default function HomeScreen() {
  // ============================================================
  // Estado (state) del componente
  // ============================================================
  // selectedRestaurant: guarda el restaurante seleccionado al tocar un marcador
  // null = ninguno seleccionado, la tarjeta no se muestra
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // searchQuery: texto que el usuario escribe en la barra de búsqueda
  const [searchQuery, setSearchQuery] = useState("");

  // useSafeAreaInsets: nos da los márgenes del notch/isla dinámica del teléfono
  // para que nada quede tapado por la barra de estado
  const insets = useSafeAreaInsets();

  // ============================================================
  // Funciones
  // ============================================================

  // Cuando el usuario toca un marcador en el mapa
  const handleMarkerPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  // Cuando el usuario toca el mapa (fuera de un marcador), cerramos la tarjeta
  const handleMapPress = () => {
    setSelectedRestaurant(null);
    Keyboard.dismiss(); // También cerramos el teclado si está abierto
  };

  return (
    <View style={styles.container}>
      {/* ====== CAPA 1: El mapa (ocupa toda la pantalla) ====== */}
      <Pressable style={styles.container} onPress={handleMapPress}>
        <MapView
          restaurants={restaurants}
          onMarkerPress={handleMarkerPress}
        />
      </Pressable>

      {/* ====== CAPA 2: Barra de búsqueda (encima del mapa) ====== */}
      {/* Usamos position: absolute para ponerlo encima del mapa */}
      <View style={[styles.searchContainer, { top: insets.top + 8 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#636E72" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants or food (e.g. burgers, su..."
            placeholderTextColor="#B2BEC3"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ====== CAPA 3: Etiqueta "Restaurante" ====== */}
      <View style={[styles.tagContainer, { top: insets.top + 64 }]}>
        <View style={styles.tag}>
          <View style={styles.tagDot} />
          <Text style={styles.tagText}>Restaurante</Text>
        </View>
      </View>

      {/* ====== CAPA 4: Botón de ubicación (esquina inferior derecha) ====== */}
      <Pressable style={styles.locationButton}>
        <Ionicons name="navigate" size={22} color="#FF6B35" />
      </Pressable>

      {/* ====== CAPA 5: Tarjeta del restaurante (solo si hay uno seleccionado) ====== */}
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
