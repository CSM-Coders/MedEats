import { View, StyleSheet, ScrollView } from "react-native";
import MapView from "./components/mapView";
import RestaurantCard from "./components/restaurantCard";
import { restaurants } from "./mocks";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <MapView />

      <ScrollView
        style={styles.cards}
        showsVerticalScrollIndicator={false}
      >
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            id={restaurant.id}
            name={restaurant.name}
            category={restaurant.category}
            time={restaurant.time}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cards: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
  },
});
