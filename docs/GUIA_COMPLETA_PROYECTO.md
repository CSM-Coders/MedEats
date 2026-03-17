# Guía completa de MedEats (fácil de entender)

Esta guía explica **qué hace cada parte del proyecto**, **por qué existe** y **cómo se conecta todo**.

Documentación complementaria profesional:
- [ADR_DECISIONES_TECNICAS.md](ADR_DECISIONES_TECNICAS.md)
- [API_CONTRACT.md](API_CONTRACT.md)
- [RUNBOOK_OPERATIVO.md](RUNBOOK_OPERATIVO.md)
- [ARQUITECTURA_Y_FLUJOS.md](ARQUITECTURA_Y_FLUJOS.md)

---

## 1) Estructura general

MedEats está dividido en dos bloques:

- **App móvil (frontend)** en [med-eats-mobile](med-eats-mobile)
- **Servidor API (backend)** en [med-eats-backend](med-eats-backend)

Además, hay CI/CD en [.github/workflows/ci.yml](.github/workflows/ci.yml) para validar calidad automáticamente.

---

## 2) Frontend (Expo + React Native)

## 2.1 Arranque y navegación

- [med-eats-mobile/app/_layout.tsx](med-eats-mobile/app/_layout.tsx)  
  **Qué hace:** arranca la app, configura tema y registra navegación principal.  
  **Por qué es importante:** es la “puerta de entrada” de toda la app.

- [med-eats-mobile/app/(tabs)/_layout.tsx](med-eats-mobile/app/(tabs)/_layout.tsx)  
  **Qué hace:** define las tabs (Home, Feed, Create, Profile).  
  **Por qué es importante:** organiza la experiencia principal del usuario.

- [med-eats-mobile/app/(tabs)/index.tsx](med-eats-mobile/app/(tabs)/index.tsx)  
  **Qué hace:** redirige a Home por defecto.  
  **Por qué es importante:** mejora UX al abrir la app.

- [med-eats-mobile/app/restaurant/[id].tsx](med-eats-mobile/app/restaurant/[id].tsx)  
  **Qué hace:** ruta dinámica para abrir el detalle del restaurante por id.  
  **Por qué es importante:** permite navegación desde mapa/feed a detalle.

## 2.2 Pantallas funcionales

- [med-eats-mobile/src/screens/home/homeScreen.tsx](med-eats-mobile/src/screens/home/homeScreen.tsx)  
  **Qué hace:** mapa, búsqueda por texto, búsqueda semántica básica, filtros por categoría/rating/distancia, botón de ubicación y tarjeta del restaurante.  
  **Historias relacionadas:** US05, US06, US07, US09.

- [med-eats-mobile/src/screens/feed/feedScreen.tsx](med-eats-mobile/src/screens/feed/feedScreen.tsx)  
  **Qué hace:** muestra publicaciones, permite likes y abre detalle de restaurante.  
  **Historia relacionada:** US10.

- [med-eats-mobile/src/screens/create/createPostScreen.tsx](med-eats-mobile/src/screens/create/createPostScreen.tsx)  
  **Qué hace:** crea post con imagen, restaurante, rating y caption.  
  **Historia relacionada:** US11.

- [med-eats-mobile/src/screens/profile/profileScreen.tsx](med-eats-mobile/src/screens/profile/profileScreen.tsx)  
  **Qué hace:** perfil del usuario, estadísticas, posts propios y restaurantes visitados.

- [med-eats-mobile/src/screens/restaurant/restaurantDetailScreen.tsx](med-eats-mobile/src/screens/restaurant/restaurantDetailScreen.tsx)  
  **Qué hace:** detalle completo de restaurante (info, menú destacado, reviews, WhatsApp).  
  **Historia relacionada:** US08.

## 2.3 Componentes reutilizables de Home

- [med-eats-mobile/src/screens/home/components/mapView.tsx](med-eats-mobile/src/screens/home/components/mapView.tsx)  
  **Qué hace:** encapsula mapa y marcadores.

- [med-eats-mobile/src/screens/home/components/restaurantCard.tsx](med-eats-mobile/src/screens/home/components/restaurantCard.tsx)  
  **Qué hace:** tarjeta visual de restaurante seleccionando marker.

## 2.4 Estado compartido y datos mock

- [med-eats-mobile/src/context/feed-context.tsx](med-eats-mobile/src/context/feed-context.tsx)  
  **Qué hace:** estado global del feed (`posts`, `toggleLike()`, `createPost()`).  
  **Por qué es importante:** Feed/Create/Profile comparten información sin duplicar lógica.

