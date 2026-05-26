// ============================================================
// [P2-5] Hook: useMapNavigation
// ------------------------------------------------------------
// Encapsula el estado del mapa (cámara, restaurante seleccionado,
// ubicación destino, datos de ruta, estado de navegación) y los
// handlers asociados.
//
// NOTA: aún NO integrado en HomeScreen.tsx. La integración requiere
// que mapRef quede expuesto al componente padre para que el hook
// pueda animar la cámara — se hará con testing UI en una segunda
// iteración.
// ============================================================

import { useCallback, useRef, useState } from "react";
import MapViewComponent from "react-native-maps";
import { Restaurant } from "@/src/models/domain";
import { MEDELLIN_REGION } from "@/src/services/mockData";

export type NavigationState = "discovery" | "preview" | "active";

export type NavigationData = {
  distance: number;
  duration: number;
};

export function useMapNavigation(
  userLocation?: { latitude: number; longitude: number } | null
) {
  const mapRef = useRef<MapViewComponent>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [navigationState, setNavigationState] = useState<NavigationState>("discovery");
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);

  const focusOnMap = useCallback((latitude: number, longitude: number) => {
    requestAnimationFrame(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: latitude - 0.0022,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        700
      );
    });
  }, []);

  const resetCamera = useCallback(() => {
    mapRef.current?.animateToRegion(MEDELLIN_REGION, 500);
  }, []);

  const fitRouteOnMap = useCallback(
    (destLat: number, destLon: number) => {
      const userLat = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
      const userLon = userLocation?.longitude ?? MEDELLIN_REGION.longitude;
      mapRef.current?.fitToCoordinates(
        [
          { latitude: userLat, longitude: userLon },
          { latitude: destLat, longitude: destLon },
        ],
        {
          edgePadding: { top: 100, right: 100, bottom: 400, left: 100 },
          animated: true,
        }
      );
    },
    [userLocation]
  );

  const startNavigation = useCallback(() => {
    setNavigationState("active");
    const userLat = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
    const userLon = userLocation?.longitude ?? MEDELLIN_REGION.longitude;
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: userLat + 0.001,
          longitude: userLon,
        },
        pitch: 60,
        heading: 0,
        altitude: 500,
        zoom: 19,
      },
      { duration: 1000 }
    );
  }, [userLocation]);

  const exitNavigation = useCallback(() => {
    const latitude = userLocation?.latitude ?? MEDELLIN_REGION.latitude;
    const longitude = userLocation?.longitude ?? MEDELLIN_REGION.longitude;
    mapRef.current?.animateCamera(
      {
        center: { latitude, longitude },
        pitch: 0,
        heading: 0,
        altitude: 15000,
        zoom: 13,
      },
      { duration: 800 }
    );
    setNavigationState("discovery");
    setNavigationData(null);
    setSelectedRestaurant(null);
    setSelectedLocation(null);
  }, [userLocation]);

  return {
    mapRef,
    selectedRestaurant,
    setSelectedRestaurant,
    selectedLocation,
    setSelectedLocation,
    navigationState,
    setNavigationState,
    navigationData,
    setNavigationData,
    focusOnMap,
    resetCamera,
    fitRouteOnMap,
    startNavigation,
    exitNavigation,
  };
}
