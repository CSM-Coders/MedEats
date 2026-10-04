# 🍽️ MedEats

Aplicación móvil que combina un **mapa interactivo de restaurantes de Medellín** con una **red social gastronómica**: descubrir restaurantes, publicar reseñas con fotos y seguir a otros usuarios.

App en React Native (Expo) + TypeScript, API REST en Django REST Framework + PostgreSQL.

<!-- Agregar aquí 3 capturas de la app (mapa, feed y perfil) o un GIF de 20-30 s. Es lo primero que mira un reclutador. -->

## Funcionalidades

**Descubrir**
- Mapa con los restaurantes, ubicación actual del usuario y tarjeta de detalle al tocar un marcador.
- Búsqueda por nombre con autocompletado y filtros por categoría, calificación mínima y distancia.
- Asistente de búsqueda en lenguaje natural con la API de Gemini y respaldo por palabras clave cuando el modelo no responde.
- Detalle de restaurante con sedes, reseñas y calificación.

**Red social**
- Registro, inicio de sesión y edición de perfil.
- Feed de publicaciones con fotos, likes y comentarios.
- Seguir usuarios, con solicitudes de seguimiento para cuentas privadas.
- Restaurantes guardados y visitados, y notificaciones.
- Panel para que el dueño de un restaurante gestione su ficha.

## Arquitectura

| Componente | Tecnología |
|---|---|
| `med-eats-mobile/` | React Native 0.81, Expo 54, TypeScript, Expo Router, react-native-maps |
| `med-eats-backend/` | Django, Django REST Framework, PostgreSQL 16, Pillow |
| IA | API de Gemini (búsqueda en lenguaje natural) |

Modelo de datos: 12 modelos (usuarios, perfiles, seguimientos y solicitudes, restaurantes, sedes, categorías, reseñas, publicaciones, likes, comentarios, guardados y visitados).

Documentación técnica:
- [Decisiones técnicas (ADR)](docs/ADR_DECISIONES_TECNICAS.md)
- [Contrato de API](docs/API_CONTRACT.md)
- [Arquitectura y flujos](docs/ARQUITECTURA_Y_FLUJOS.md)
- [Runbook operativo](docs/RUNBOOK_OPERATIVO.md)
- [Guía del proyecto archivo por archivo](docs/GUIA_COMPLETA_PROYECTO.md)

## Calidad

- 38 tests de backend (`restaurants` y `accounts`).
- CI en GitHub Actions: ESLint y chequeo de tipos de TypeScript en la app; Black, Ruff y `manage.py check` en el backend.

## Inicio rápido

Requisitos: Node 22 (ver `.nvmrc`), Python 3.10+, PostgreSQL 16 y la app Expo Go en el teléfono (o un emulador).

```bash
git clone https://github.com/CSM-Coders/MedEats
cd MedEats

# Backend
cd med-eats-backend
python3 -m venv ../.venv && source ../.venv/bin/activate
pip install -r requirements.txt
createdb medeats
python manage.py migrate
python seed.py                # datos de ejemplo
cd ..

# App + backend con un solo comando
nvm use
npm install
npm run dev
```

Escanea el código QR con Expo Go (teléfono y computador en la misma red Wi-Fi). Para la búsqueda con IA, define `GEMINI_API_KEY` en el entorno del backend.

Solución de problemas frecuentes: [docs/RUNBOOK_OPERATIVO.md](docs/RUNBOOK_OPERATIVO.md).

## Equipo

Proyecto académico, Universidad EAFIT (2026-1).

| Nombre | Rol |
|---|---|
| Camilo Álvarez Villegas | Desarrollador backend y de la app móvil, análisis de requisitos, documentación técnica |
| Matías Monsalve Ruiz | Desarrollador, CI |
| Samuel Calderón Duque | Diseño UI/UX, búsqueda con IA |

Requisitos, historias de usuario y planeación de sprints: [Wiki](https://github.com/CSM-Coders/MedEats/wiki).
