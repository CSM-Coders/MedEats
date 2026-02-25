import { StyleSheet } from "react-native";
import MapViewComponent, { Marker, Region } from "react-native-maps";
import { MEDELLIN_REGION, Restaurant } from "../mocks";

// ============================================================
// Props: datos que este componente recibe desde su padre
// ============================================================
// - restaurants: la lista de restaurantes a mostrar como marcadores
// - onMarkerPress: función que se ejecuta al tocar un marcador
// ============================================================
type Props = {
  restaurants: Restaurant[];
  onMarkerPress: (restaurant: Restaurant) => void;
};

export default function MapView({ restaurants, onMarkerPress }: Props) {
  return (
    <MapViewComponent
      style={styles.map}
      // Región inicial: centrada en Medellín
      initialRegion={MEDELLIN_REGION}
      // Muestra el botón "Mi Ubicación" (requiere permisos)
      showsUserLocation
      showsMyLocationButton={false}
    >
      {/* Recorremos cada restaurante y creamos un marcador en el mapa */}
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          // Coordenadas donde se coloca el marcador
          coordinate={{
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          }}
          // Texto que aparece al tocar el marcador (tooltip)
          title={restaurant.name}
          description={restaurant.category}
          // Color naranja para el marcador (como en el mockup)
          pinColor="#FF6B35"
          // Al tocar el marcador, llamamos a la función del padre
          onPress={() => onMarkerPress(restaurant)}
        />
      ))}
    </MapViewComponent>
  );
}

const styles = StyleSheet.create({
  map: {
    // flex: 1 hace que el mapa ocupe todo el espacio disponible
    flex: 1,
  },
});
