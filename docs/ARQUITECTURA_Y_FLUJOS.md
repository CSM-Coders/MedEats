# Arquitectura y flujos – MedEats

## 1) Vista de alto nivel

```text
[ Mobile App (Expo/React Native) ]
           |
           | HTTP/JSON (futuro)
           v
[ Backend API (Django/DRF) ]
           |
           v
[ PostgreSQL ]
```

Hoy, el frontend usa datos mock centralizados para simular backend.

---

## 2) Arquitectura frontend actual

```text
app/_layout.tsx
   └── FeedProvider (estado global)
         └── Tabs
             ├── Home
             ├── Feed
             ├── Create
             └── Profile

Rutas adicionales:
- /restaurant/[id]
```

### Componentes clave
- Home: mapa + búsqueda + filtros
- Feed: posts + likes
- Create: publicación de post
- Profile: estadísticas + posts + visited
- Restaurant Detail: ficha completa

---

## 3) Flujo de datos actual (con mocks)

```text
mockData.ts ---> pantallas
      |
      v
feed-context.tsx (estado compartido)
      |
      ├─ FeedScreen (render + like)
      ├─ CreatePostScreen (createPost)
      └─ ProfileScreen (userPosts)
```

---

## 4) Flujo funcional principal del usuario

## 4.1 Descubrimiento
1. Usuario abre Home.
2. Ve mapa de Medellín con restaurantes.
3. Busca por nombre/categoría.
4. Aplica filtros combinables.
5. Selecciona marcador y abre detalle.

## 4.2 Social
1. Usuario abre Feed y navega posts.
2. Interactúa con likes.
3. Abre detalle del restaurante desde un post.

## 4.3 Publicación
1. Usuario entra a Create.
2. Selecciona imagen, restaurante, rating y texto.
3. Publica.
4. Post aparece en feed y perfil.

---

## 5) Arquitectura backend actual

Estado:
- Configuración Django/DRF/CORS lista.
- App `restaurants` creada.
- Modelos, views y tests de negocio pendientes.

Siguiente arquitectura objetivo:

```text
/api/v1/restaurants
/api/v1/restaurants/{id}
/api/v1/restaurants/{id}/reviews
/api/v1/feed
/api/v1/posts
/api/v1/posts/{id}/like
/api/v1/me
```

---

## 6) Riesgos técnicos y mitigación

- Riesgo: drift entre mocks y API real.
  - Mitigación: usar `docs/API_CONTRACT.md` como fuente de verdad.

- Riesgo: permisos/variaciones en geolocalización.
  - Mitigación: fallback a región Medellín + manejo de error en hook.

- Riesgo: crecimiento desordenado de pantallas.
  - Mitigación: mantener separación por dominio (`src/screens/*`, `src/services/*`, `src/context/*`).

---

## 7) Objetivo de evolución

Pasar de frontend con mocks a integración real backend sin romper UX:
1. Implementar endpoints prioritarios.
2. Crear capa de servicios HTTP en frontend.
3. Migrar pantalla por pantalla con feature flags sencillos.

## Desarrollo local (nota rápida)

Para facilitar el trabajo en equipo hemos añadido un script unificado en la raíz del repo que arranca el backend y la app móvil con una sola orden. Recomendaciones:

- Usar Node 22.x (ver `.nvmrc`) y ejecutar `nvm use` antes de `npm run dev`.
- Comando unificado desde la raíz:

```bash
cd /path/to/MedEats
nvm use
npm run dev
```

Esto lanza Django en `0.0.0.0:8000` y Expo en modo desarrollo con caché limpia.
