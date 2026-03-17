export interface Restaurant {
  id: string;
  name: string;
  category: string;
  rating: number;
  image: string;
  location: string;
  description: string;
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  location: string;
  avatar: string;
  followers: number;
  following: number;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  restaurantId: string;
  restaurantName: string;
  image: string;
  rating: number;
  caption: string;
  likes: number;
  isLiked: boolean;
  comments: number;
  date: string;
}

export const currentUser: User = {
  id: "user1",
  username: "foodlover_med",
  name: "Sofía Martínez",
  bio: "Descubriendo los mejores sabores de la ciudad",
  location: "Medellín, Colombia",
  avatar: "https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDA0OTU1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  followers: 1200,
  following: 348
};

export const restaurants: Restaurant[] = [
  {
    id: "r1",
    name: "La Casa de las Arepas",
    category: "Colombian Traditional",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1702827496422-edff3a844c9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmVwYXMlMjBDb2xvbWJpYW4lMjBmb29kJTIwY2xvc2UlMjB1cHxlbnwxfHx8fDE3NzAwNzYzNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "El Poblado, Medellín",
    description: "Authentic Colombian arepas with traditional fillings. Family recipes passed down for generations.",
    latitude: 6.2088,
    longitude: -75.5697
  },
  {
    id: "r2",
    name: "Bandeja Paisa Tradicional",
    category: "Colombian Traditional",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1723693407562-bb4fcae76797?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5kZWphJTIwcGFpc2ElMjBDb2xvbWJpYW4lMjBmb29kfGVufDF8fHx8MTc3MDA3NjM1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "Laureles, Medellín",
    description: "The best Bandeja Paisa in town. Generous portions and authentic flavors.",
    latitude: 6.2442,
    longitude: -75.5950
  },
  {
    id: "r3",
    name: "Empanadas del Parque",
    category: "Colombian Street Food",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1667113227378-f4fe9f7cd468?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXBhbmFkYXMlMjBmb29kJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzcwMDc2MzYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "Parque Lleras, El Poblado",
    description: "Crispy empanadas with a variety of fillings. Perfect for a quick bite!",
    latitude: 6.2099,
    longitude: -75.5658
  },
  {
    id: "r4",
    name: "Burger Lab",
    category: "Burgers & American",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1761315413256-e149b40f577b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjBnb3VybWV0JTIwZm9vZCUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc3MDA1MjczMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "Manila, El Poblado",
    description: "Gourmet burgers with creative combinations. Craft beers available.",
    latitude: 6.2115,
    longitude: -75.5710
  },
  {
    id: "r5",
    name: "Sushi Zen",
    category: "Japanese & Sushi",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1769514555848-3cbc35358b9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXIlMjByZXN0YXVyYW50fGVufDF8fHx8MTc3MDAzNDQzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "Provenza, El Poblado",
    description: "Fresh sushi and Japanese cuisine. Zen atmosphere and excellent service.",
    latitude: 6.2074,
    longitude: -75.5658
  },
  {
    id: "r6",
    name: "Pizzería Napoli",
    category: "Italian & Pizza",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1689150911817-3e27168ab6a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHdvb2QlMjBmaXJlZCUyMG92ZW58ZW58MXx8fHwxNzY5OTc0ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    location: "Laureles, Medellín",
    description: "Wood-fired pizzas with imported Italian ingredients. Authentic taste of Naples.",
    latitude: 6.2465,
    longitude: -75.5902
  }
];

export const reviews: Review[] = [
  {
    id: "rev1",
    userId: "user2",
    username: "carlos_foodie",
    avatar: "https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDAxNTM3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    comment: "¡Increíble! Las mejores arepas que he probado en Medellín. El ambiente es muy acogedor.",
    date: "2026-01-28"
  },
  {
    id: "rev2",
    userId: "user3",
    username: "maria_eats",
    avatar: "https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDA0OTU1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    comment: "Excelente relación calidad-precio. Las arepas están recién hechas y los ingredientes son frescos.",
    date: "2026-01-25"
  },
  {
    id: "rev3",
    userId: "user4",
    username: "andres_med",
    avatar: "https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDAxNTM3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4,
    comment: "Muy buenas arepas, aunque a veces hay que esperar un poco. Vale la pena!",
    date: "2026-01-20"
  }
];

