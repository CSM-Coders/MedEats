# 🍽️ MedEats

**MedEats** es una aplicación móvil que combina un **mapa interactivo de Medellín** con una **red social gastronómica**. Permite descubrir restaurantes, ver su ubicación en el mapa, compartir experiencias con fotos y reseñas, y seguir a otros amantes de la comida.

📘 **Guía explicada archivo por archivo (lectura recomendada):** [docs/GUIA_COMPLETA_PROYECTO.md](docs/GUIA_COMPLETA_PROYECTO.md)

## 📚 Documentación técnica profesional

- Decisiones técnicas (ADR): [docs/ADR_DECISIONES_TECNICAS.md](docs/ADR_DECISIONES_TECNICAS.md)
- Contrato de API: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)
- Runbook operativo: [docs/RUNBOOK_OPERATIVO.md](docs/RUNBOOK_OPERATIVO.md)
- Arquitectura y flujos: [docs/ARQUITECTURA_Y_FLUJOS.md](docs/ARQUITECTURA_Y_FLUJOS.md)

---

## 📋 Tabla de Contenidos

- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación Paso a Paso](#-instalación-paso-a-paso)
- [Cómo Correr el Programa](#-cómo-correr-el-programa)
- [Scripts Disponibles](#-scripts-disponibles)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Pantallas de la App](#-pantallas-de-la-app)
- [Solución de Problemas](#-solución-de-problemas)

---

## 🏗 Arquitectura del Proyecto

MedEats tiene dos partes principales:

| Componente | Tecnología | Descripción |
|---|---|---|
| **med-eats-mobile/** | React Native + Expo | App móvil (iOS/Android) |
| **med-eats-backend/** | Django + DRF | API REST + Base de datos |

```
┌─────────────────┐       HTTP/JSON       ┌─────────────────┐
│                 │  ◄──────────────────►  │                 │
│   App Móvil     │                        │   Backend API   │
│  (React Native) │                        │   (Django DRF)  │
│                 │                        │                 │
└────────┬────────┘                        └────────┬────────┘
         │                                          │
         ▼                                          ▼
   Apple Maps /                               PostgreSQL
   Google Maps API                            (Base de datos)
```

---

## 🛠 Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

### Para la App Móvil

#### 1. Node.js (v18 o superior)

- **macOS** (con Homebrew):
  ```bash
  brew install node
  ```
- **Windows / Linux**: Descárgalo desde [https://nodejs.org](https://nodejs.org) (versión LTS).
- Verificar:
  ```bash
  node --version
  npm --version
  ```

#### 2. Expo Go (para dispositivo físico)

Para probar la app en tu teléfono:

- **iOS**: Descarga [Expo Go](https://apps.apple.com/app/expo-go/id982107779) desde la App Store.
- **Android**: Descarga [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) desde Google Play.

#### 3. (Opcional) Simuladores / Emuladores

- **iOS Simulator** (solo macOS):
  - Instala [Xcode](https://apps.apple.com/app/xcode/id497799835) desde la App Store.
  - Abre Xcode → Settings → Platforms → descarga el simulador de iOS.

- **Android Emulator**:
  - Instala [Android Studio](https://developer.android.com/studio).
  - Crea un dispositivo virtual en: More Actions → Virtual Device Manager.

#### 4. Watchman (recomendado en macOS)

Mejora el hot-reloading:
```bash
brew install watchman
```

### Para el Backend

#### 5. Python (v3.10 o superior)

- **macOS**:
  ```bash
  brew install python
  ```
- **Windows / Linux**: Descárgalo desde [https://python.org](https://python.org)
- Verificar:
  ```bash
  python3 --version
  ```

#### 6. PostgreSQL

MedEats usa PostgreSQL como base de datos.

- **macOS** (con Homebrew):
  ```bash
  brew install postgresql@16
  brew services start postgresql@16
  ```
- **Windows**: Descárgalo desde [https://postgresql.org/download](https://www.postgresql.org/download/)
- Verificar:
  ```bash
  psql --version
  ```

#### 7. Git

- **macOS**:
  ```bash
  brew install git
  ```
- **Windows**: Descárgalo desde [https://git-scm.com](https://git-scm.com)

---

## 📥 Instalación Paso a Paso

### Paso 1: Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd MedEats
```

### Paso 2: Configurar la App Móvil

```bash
cd med-eats-mobile
npm install
```

Esto instala todas las dependencias incluyendo:

| Dependencia | Uso |
|---|---|
| `expo` (~54.0.33) | Framework principal |
| `react-native-maps` (1.20.1) | Mapa interactivo (Apple Maps / Google Maps) |
| `expo-location` (~19.0.8) | Acceso al GPS del dispositivo |
| `expo-router` (~6.0.23) | Navegación basada en archivos |
| `@react-navigation/bottom-tabs` (^7.4.0) | Tabs inferiores (Home, Feed, Create, Profile) |
| `@expo/vector-icons` (^15.0.3) | Iconos (Ionicons) |

### Paso 3: Configurar el Backend

```bash
cd ../med-eats-backend
```

#### 3a. Crear un entorno virtual de Python

```bash
python3 -m venv venv
source venv/bin/activate    # macOS/Linux
# En Windows: venv\Scripts\activate
```

#### 3b. Instalar dependencias de Python

```bash
pip install -r requirements.txt
```

Las dependencias del backend son:

| Dependencia | Uso |
|---|---|
| `Django` (6.0.2) | Framework web |
| `djangorestframework` (3.16.1) | API REST (endpoints JSON) |
| `django-cors-headers` (4.9.0) | Permitir peticiones desde la app móvil |
| `psycopg2-binary` (2.9.11) | Conector de PostgreSQL |
| `pillow` (12.1.1) | Manejo de imágenes |

#### 3c. Crear la base de datos

```bash
createdb medeats
```

> Si estás en macOS con Homebrew, tu usuario de PostgreSQL ya existe automáticamente. La configuración en `settings.py` usa tu usuario de macOS.

#### 3d. Ejecutar las migraciones

```bash
python manage.py migrate
```

#### 3e. (Opcional) Crear un superusuario para el admin

```bash
python manage.py createsuperuser
```

---

## 🚀 Cómo Correr el Programa

Necesitas **2 terminales** abiertas simultáneamente:

### Terminal 1 — Backend (API)

```bash
cd med-eats-backend
source venv/bin/activate
python manage.py runserver
```

El backend correrá en: `http://localhost:8000`

Panel de administración: `http://localhost:8000/admin/`

### Terminal 2 — App Móvil

```bash
cd med-eats-mobile
npx expo start
```

Esto abrirá una terminal interactiva con un **código QR** y opciones:

| Tecla | Acción |
|---|---|
| `i` | Abrir en **iOS Simulator** |
| `a` | Abrir en **Android Emulator** |
| `w` | Abrir en el **navegador web** |
| `r` | Recargar la app |
| `j` | Abrir el debugger |

### Para probar en tu teléfono:

1. Asegúrate de que tu teléfono y computadora estén en la **misma red Wi-Fi**.
2. Abre **Expo Go** en tu teléfono.
3. Escanea el **código QR** que aparece en la terminal.

### Permisos importantes

Al abrir la app por primera vez, se pedirá permiso de **ubicación**. Esto es necesario para:
- Mostrar tu posición actual en el mapa (punto azul).
- Centrar el mapa en tu ubicación al tocar el botón de navegación (🧭).

---

## 📜 Scripts Disponibles

### App Móvil (desde `med-eats-mobile/`)

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo de Expo |
| `npm run ios` | Abre la app en el iOS Simulator |
| `npm run android` | Abre la app en el Android Emulator |
| `npm run web` | Abre la app en el navegador |
| `npm run lint` | Ejecuta ESLint para verificar el código |

### Backend (desde `med-eats-backend/` con el venv activado)

| Comando | Descripción |
|---|---|
| `python manage.py runserver` | Inicia el servidor API en puerto 8000 |
| `python manage.py migrate` | Aplica las migraciones a la base de datos |
| `python manage.py createsuperuser` | Crea un usuario administrador |
| `python manage.py makemigrations` | Genera migraciones cuando cambias modelos |

---

## 📂 Estructura del Proyecto

```
MedEats/
├── README.md                              # Este archivo
├── images/                                # Imágenes de documentación
│
├── med-eats-mobile/                       # 📱 APP MÓVIL
│   ├── app/                               # Rutas (file-based routing)
│   │   ├── _layout.tsx                    #   Layout raíz (ThemeProvider + Stack)
│   │   ├── modal.tsx                      #   Pantalla modal
│   │   ├── (tabs)/                        #   Navegación por tabs
│   │   │   ├── _layout.tsx                #     Configuración de los 4 tabs
│   │   │   ├── index.tsx                  #     Redirect → /home
│   │   │   ├── home/index.tsx             #     Tab Home (importa HomeScreen)
│   │   │   ├── feed/index.tsx             #     Tab Feed
│   │   │   ├── create/index.tsx           #     Tab Crear Publicación
│   │   │   └── profile/index.tsx          #     Tab Perfil
│   │   └── restaurant/
│   │       └── [id].tsx                   #   Detalle de restaurante (ruta dinámica)
│   │
│   ├── src/                               # Código fuente organizado
│   │   ├── screens/
│   │   │   └── home/
│   │   │       ├── homeScreen.tsx         #     Pantalla principal (mapa + búsqueda)
│   │   │       ├── mocks.ts              #     Datos mock de 5 restaurantes
│   │   │       └── components/
│   │   │           ├── mapView.tsx        #       Componente del mapa con marcadores
│   │   │           └── restaurantCard.tsx #       Card popup del restaurante
│   │   ├── hooks/
│   │   │   └── useUserLocation.ts        #     Hook para GPS y permisos de ubicación
│   │   ├── components/                    #     Componentes reutilizables
│   │   ├── context/                       #     Context providers
│   │   ├── models/                        #     Modelos/tipos TypeScript
│   │   ├── services/                      #     Servicios y API calls
│   │   ├── theme/                         #     Tema visual
│   │   └── utils/                         #     Utilidades
│   │
│   ├── constants/
│   │   └── theme.ts                       # Colores y tipografía (light/dark)
│   ├── hooks/                             # Hooks de Expo (color scheme)
│   ├── components/                        # Componentes base de Expo
│   ├── assets/images/                     # Íconos, splash screen
│   ├── package.json                       # Dependencias y scripts
│   ├── tsconfig.json                      # Configuración TypeScript
│   └── app.json                           # Configuración de Expo
│
└── med-eats-backend/                      # 🖥️ BACKEND API
    ├── manage.py                          # CLI de Django
    ├── requirements.txt                   # Dependencias Python
    ├── config/                            # Configuración del proyecto
    │   ├── settings.py                    #   Settings (DB, CORS, DRF, etc.)
    │   ├── urls.py                        #   URLs raíz
    │   ├── wsgi.py                        #   Servidor WSGI
    │   └── asgi.py                        #   Servidor ASGI
    └── restaurants/                       # App de restaurantes
        ├── models.py                      #   Modelos de datos
        ├── views.py                       #   Vistas/endpoints API
        ├── admin.py                       #   Configuración del admin
        ├── apps.py                        #   Configuración de la app
        ├── tests.py                       #   Tests
        └── migrations/                    #   Migraciones de DB
```

---

## 🧰 Tecnologías Utilizadas

### App Móvil

| Tecnología | Versión | Uso |
|---|---|---|
| **React Native** | 0.81.5 | Framework para apps móviles nativas |
| **Expo** | ~54.0.33 | Plataforma de desarrollo y build |
| **TypeScript** | ~5.9.2 | Tipado estático |
| **Expo Router** | ~6.0.23 | Navegación basada en archivos |
| **React Navigation** | 7.x | Tabs y navegación entre pantallas |
| **react-native-maps** | 1.20.1 | Mapa interactivo con marcadores |
| **expo-location** | ~19.0.8 | GPS y permisos de ubicación |
| **Ionicons** | (via @expo/vector-icons) | Iconos de la interfaz |

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| **Python** | 3.10+ | Lenguaje del backend |
| **Django** | 6.0.2 | Framework web |
| **Django REST Framework** | 3.16.1 | API REST (endpoints JSON) |
| **PostgreSQL** | 16.x | Base de datos relacional |
| **django-cors-headers** | 4.9.0 | Permitir peticiones cross-origin |
| **Pillow** | 12.1.1 | Procesamiento de imágenes |

---

## 📱 Pantallas de la App

| Pantalla | Tab | Estado | Descripción |
|----------|-----|--------|-------------|
| **Home** | 🏠 Home | ✅ Funcional | Mapa interactivo con marcadores, búsqueda, ubicación GPS |
| **Feed** | 📋 Feed | 🔲 Pendiente | Feed social con posts de usuarios |
| **Create** | ➕ Create | 🔲 Pendiente | Crear publicaciones con fotos y reseñas |
| **Profile** | 👤 Profile | 🔲 Pendiente | Perfil del usuario |
| **Restaurant Detail** | — | 🔲 Pendiente | Detalle completo de un restaurante |

### Funcionalidades implementadas en Home:

- ✅ Mapa centrado en Medellín con 5 restaurantes mock
- ✅ Marcadores naranjas en las ubicaciones de los restaurantes
- ✅ Barra de búsqueda con filtrado por nombre y categoría
- ✅ Zoom animado a los resultados al presionar Enter
- ✅ Card popup al tocar un marcador (imagen, rating, categoría, botón "Ver Detalles")
- ✅ Solicitud de permisos de ubicación GPS
- ✅ Punto azul mostrando la ubicación actual del usuario
- ✅ Botón de navegación que centra el mapa en la ubicación del usuario
- ✅ Tag "Restaurante" como indicador visual

---

## 🔧 Solución de Problemas

### App Móvil

#### Error: "Unable to resolve module"
```bash
cd med-eats-mobile
rm -rf node_modules
npm install
npx expo start --clear
```

#### La app no se conecta desde el teléfono
- Verifica que ambos dispositivos estén en la **misma red Wi-Fi**.
- Usa modo tunnel:
  ```bash
  npx expo start --tunnel
  ```

#### El mapa no muestra la ubicación del usuario
- Asegúrate de aceptar el permiso de ubicación cuando la app lo solicite.
- En iOS Simulator: Features → Location → Custom Location (coordenadas de Medellín: `6.2442`, `-75.5812`).
- En dispositivo físico: el GPS debe estar activado.

#### El simulador de iOS no abre
- Verifica que Xcode esté instalado y actualizado.
- Abre el simulador manualmente: `open -a Simulator`

### Backend

#### Error: "role does not exist" al hacer migrate
Tu usuario de PostgreSQL no existe. Créalo:
```bash
createuser -s $(whoami)
```

#### Error: "database medeats does not exist"
Crea la base de datos:
```bash
createdb medeats
```

#### Error: "No module named 'django'"
Asegúrate de activar el entorno virtual:
```bash
source venv/bin/activate
```

#### Puerto 8000 ya en uso
```bash
lsof -i :8000
kill -9 <PID>
```

---

## 👥 Equipo

| Nombre | Rol | Email |
|--------|-----|-------|
| Camilo Alvarez | Developer | calvarezv1@eafit.edu.co |
| Matias Monsalve | Developer | mmonsalvr1@eafit.edu.co |
| Samuel Calderon | Developer | sscalderod@eafit.edu.co |

---

## 📄 Licencia

Este proyecto es académico y de uso interno — Universidad EAFIT.

---

> **Tip:** Para una experiencia de desarrollo óptima, se recomienda usar [VS Code](https://code.visualstudio.com/) con las extensiones **ES7+ React/Redux/React-Native Snippets**, **Expo Tools** y **Python**.
