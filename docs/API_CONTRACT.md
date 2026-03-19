# API Contract – MedEats

## Estado
Este contrato define el objetivo de integración frontend-backend para reemplazar mocks del mobile.

Actualmente en backend solo está activo `admin/`; estos endpoints son el plan de implementación inmediato.

---

## Convenciones

- Base URL local: `http://localhost:8000`
- Prefijo API propuesto: `/api/v1`
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

## 1) Restaurants

### GET /api/v1/restaurants
Lista restaurantes con filtros.

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

### GET /api/v1/restaurants/{id}
Detalle completo restaurante.

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

## 2) Reviews

### GET /api/v1/restaurants/{id}/reviews
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

## 3) Feed / Posts

### GET /api/v1/feed
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

## 4) Profile

### GET /api/v1/me
Perfil del usuario autenticado.

### GET /api/v1/me/posts
Posts del usuario autenticado.

### GET /api/v1/me/visited
Restaurantes visitados y rating dado.

---

## 5) Auth (fase siguiente)

### POST /api/v1/auth/register
### POST /api/v1/auth/login
### POST /api/v1/auth/refresh
### POST /api/v1/auth/logout

---

## Mapeo con frontend actual

Frontend consume estructuras definidas en:
- `src/models/domain.ts`
- `src/services/mockData.ts`

La migración a API real debe conservar campos equivalentes para minimizar refactors.
