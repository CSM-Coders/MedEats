import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Restaurant } from "@/src/models/domain";
import { colors, radii, spacing } from "@/src/theme/designTokens";

// ============================================================
// Props: recibe un restaurante completo y una función para cerrar
// ============================================================
type Props = {
  restaurant: Restaurant;
  onClose: () => void;
  onShowRoute: () => void;
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
          color={colors.primary}
        />
      ))}
      <Text style={styles.ratingText}>{rating}</Text>
    </View>
  );
}

export default function RestaurantCard({ restaurant, onClose, onShowRoute }: Props) {
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

        <View style={styles.buttonGroup}>
          {/* Botón "Ver Detalles" — navega a la pantalla del restaurante */}
          <Pressable
            style={styles.detailsButton}
            onPress={() => {
              router.push(`/restaurant/${restaurant.id}`);
            }}
          >
            <Text style={styles.detailsButtonText}>Ver Detalles</Text>
          </Pressable>

          {/* Botón "Cómo llegar" — abre mapas externos */}
          <Pressable
            style={styles.navigationButton}
            onPress={onShowRoute}
          >
            <Ionicons name="navigate-circle" size={20} color={colors.background} />
            <Text style={styles.navigationButtonText}>Cómo llegar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
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
    padding: spacing.lg,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  starsRow: {
    flexDirection: "row",           // Los elementos van en fila horizontal
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  ratingText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  category: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  buttonGroup: {
    gap: spacing.sm,                         // Espacio entre los dos botones
  },
  detailsButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    alignItems: "center",
  },
  detailsButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  navigationButton: {
    backgroundColor: colors.darkSurface,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  navigationButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
});