export const posts: Post[] = [
  {
    id: "p1",
    userId: "user2",
    username: "carlos_foodie",
    userAvatar: "https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDAxNTM3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    restaurantId: "r1",
    restaurantName: "La Casa de las Arepas",
    image: "https://images.unsplash.com/photo-1702827496422-edff3a844c9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmVwYXMlMjBDb2xvbWJpYW4lMjBmb29kJTIwY2xvc2UlMjB1cHxlbnwxfHx8fDE3NzAwNzYzNjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    caption: "¡Las mejores arepas de Medellín! 🔥 La arepa de queso con hogao está increíble. Totalmente recomendado para el desayuno.",
    likes: 124,
    isLiked: false,
    comments: 18,
    date: "2026-02-01"
  },
  {
    id: "p2",
    userId: "user3",
    username: "maria_eats",
    userAvatar: "https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDA0OTU1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    restaurantId: "r2",
    restaurantName: "Bandeja Paisa Tradicional",
    image: "https://images.unsplash.com/photo-1723693407562-bb4fcae76797?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5kZWphJTIwcGFpc2ElMjBDb2xvbWJpYW4lMjBmb29kfGVufDF8fHx8MTc3MDA3NjM1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    caption: "Bandeja paisa perfecta para compartir 😍 Las porciones son enormes y todo está delicioso. El chicharrón está crocante!",
    likes: 203,
    isLiked: true,
    comments: 31,
    date: "2026-01-31"
  },
  {
    id: "p3",
    userId: "user4",
    username: "andres_med",
    userAvatar: "https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDAxNTM3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    restaurantId: "r4",
    restaurantName: "Burger Lab",
    image: "https://images.unsplash.com/photo-1761315413256-e149b40f577b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjBnb3VybWV0JTIwZm9vZCUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc3MDA1MjczMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    caption: "Esta burger es una obra de arte 🍔 La combinación de sabores es increíble. Pidan la que tiene tocino caramelizado!",
    likes: 156,
    isLiked: true,
    comments: 24,
    date: "2026-01-30"
  },
  {
    id: "p4",
    userId: "user1",
    username: "foodlover_med",
    userAvatar: "https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDA0OTU1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    restaurantId: "r5",
    restaurantName: "Sushi Zen",
    image: "https://images.unsplash.com/photo-1769514555848-3cbc35358b9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXIlMjByZXN0YXVyYW50fGVufDF8fHx8MTc3MDAzNDQzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    caption: "Mejor sushi en Medellín, sin duda 🍣 El pescado es súper fresco y la presentación es hermosa. Ambiente relajante!",
    likes: 189,
    isLiked: false,
    comments: 27,
    date: "2026-01-29"
  },
  {
    id: "p5",
    userId: "user5",
    username: "sofia_gourmet",
    userAvatar: "https://images.unsplash.com/photo-1614436201459-156d322d38c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDA0OTU1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    restaurantId: "r6",
    restaurantName: "Pizzería Napoli",
    image: "https://images.unsplash.com/photo-1689150911817-3e27168ab6a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHdvb2QlMjBmaXJlZCUyMG92ZW58ZW58MXx8fHwxNzY5OTc0ODQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 5,
    caption: "Pizza napolitana auténtica 🍕 La masa es perfecta y los ingredientes son importados de Italia. Como estar en Nápoles!",
    likes: 142,
    isLiked: false,
    comments: 19,
    date: "2026-01-28"
  },
  {
    id: "p6",
    userId: "user2",
    username: "carlos_foodie",
    userAvatar: "https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MDAxNTM3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    restaurantId: "r3",
    restaurantName: "Empanadas del Parque",
    image: "https://images.unsplash.com/photo-1667113227378-f4fe9f7cd468?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXBhbmFkYXMlMjBmb29kJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzcwMDc2MzYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    rating: 4,
    caption: "Empanadas perfectas para un snack 🥟 Crujientes por fuera y jugosas por dentro. Prueben la de carne!",
    likes: 98,
    isLiked: true,
    comments: 12,
    date: "2026-01-27"
  }
];

export const userPosts: Post[] = posts.filter(p => p.userId === currentUser.id);

export const visitedRestaurants = [
  { restaurantId: "r5", rating: 5, visitDate: "2026-01-29" },
  { restaurantId: "r1", rating: 5, visitDate: "2026-01-15" },
  { restaurantId: "r4", rating: 4, visitDate: "2026-01-08" }
];