- [med-eats-mobile/src/models/domain.ts](med-eats-mobile/src/models/domain.ts)  
  **Qué hace:** define tipos del dominio (`Restaurant`, `Post`, `Review`, etc.).  
  **Por qué es importante:** mantiene consistencia de datos en toda la app.

- [med-eats-mobile/src/services/mockData.ts](med-eats-mobile/src/services/mockData.ts)  
  **Qué hace:** centraliza datos mock y utilidades (`semanticCategoryMatches()`, `getDistanceKm()`, `getRestaurantById()`).  
  **Por qué es importante:** simula backend mientras se construye la API real.

## 2.5 Hooks y configuración

- [med-eats-mobile/src/hooks/useUserLocation.ts](med-eats-mobile/src/hooks/useUserLocation.ts)  
  **Qué hace:** pide permisos de ubicación y devuelve coordenadas del usuario.

- [med-eats-mobile/hooks/use-color-scheme.ts](med-eats-mobile/hooks/use-color-scheme.ts) y [med-eats-mobile/hooks/use-color-scheme.web.ts](med-eats-mobile/hooks/use-color-scheme.web.ts)  
  **Qué hace:** detecta tema del sistema (light/dark).

- [med-eats-mobile/package.json](med-eats-mobile/package.json)  
  **Qué hace:** scripts y dependencias de Expo/React Native.

- [med-eats-mobile/tsconfig.json](med-eats-mobile/tsconfig.json)  
  **Qué hace:** reglas de TypeScript y alias `@/*`.

- [med-eats-mobile/eslint.config.js](med-eats-mobile/eslint.config.js)  
  **Qué hace:** reglas de lint para calidad de código.

---

## 3) Backend (Django + DRF)

- [med-eats-backend/manage.py](med-eats-backend/manage.py)  
  **Qué hace:** punto de entrada de comandos Django (`runserver`, `migrate`, `check`).

- [med-eats-backend/config/settings.py](med-eats-backend/config/settings.py)  
  **Qué hace:** configuración global (apps instaladas, DB PostgreSQL, CORS, DRF).

- [med-eats-backend/config/urls.py](med-eats-backend/config/urls.py)  
  **Qué hace:** rutas del servidor (hoy incluye admin).

- [med-eats-backend/requirements.txt](med-eats-backend/requirements.txt)  
  **Qué hace:** dependencias backend (Django, DRF, CORS, psycopg2, Black, Ruff).

- [med-eats-backend/restaurants/models.py](med-eats-backend/restaurants/models.py)  
  **Estado:** base vacía (pendiente modelos reales).

- [med-eats-backend/restaurants/views.py](med-eats-backend/restaurants/views.py)  
  **Estado:** base vacía (pendiente endpoints API).

- [med-eats-backend/restaurants/tests.py](med-eats-backend/restaurants/tests.py)  
  **Estado:** base vacía (pendiente pruebas).

---

## 4) CI/CD y calidad

- [.github/workflows/ci.yml](.github/workflows/ci.yml)  
  Ejecuta:
  - Frontend: `eslint` + `tsc --noEmit`
  - Backend: `black --check` + `ruff check` + `python manage.py check`

Esto evita merges con errores básicos de calidad.

---

## 5) Lo que ya hicimos en desarrollo

1. Cerramos base de Sprint 0 y flujo profesional de ramas/commits.
2. Completamos Sprint 1 móvil (US07–US11) con mocks funcionales.
3. Limpiamos código muerto de plantilla Expo.
4. Dejamos lint funcionando después de la limpieza.

---

## 6) Qué falta para cerrar MVP completo

1. Implementar modelos reales backend (`restaurants`, `posts`, `reviews`, `follows`).
2. Exponer endpoints DRF y conectar frontend a API real.
3. Añadir autenticación (registro/login/JWT).
4. Reemplazar gradualmente mocks por llamadas HTTP.
5. Crear pruebas backend/frontend más amplias.

---

## 7) Cómo leer el proyecto si eres nuevo

Orden recomendado:
1. [med-eats-mobile/app/_layout.tsx](med-eats-mobile/app/_layout.tsx)
2. [med-eats-mobile/app/(tabs)/_layout.tsx](med-eats-mobile/app/(tabs)/_layout.tsx)
3. [med-eats-mobile/src/screens/home/homeScreen.tsx](med-eats-mobile/src/screens/home/homeScreen.tsx)
4. [med-eats-mobile/src/context/feed-context.tsx](med-eats-mobile/src/context/feed-context.tsx)
5. [med-eats-mobile/src/services/mockData.ts](med-eats-mobile/src/services/mockData.ts)
6. Backend: [med-eats-backend/config/settings.py](med-eats-backend/config/settings.py)

Con ese recorrido entiendes el 80% del sistema rápidamente.
