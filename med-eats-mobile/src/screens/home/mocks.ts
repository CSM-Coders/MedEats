// Tipo que define la estructura de un restaurante
export type Restaurant = {
  id: string;
  name: string;
  category: string;
  rating: number;
  time: string;
  image: string;
  latitude: number;
  longitude: number;
};

// Coordenadas del centro de Medellín para centrar el mapa
export const MEDELLIN_REGION = {
  latitude: 6.2442,        // Latitud del centro de Medellín
  longitude: -75.5812,     // Longitud del centro de Medellín
  latitudeDelta: 0.08,     // Qué tan "zoom out" está el mapa verticalmente
  longitudeDelta: 0.08,    // Qué tan "zoom out" está el mapa horizontalmente
};

// Datos mock de restaurantes con coordenadas reales de Medellín
export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "Sushi Zen",
    category: "Japanese & Sushi",
    rating: 4.9,
    time: "25 min",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
    latitude: 6.2100,
    longitude: -75.5700,
  },
  {
    id: "2",
    name: "La Casa de las Arepas",
    category: "Comida Típica",
    rating: 5.0,
    time: "15 min",
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
    latitude: 6.2500,
    longitude: -75.5650,
  },
  {
    id: "3",
    name: "Green Bowl",
    category: "Comida Saludable",
    rating: 4.5,
    time: "20 min",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    latitude: 6.2550,
    longitude: -75.5900,
  },
  {
    id: "4",
    name: "Burger Master",
    category: "Burgers & Grill",
    rating: 4.7,
    time: "30 min",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    latitude: 6.2350,
    longitude: -75.5750,
  },
  {
    id: "5",
    name: "Pasta & Vino",
    category: "Italian",
    rating: 4.8,
    time: "35 min",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400",
    latitude: 6.2090,
    longitude: -75.5620,
  },
];
