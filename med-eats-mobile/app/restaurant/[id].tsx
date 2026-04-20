// ============================================================
// RUTA DINÁMICA /restaurant/[id]
// ------------------------------------------------------------
// Esta ruta recibe el id numérico del restaurante desde el mapa,
// hace un Fetch individual a Django y renderiza el detalle.
// ============================================================

import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import RestaurantDetailScreen from "@/src/screens/restaurant/restaurantDetailScreen";
import { Restaurant } from "@/src/models/domain";
import { fetchRestaurantById } from "@/src/services/restaurantApi";

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantDetail = async () => {
      try {
        const transformed = await fetchRestaurantById(String(id));
        setRestaurant(transformed);
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (restaurant) {
    return <RestaurantDetailScreen restaurant={restaurant} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurante no encontrado</Text>
      <Text style={styles.subtitle}>ID: {id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#aaa",
    marginTop: 12,
  },
});
