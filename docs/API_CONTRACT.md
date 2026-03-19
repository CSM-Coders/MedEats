# API Contract – MedEats

## Estado

### ✅ Implementados (Sprint 1)
- `GET /api/restaurants/` — Lista de restaurantes
- `GET /api/restaurants/{id}/` — Detalle de restaurante
- `GET /api/categories/` — Lista de categorías

### 🔲 Planificados (Sprint 2+)
- Autenticación (JWT)
- Feed / Posts
- Reviews
- Profile

---

## Convenciones

- Base URL local: `http://localhost:8000`
- Prefijo API: `/api/`
- Formato: JSON
- Fechas: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- Errores estándar:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'rating' must be between 1 and 5"
  }
}
```

---

## 1) Restaurants ✅ LIVE

### GET /api/restaurants/
Lista todos los restaurantes.

#### Query params
- `q` (string, opcional): búsqueda por nombre/categoría
- `category` (string, opcional)
- `min_rating` (number, opcional)
- `max_distance_km` (number, opcional)
- `lat` / `lon` (number, opcional para distancia)

#### Response 200
```json
[
  {
    "id": "1",
    "name": "Sushi Zen",
    "category": "Japanese & Sushi",
    "rating": 4.9,
    "image": "https://...",
    "latitude": 6.21,
    "longitude": -75.57,
    "location": "Provenza, El Poblado"
  }
]
```

### GET /api/restaurants/{id}/
Detalle completo restaurante. **✅ LIVE**

#### Response 200
```json
{
  "id": "1",
  "name": "Sushi Zen",
  "category": "Japanese & Sushi",
  "rating": 4.9,
  "image": "https://...",
  "location": "Provenza, El Poblado",
  "description": "...",
  "menu_highlights": ["Roll tempura", "Ramen"],
  "whatsapp": "573004445566"
}
```

---

## 2) Reviews 🔲 PLANNED

### GET /api/restaurants/{id}/reviews/
Reseñas por restaurante.

#### Response 200
```json
[
  {
    "id": "rv-1",
    "username": "andres_med",
    "avatar": "https://...",
    "rating": 5,
    "comment": "Excelente sabor",
    "date": "2026-01-25"
  }
]
```

---

## 3) Feed / Posts 🔲 PLANNED

### GET /api/feed/
Feed de publicaciones.

#### Response 200
```json
[
  {
    "id": "p1",
    "user_id": "u1",
    "username": "foodlover_med",
    "user_avatar": "https://...",
    "restaurant_id": "1",
    "restaurant_name": "Sushi Zen",
    "image": "https://...",
    "rating": 5,
    "caption": "Excelente",
    "likes": 10,
    "comments": 2,
    "is_liked": false,
    "date": "2026-03-17"
  }
]
```

### POST /api/v1/posts
Crear publicación.

#### Request
```json
{
  "restaurant_id": "1",
  "rating": 5,
  "caption": "Gran experiencia",
  "image": "https://..."
}
```

#### Response 201
```json
{
  "id": "p-new",
  "status": "created"
}
```

### POST /api/v1/posts/{id}/like
Alternar like del usuario autenticado.

#### Response 200
```json
{
  "id": "p1",
  "likes": 11,
  "is_liked": true
}
```

---

## 4) Profile 🔲 PLANNED

### GET /api/me/
Perfil del usuario autenticado.

### GET /api/me/posts/
Posts del usuario autenticado.

### GET /api/me/visited/
Restaurantes visitados y rating dado.

---

## 5) Auth 🔲 PLANNED (Sprint 2)

### POST /api/auth/register/
### POST /api/auth/login/
### POST /api/auth/refresh/
### POST /api/auth/logout/

---

## Mapeo con frontend actual

Frontend consume estructuras definidas en:
- `src/models/domain.ts` — Tipos TypeScript
- `app/restaurant/[id].tsx` — Fetch directo a `/api/restaurants/{id}/`
- `src/screens/home/homeScreen.tsx` — Fetch directo a `/api/restaurants/`

La transformación snake_case → camelCase se realiza automáticamente en el frontend.
