// ============================================================
// RUTA DINÁMICA /restaurant/[id]
// ------------------------------------------------------------
// Esta ruta recibe el id numérico del restaurante desde el mapa,
// hace un Fetch individual a Django y renderiza el detalle.
// ============================================================

import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import RestaurantDetailScreen from "@/src/screens/restaurant/restaurantDetailScreen";
import { Restaurant } from "@/src/models/domain";
import { fetchRestaurantById } from "@/src/services/restaurantApi";

import { colors } from "@/src/theme/designTokens";

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const restaurantId = Array.isArray(id) ? id[0] : id;
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isActive = true;
    const currentRequestId = ++requestIdRef.current;

    const fetchRestaurantDetail = async () => {
      setLoading(true);
      setRestaurant(null);

      if (!restaurantId) {
        if (isActive && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
        return;
      }

      try {
        const transformed = await fetchRestaurantById(String(restaurantId));

        if (!isActive || currentRequestId !== requestIdRef.current) {
          return;
        }

        setRestaurant(transformed);
      } catch (error) {
        if (isActive && currentRequestId === requestIdRef.current) {
          console.error("Error fetching detail:", error);
        }
      } finally {
        if (isActive && currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchRestaurantDetail();

    return () => {
      isActive = false;
    };
  }, [restaurantId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (restaurant) {
    return <RestaurantDetailScreen restaurant={restaurant} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurante no encontrado</Text>
      <Text style={styles.subtitle}>ID: {restaurantId ?? "sin id"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 12,
  },
});

