import React, { forwardRef } from "react";
import { StyleSheet } from "react-native";
import MapViewComponent, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Restaurant } from "@/src/models/domain";
import { MEDELLIN_REGION } from "@/src/services/mockData";
import { GOOGLE_MAPS_API_KEY } from "@/src/config/maps";

// ============================================================
// Props: datos que este componente recibe desde su padre
// ============================================================
// - restaurants: la lista de restaurantes a mostrar como marcadores
// - onMarkerPress: función que se ejecuta al tocar un marcador
// - origin: coordenadas de origen (opcional)
// - destination: coordenadas de destino (opcional)
// ============================================================
type Props = {
  restaurants: Restaurant[];
  onMarkerPress: (
    restaurant: Restaurant,
    location?: { latitude: number; longitude: number }
  ) => void;
  origin?: { latitude: number; longitude: number } | null;
  destination?: { latitude: number; longitude: number } | null;
  onDirectionsReady?: (result: any) => void;
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
  ({ restaurants, onMarkerPress, origin, destination, onDirectionsReady }, ref) => {
    return (
      <MapViewComponent
        ref={ref}
        style={styles.map}
        initialRegion={MEDELLIN_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Trazado de la ruta al estilo Whoosh */}
        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#FF6B35"
            optimizeWaypoints={true}
            onReady={(result) => {
              if (onDirectionsReady) onDirectionsReady(result);
              console.log(`Distancia: ${result.distance} km`);
              console.log(`Duración: ${result.duration} min.`);
            }}
          />
        )}
        {/* Recorremos cada restaurante y creamos un marcador en el mapa */}
        {/* La key incluye restaurants.length para forzar a iOS a redibujar
            los marcadores cuando cambia la lista (fix de bug de react-native-maps) */}
        {restaurants.map((restaurant) => (
          <React.Fragment key={`group-${restaurant.id}-${restaurants.length}`}>
            {/* 1. Marcador Principal del Restaurante */}
            <Marker
              key={`main-${restaurant.id}`}
              coordinate={{
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              }}
              title={restaurant.name}
              description={restaurant.location}
              pinColor="#FF6B35"
              onPress={() => onMarkerPress(restaurant, {
                latitude: restaurant.latitude,
                longitude: restaurant.longitude
              })}
            />

            {/* 2. Marcadores de sus Sedes Adicionales */}
            {(restaurant.branches || []).map((branch) => (
              <Marker
                key={`branch-${branch.id}`}
                coordinate={{
                  latitude: branch.latitude,
                  longitude: branch.longitude,
                }}
                title={`${restaurant.name} (Sede)`}
                description={branch.address}
                pinColor="#1D4ED8"
                onPress={() => onMarkerPress(restaurant, {
                  latitude: branch.latitude,
                  longitude: branch.longitude
                })}
              />
            ))}
          </React.Fragment>
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
