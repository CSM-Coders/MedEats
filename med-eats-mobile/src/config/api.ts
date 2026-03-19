// ============================================================
// API CONFIG — Detección automática de IP
// ------------------------------------------------------------
// En desarrollo, Expo sabe la IP de tu Mac (la usa para Metro).
// Aprovechamos eso para no tener que actualizar el .env
// cada vez que cambias de Wi-Fi.
//
// Prioridad:
//   1. EXPO_PUBLIC_API_URL del .env  (si está definida)
//   2. IP automática de Expo         (desarrollo)
//   3. localhost:8000                 (fallback)
// ============================================================

import Constants from "expo-constants";

function getApiBaseUrl(): string {
  // Si el usuario definió una URL explícita en .env, la usamos
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // En desarrollo, Expo expone la IP de tu Mac vía debuggerHost
  // Formato: "192.168.1.2:8081" — tomamos solo la IP y le ponemos el puerto de Django
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:8000`;
  }

  // Fallback para web o casos donde no hay debuggerHost
  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();
