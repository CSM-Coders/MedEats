import { forwardRef } from "react";
import { StyleSheet } from "react-native";
import MapViewComponent, { Marker } from "react-native-maps";
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

// ============================================================
// forwardRef: permite que el componente padre tenga acceso
// directo al MapViewComponent para controlarlo (ej: animarlo)
//
// Sin forwardRef: el padre solo puede enviar datos (props)
// Con forwardRef: el padre tiene un "control remoto" del mapa
//
// Lo usamos así desde el padre:
//   const mapRef = useRef(null);
//   mapRef.current.animateToRegion(nuevaRegion);
// ============================================================
const MapView = forwardRef<MapViewComponent, Props>(
  ({ restaurants, onMarkerPress }, ref) => {
    return (
      <MapViewComponent
        ref={ref}
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
            coordinate={{
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
            }}
            title={restaurant.name}
            description={restaurant.category}
            pinColor="#FF6B35"
            onPress={() => onMarkerPress(restaurant)}
          />
        ))}
      </MapViewComponent>
    );
  }
);

// Nombre para debugging — cuando inspeccionas componentes en React DevTools
MapView.displayName = "MapView";

export default MapView;

const styles = StyleSheet.create({
  map: {
    // flex: 1 hace que el mapa ocupe todo el espacio disponible
    flex: 1,
  },
});
