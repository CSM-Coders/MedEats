import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Restaurant } from "../mocks";

// ============================================================
// Props: recibe un restaurante completo y una función para cerrar
// ============================================================
type Props = {
  restaurant: Restaurant;
  onClose: () => void;
};

// Función helper para renderizar las estrellas de rating
function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);     // Estrellas llenas (4.9 → 4)
  const hasHalf = rating - fullStars >= 0.5; // ¿Hay media estrella?

  return (
    <View style={styles.starsRow}>
      {/* Creamos un array de 5 posiciones y renderizamos cada estrella */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={
            i <= fullStars
              ? "star"           // Estrella llena
              : i === fullStars + 1 && hasHalf
              ? "star-half"      // Media estrella
              : "star-outline"   // Estrella vacía
          }
          size={16}
          color="#FF6B35"
        />
      ))}
      <Text style={styles.ratingText}>{rating}</Text>
    </View>
  );
}

export default function RestaurantCard({ restaurant, onClose }: Props) {
  return (
    <View style={styles.card}>
      {/* Imagen del restaurante */}
      <Image
        source={{ uri: restaurant.image }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Información del restaurante */}
      <View style={styles.info}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <RatingStars rating={restaurant.rating} />
        <Text style={styles.category}>{restaurant.category}</Text>

        {/* Botón "Ver Detalles" — navega a la pantalla del restaurante */}
        <Pressable
          style={styles.detailsButton}
          onPress={() => {
            onClose(); // Cerramos la tarjeta primero
            router.push(`/restaurant/${restaurant.id}`);
          }}
        >
          <Text style={styles.detailsButtonText}>Ver Detalles</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",             // Para que la imagen respete el borderRadius
    // Sombras para darle elevación (como en el mockup)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,                   // Sombra en Android
  },
  image: {
    width: "100%",
    height: 150,
  },
  info: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D3436",
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: "row",           // Los elementos van en fila horizontal
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3436",
  },
  category: {
    fontSize: 14,
    color: "#636E72",
    marginBottom: 12,
  },
  detailsButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 12,
    borderRadius: 24,               // Muy redondeado como en el mockup
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
