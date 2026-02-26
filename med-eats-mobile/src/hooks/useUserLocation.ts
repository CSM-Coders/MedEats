import { useState, useEffect } from "react";
import * as Location from "expo-location";

// ============================================================
// Tipo que representa la ubicación del usuario
// ============================================================
export type UserLocation = {
  latitude: number;
  longitude: number;
};

// ============================================================
// Hook personalizado: useUserLocation
// ============================================================
// ¿Qué hace?
// 1. Pide permiso al usuario para acceder a su GPS
// 2. Obtiene la ubicación actual del dispositivo
// 3. Devuelve la ubicación, el estado de carga y posibles errores
//
// ¿Por qué un hook?
// Porque encapsula toda la lógica de permisos y GPS en un solo lugar.
// Así cualquier pantalla puede usar la ubicación con una sola línea:
//   const { location, loading, error } = useUserLocation();
// ============================================================
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Evita actualizar el estado si el componente se desmontó

    async function getLocation() {
      try {
        // ============================================================
        // Paso 1: Pedir permiso de ubicación al usuario
        // ============================================================
        // requestForegroundPermissionsAsync() muestra el diálogo nativo de iOS/Android
        // que dice "¿Permitir que MedEats acceda a tu ubicación?"
        // Solo necesitamos "foreground" (mientras la app está abierta),
        // no "background" (que sería para rastrear en segundo plano).
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          if (isMounted) {
            setError("Permiso de ubicación denegado");
            setLoading(false);
          }
          return;
        }

        // ============================================================
        // Paso 2: Obtener la ubicación actual del dispositivo
        // ============================================================
        // accuracy: Balanced es un buen equilibrio entre precisión y batería.
        // No necesitamos GPS de alta precisión para mostrar un punto en el mapa.
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("No se pudo obtener la ubicación");
          setLoading(false);
        }
      }
    }

    getLocation();

    // Cleanup: si el componente se desmonta antes de que termine,
    // evitamos actualizar el estado (previene memory leaks).
    return () => {
      isMounted = false;
    };
  }, []); // [] = solo se ejecuta una vez al montar el componente

  return { location, loading, error };
}
