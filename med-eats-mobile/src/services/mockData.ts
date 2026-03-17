import { AppUser, Post, Restaurant, Review, VisitedRestaurant } from "@/src/models/domain";

export const MEDELLIN_REGION = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "La Casa de las Arepas",
    category: "Colombian Traditional",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1702827496422-edff3a844c9c?w=400",
    latitude: 6.2088,
    longitude: -75.5697,
    location: "El Poblado, Medellín",
    description: "Arepas tradicionales con recetas paisas y ambiente familiar.",
    menuHighlights: ["Arepa de choclo", "Arepa con hogao", "Chocolate caliente"],
    whatsapp: "573001112233",
  },
  {
    id: "2",
    name: "Sushi Zen",
    category: "Japanese & Sushi",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
    latitude: 6.2100,
    longitude: -75.5700,
    location: "Provenza, El Poblado",
    description: "Sushi premium y cocina japonesa en un ambiente zen.",
    menuHighlights: ["Sashimi mixto", "Roll tempura", "Ramen tonkotsu"],
    whatsapp: "573004445566",
  },
  {
    id: "3",
    name: "Burger Lab",
    category: "Burgers & Grill",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    latitude: 6.2350,
    longitude: -75.5750,
    location: "Manila, El Poblado",
    description: "Hamburguesas artesanales con ingredientes locales.",
    menuHighlights: ["Smash burger", "Papas trufadas", "Milkshake de vainilla"],
    whatsapp: "573002224466",
  },
  {
    id: "4",
    name: "Pizzería Napoli",
    category: "Italian & Pizza",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400",
    latitude: 6.2465,
    longitude: -75.5902,
    location: "Laureles, Medellín",
    description: "Pizza napolitana al horno de piedra.",
    menuHighlights: ["Margherita", "Prosciutto e funghi", "Tiramisú"],
    whatsapp: "573007778899",
  },
  {
    id: "5",
    name: "Green Bowl",
    category: "Healthy Food",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    latitude: 6.2550,
    longitude: -75.5900,
    location: "Laureles, Medellín",
    description: "Bowls saludables, opciones veganas y jugos naturales.",
    menuHighlights: ["Bowl mediterráneo", "Wrap vegano", "Jugo verde"],
    whatsapp: "573005551100",
  },
];

export const currentUser: AppUser = {
  id: "u1",
  username: "foodlover_med",
  name: "Sofía Martínez",
  bio: "Descubriendo sabores por toda Medellín.",
  location: "Medellín, Colombia",
  followers: 1200,
  following: 348,
};

export const initialPosts: Post[] = [
  {
    id: "p1",
    userId: "u2",
    username: "carlos_foodie",
    userAvatar: "https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?w=200",
    restaurantId: "1",
    restaurantName: "La Casa de las Arepas",
    image: "https://images.unsplash.com/photo-1702827496422-edff3a844c9c?w=600",
    rating: 5,
    caption: "Top arepas para empezar el día 🔥",
    likes: 124,
    comments: 18,
    date: "2026-02-01",
    isLiked: false,
  },
  {
    id: "p2",
    userId: "u3",
    username: "maria_eats",
    userAvatar: "https://images.unsplash.com/photo-1614436201459-156d322d38c6?w=200",
    restaurantId: "3",
    restaurantName: "Burger Lab",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
    rating: 5,
    caption: "La mejor burger smash que he probado 🍔",
    likes: 203,
    comments: 31,
    date: "2026-01-31",
    isLiked: true,
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    restaurantId: "1",
    username: "andres_med",
    avatar: "https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?w=200",
    rating: 5,
    comment: "Excelente sabor y porciones generosas.",
    date: "2026-01-25",
  },
  {
    id: "r2",
    restaurantId: "1",
    username: "maria_eats",
    avatar: "https://images.unsplash.com/photo-1614436201459-156d322d38c6?w=200",
    rating: 4,
    comment: "Muy rico, volvería sin duda.",
    date: "2026-01-20",
  },
  {
    id: "r3",
    restaurantId: "2",
    username: "luisa_food",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200",
    rating: 5,
    comment: "Sushi fresco y súper presentación.",
    date: "2026-02-02",
  },
];

export const visitedRestaurants: VisitedRestaurant[] = [
  { restaurantId: "2", rating: 5, visitDate: "2026-01-29" },
  { restaurantId: "1", rating: 5, visitDate: "2026-01-15" },
  { restaurantId: "3", rating: 4, visitDate: "2026-01-08" },
];

export function getRestaurantById(id: string) {
  return restaurants.find((restaurant) => restaurant.id === id);
}

export function getReviewsByRestaurantId(restaurantId: string) {
  return reviews.filter((review) => review.restaurantId === restaurantId);
}

export function semanticCategoryMatches(query: string, category: string) {
  const q = query.toLowerCase().trim();
  const c = category.toLowerCase();

  const dictionary: string[][] = [
    ["japanese", "sushi", "asiática", "asiatica"],
    ["burger", "hamburguesa", "grill"],
    ["pizza", "italian", "italiana"],
    ["healthy", "vegano", "ensalada", "fit"],
    ["colombian", "tradicional", "comida típica", "arepa"],
  ];

  return dictionary.some((group) => {
    const queryBelongsToGroup = group.some((term) => q.includes(term));
    const categoryBelongsToGroup = group.some((term) => c.includes(term));

    return queryBelongsToGroup && categoryBelongsToGroup;
  });
}

export function getDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(latitudeB - latitudeA);
  const dLon = toRad(longitudeB - longitudeA);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(latitudeA)) *
      Math.cos(toRad(latitudeB)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earth * c;
}
