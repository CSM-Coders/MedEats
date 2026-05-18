import React, { forwardRef } from "react";
import { StyleSheet, View } from "react-native";
import MapViewComponent, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Restaurant } from "@/src/models/domain";
import { MEDELLIN_REGION } from "@/src/services/mockData";
import { GOOGLE_MAPS_API_KEY } from "@/src/config/maps";

import { colors } from "@/src/theme/designTokens";

// ============================================================
// Props: datos que este componente recibe desde su padre
// ============================================================
// - restaurants: la lista de restaurantes a mostrar como marcadores
// - onMarkerPress: función que se ejecuta al tocar un marcador
// - selectedMarker: marcador actualmente seleccionado para resaltarlo
// - origin: coordenadas de origen (opcional)
// - destination: coordenadas de destino (opcional)
// ============================================================
type Props = {
  restaurants: Restaurant[];
  onMarkerPress: (
    restaurant: Restaurant,
    location?: { latitude: number; longitude: number }
  ) => void;
  selectedMarker?: {
    restaurantId: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  origin?: { latitude: number; longitude: number } | null;
  destination?: { latitude: number; longitude: number } | null;
  onDirectionsReady?: (result: any) => void;
};

const MapView = forwardRef<MapViewComponent, Props>(
  ({ restaurants, onMarkerPress, selectedMarker, origin, destination, onDirectionsReady }, ref) => {
    const safeOrigin =
      origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)
        ? origin
        : null;

    const safeDestination =
      destination &&
      Number.isFinite(destination.latitude) &&
      Number.isFinite(destination.longitude)
        ? destination
        : null;

    const isSelectedLocation = (latitude: number, longitude: number, restaurantId: string) => {
      if (!selectedMarker || selectedMarker.restaurantId !== restaurantId) {
        return false;
      }

      if (
        selectedMarker.latitude === null ||
        selectedMarker.longitude === null ||
        !Number.isFinite(selectedMarker.latitude) ||
        !Number.isFinite(selectedMarker.longitude)
      ) {
        return false;
      }

      return (
        Math.abs(selectedMarker.latitude - latitude) < 0.000001 &&
        Math.abs(selectedMarker.longitude - longitude) < 0.000001
      );
    };

    return (
      <MapViewComponent
        ref={ref}
        style={styles.map}
        initialRegion={MEDELLIN_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {safeOrigin && safeDestination && (
          <MapViewDirections
            origin={safeOrigin}
            destination={safeDestination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor={colors.primary}
            optimizeWaypoints={true}
            onReady={(result) => {
              if (onDirectionsReady) onDirectionsReady(result);
            }}
          />
        )}

        {restaurants.filter(r => r && r.id).map((restaurant, index) => {
          const mainLatitude = Number(restaurant.latitude);
          const mainLongitude = Number(restaurant.longitude);
          const hasValidMainLocation =
            Number.isFinite(mainLatitude) && Number.isFinite(mainLongitude);

          const validBranches = (restaurant.branches || []).filter((branch) => {
            const latitude = Number(branch.latitude);
            const longitude = Number(branch.longitude);
            return Number.isFinite(latitude) && Number.isFinite(longitude);
          });

          if (!hasValidMainLocation && validBranches.length === 0) {
            return null;
          }

          return (
            <React.Fragment key={`group-${restaurant.id}-${index}`}>
              {hasValidMainLocation ? (
                isSelectedLocation(mainLatitude, mainLongitude, restaurant.id) ? (
                  <Marker
                    key={`main-selected-${restaurant.id}-${index}`}
                    coordinate={{
                      latitude: mainLatitude,
                      longitude: mainLongitude,
                    }}
                    title={restaurant.name}
                    description={restaurant.location}
                    zIndex={20}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onPress={() =>
                      onMarkerPress(restaurant, {
                        latitude: mainLatitude,
                        longitude: mainLongitude,
                      })
                    }
                  >
                    <View style={styles.selectedMarkerWrap}>
                      <View style={styles.selectedMarkerHalo} />
                      <View style={styles.selectedMarker} />
                    </View>
                  </Marker>
                ) : (
                  <Marker
                    key={`main-unselected-${restaurant.id}-${index}`}
                    coordinate={{
                      latitude: mainLatitude,
                      longitude: mainLongitude,
                    }}
                    title={restaurant.name}
                    description={restaurant.location}
                    pinColor={colors.primary}
                    onPress={() =>
                      onMarkerPress(restaurant, {
                        latitude: mainLatitude,
                        longitude: mainLongitude,
                      })
                    }
                  />
                )
              ) : null}

              {validBranches.map((branch, bIndex) => {
                const branchLatitude = Number(branch.latitude);
                const branchLongitude = Number(branch.longitude);
                const branchIsSelected = isSelectedLocation(
                  branchLatitude,
                  branchLongitude,
                  restaurant.id
                );

                return branchIsSelected ? (
                  <Marker
                    key={`branch-selected-${branch.id}-${index}-${bIndex}`}
                    coordinate={{
                      latitude: branchLatitude,
                      longitude: branchLongitude,
                    }}
                    title={`${restaurant.name} (Sede)`}
                    description={branch.address}
                    zIndex={20}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onPress={() =>
                      onMarkerPress(restaurant, {
                        latitude: branchLatitude,
                        longitude: branchLongitude,
                      })
                    }
                  >
                    <View style={styles.selectedMarkerWrap}>
                      <View style={styles.selectedMarkerHalo} />
                      <View style={styles.selectedMarker} />
                    </View>
                  </Marker>
                ) : (
                  <Marker
                    key={`branch-unselected-${branch.id}-${index}-${bIndex}`}
                    coordinate={{
                      latitude: branchLatitude,
                      longitude: branchLongitude,
                    }}
                    title={`${restaurant.name} (Sede)`}
                    description={branch.address}
                    pinColor={colors.accent}
                    onPress={() =>
                      onMarkerPress(restaurant, {
                        latitude: branchLatitude,
                        longitude: branchLongitude,
                      })
                    }
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </MapViewComponent>
    );
  }
);

MapView.displayName = "MapView";

export default MapView;

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  selectedMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  selectedMarkerHalo: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(47, 128, 237, 0.22)",
  },
  selectedMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2F80ED",
    borderWidth: 3,
    borderColor: colors.background,
  },
});
