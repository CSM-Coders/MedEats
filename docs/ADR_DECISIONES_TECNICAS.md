# ADR – Decisiones Técnicas de MedEats

## Objetivo
Registrar decisiones de arquitectura para que el equipo entienda el **por qué** técnico y pueda mantener consistencia en futuras iteraciones.

---

## ADR-001: Frontend móvil con Expo + React Native + Expo Router

### Contexto
Se necesitaba entregar un MVP móvil rápido para iOS/Android con navegación clara por tabs y experiencia tipo app social + mapa.

### Decisión
Usar:
- Expo + React Native
- Expo Router (file-based routing)

### Motivos
- Acelera desarrollo y pruebas en simulador/Expo Go.
- Menor fricción de setup para equipo académico.
- Navegación por archivos fácil de mantener.

### Consecuencias
- Positiva: velocidad de desarrollo alta.
- Riesgo: dependencia del ecosistema Expo.
- Mitigación: mantener código portable a React Native estándar.

---

## ADR-002: Estado temporal con mocks centralizados + contexto global

### Contexto
Backend API de negocio aún no estaba implementada completamente, pero se necesitaba validar UX y flujos de Sprint 1.

### Decisión
- Centralizar datos mock en `src/services/mockData.ts`.
- Compartir estado social en `src/context/feed-context.tsx`.

### Motivos
- Permite desarrollo paralelo frontend/backend.
- Facilita prototipado de feed/create/profile.
- Evita duplicar datos por pantalla.

### Consecuencias
- Positiva: UI funcional sin bloqueo por backend.
- Riesgo: divergencia entre mock y API real.
- Mitigación: crear contrato de API y migración por fases.

---

## ADR-003: Módulo de ubicación y mapa con react-native-maps + expo-location

### Contexto
El núcleo de valor del producto es descubrimiento geográfico de restaurantes.

### Decisión
Usar:
- `react-native-maps` para visualización de mapa/markers.
- `expo-location` para permisos y ubicación actual.

### Motivos
- Integración madura con React Native.
- Soporte directo para UX requerida (mapa, marcadores, recenter).

### Consecuencias
- Positiva: cumplimiento temprano de US05/US06/US08/US09.
- Riesgo: variaciones por plataforma y permisos.
- Mitigación: fallback a región Medellín cuando no hay ubicación.

---

## ADR-004: Backend con Django + DRF + PostgreSQL

### Contexto
Se requiere API REST mantenible con posibilidad de crecimiento y control administrativo.

### Decisión
Usar:
- Django + Django REST Framework
- PostgreSQL

### Motivos
- Ecosistema robusto y rápido para APIs.
- Admin de Django acelera gestión inicial.
- PostgreSQL sólido para datos relacionales del dominio.

### Consecuencias
- Positiva: base backend confiable para MVP y evolución.
- Riesgo: curva de modelado/serialización para el equipo.
- Mitigación: desarrollo incremental por módulos (restaurants, feed, posts, auth).

---

## ADR-005: Calidad automatizada en CI

### Contexto
Se necesitaba evitar merges con errores de formato/tipos/lint.

### Decisión
Pipeline CI con:
- Frontend: ESLint + TypeScript check.
- Backend: Black + Ruff + Django check.

### Motivos
- Eleva calidad sin depender solo de revisión manual.
- Estandariza definición de “mergeable”.

### Consecuencias
- Positiva: menos regresiones tempranas.
- Riesgo: fallos por configuración no alineada local/CI.
- Mitigación: documentar comandos estándar en runbook.

---

## Próximas ADR candidatas
- Estrategia de autenticación (JWT + refresh + rol admin).
- Estrategia media storage (S3/Cloudinary/local dev).
- Estrategia de búsqueda semántica (servicio interno vs proveedor externo).
- Estrategia de versionado de API (`/api/v1`).
