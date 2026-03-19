// ============================================================
// RUTA DINÁMICA /restaurant/[id]
// ------------------------------------------------------------
// Esta ruta recibe el id del restaurante desde el mapa/feed,
// busca el restaurante en datos mock y renderiza el detalle.
// ============================================================

import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import RestaurantDetailScreen from "@/src/screens/restaurant/restaurantDetailScreen";
import { getRestaurantById } from "@/src/services/mockData";

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams();
  const restaurant = getRestaurantById(String(id));

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
