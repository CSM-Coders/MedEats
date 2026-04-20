import os
import django
import sys

# Configurar el entorno de Django para poder usar los modelos en un script externo
sys.path.append("/Users/camiloalvarez/Documents/MedEats/med-eats-backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from restaurants.models import Category, Restaurant, Review  # noqa: E402


def seed_data():
    print("Iniciando la inserción masiva de datos (Seeding)...")

    # 1. Crear Categorías en la Base de Datos
    cat_tradicional, _ = Category.objects.get_or_create(name="Colombian Traditional")
    cat_japon, _ = Category.objects.get_or_create(name="Japanese & Sushi")
    cat_burger, _ = Category.objects.get_or_create(name="Burgers & Grill")
    cat_pizza, _ = Category.objects.get_or_create(name="Italian & Pizza")
    cat_healthy, _ = Category.objects.get_or_create(name="Healthy Food")
    cat_mexican, _ = Category.objects.get_or_create(name="Mexican")
    cat_cafe, _ = Category.objects.get_or_create(name="Café & Bakery")
    cat_peruvian, _ = Category.objects.get_or_create(name="Peruvian")

    # Restauramos las Unsplash que sí funcionaban y usamos las garantizadas (.jpeg) solo para los 5 que reportaste.
    restaurants_data = [
        # --- COLOMBIAN TRADITIONAL ---
        {
            "name": "Mondongo's El Poblado",
            "category": cat_tradicional,
            "rating": 4.8,
            "image": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",  # Pexels (Arreglado)
            "latitude": 6.2088,
            "longitude": -75.5697,
            "location": "El Poblado, Medellín",
            "description": "Famoso restaurante tradicional colombiano especializado en sopa de mondongo y bandeja paisa.",
            "menu_highlights": ["Mondongo", "Bandeja Paisa", "Cazuela de Frijoles"],
            "whatsapp": "+573104567890",
        },
        {
            "name": "Hacienda Origen",
            "category": cat_tradicional,
            "rating": 4.6,
            "image": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",  # Unsplash
            "latitude": 6.2486,
            "longitude": -75.5742,
            "location": "Centro, Medellín (La Strada)",
            "description": "Un clásico paisa con decoración tradicional que te hará sentir como en una finca cafetera.",
            "menu_highlights": [
                "Chicharrón de 100 patas",
                "Arepa de chócolo",
                "Aguapanela con queso",
            ],
            "whatsapp": "+573001234567",
        },
        {
            "name": "Alambique",
            "category": cat_tradicional,
            "rating": 4.9,
            "image": "https://images.unsplash.com/photo-1585518419759-7fe2e0fbf8a6?w=800",  # Unsplash
            "latitude": 6.2095,
            "longitude": -75.5683,
            "location": "El Poblado, Medellín",
            "description": "Un patio mágico sobre una terraza. Comida de autor colombiana y coctelería experimental.",
            "menu_highlights": [
                "Lomo al trapo",
                "Ceviche de chicharrón",
                "Cóctel con Viche",
            ],
            "whatsapp": "+573112223344",
        },
        {
            "name": "Crepes & Waffles",
            "category": cat_tradicional,
            "rating": 4.8,
            "image": "https://images.pexels.com/photos/2085025/pexels-photo-2085025.jpeg",  # Pexels (Arreglado)
            "latitude": 6.1989,
            "longitude": -75.5724,
            "location": "Centro Comercial Oviedo",
            "description": "El restaurante de tradición colombiana de madres cabeza de familia. Siempre delicioso y asequible.",
            "menu_highlights": [
                "Crepe Pollo y Champiñones",
                "Waffle de Nutella y Helado",
                "Mini Waffle",
            ],
            "whatsapp": "+573009990000",
        },
        {
            "name": "El Rancherito",
            "category": cat_tradicional,
            "rating": 4.7,
            "image": "https://images.pexels.com/photos/3186654/pexels-photo-3186654.jpeg",  # Pexels (Arreglado)
            "latitude": 6.1822,
            "longitude": -75.5841,
            "location": "Avenida Las Vegas, Envigado",
            "description": "La verdadera sazón antioqueña en porciones gigantes especiales para domingos en familia.",
            "menu_highlights": [
                "Canchina (Picada)",
                "Bandeja Antioqueña",
                "Arepa de chócolo con queso",
            ],
            "whatsapp": "+573002221111",
        },
        # --- BURGERS & GRILL ---
        {
            "name": "Chef Burger Manila",
            "category": cat_burger,
            "rating": 4.6,
            "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",  # Unsplash
            "latitude": 6.2150,
            "longitude": -75.5750,
            "location": "Manila, El Poblado",
            "description": "Hamburguesas artesanales de autor con ingredientes locales en un ambiente rockero increíble.",
            "menu_highlights": ["Chef Burger", "Papas trufadas", "Milkshake de Oreo"],
            "whatsapp": "+573002224466",
        },
        {
            "name": "La Maestranza",
            "category": cat_burger,
            "rating": 4.7,
            "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800",  # Unsplash
            "latitude": 6.2435,
            "longitude": -75.5910,
            "location": "Laureles, Medellín",
            "description": "Carnes maduradas a la brasa y unas hamburguesas ahumadas espectaculares.",
            "menu_highlights": [
                "Smash Burger",
                "Brisket ahumado",
                "Costillas St. Louis",
            ],
            "whatsapp": "+573009998877",
        },
        {
            "name": "Jack the Grill",
            "category": cat_burger,
            "rating": 4.5,
            "image": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800",  # Unsplash
            "latitude": 6.1712,
            "longitude": -75.5899,
            "location": "Envigado",
            "description": "Boutique de carne y parrilla urbana. El mejor 'Pulled Pork' al sur de la ciudad.",
            "menu_highlights": ["Jack's Burger", "Pulled pork sandwich"],
            "whatsapp": "+573001112233",
        },
        # --- PREUVIAN & JAPANESE ---
        {
            "name": "Sushi Zen",
            "category": cat_japon,
            "rating": 4.7,
            "image": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",  # Unsplash
            "latitude": 6.2100,
            "longitude": -75.5700,
            "location": "Provenza, El Poblado",
            "description": "Sushi premium en un ambiente relajante. Barras de Omakase dirigidas por expertos.",
            "menu_highlights": ["Sashimi mixto", "Roll tempura", "Nigiri trufado"],
            "whatsapp": "+573004445566",
        },
        {
            "name": "Envy Roof Top",
            "category": cat_japon,
            "rating": 4.8,
            "image": "https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg",  # Pexels (Arreglado)
            "latitude": 6.2085,
            "longitude": -75.5666,
            "location": "Parque Lleras, Medellín",
            "description": "Sushi en las alturas con vista panorámica de la ciudad y piscina transparente. Ideal para el atardecer.",
            "menu_highlights": [
                "Volcano Roll",
                "Coctelería asiática",
                "Gyozas de Wagyu",
            ],
            "whatsapp": "+573007771122",
        },
        {
            "name": "Rocoto",
            "category": cat_peruvian,
            "rating": 4.6,
            "image": "https://images.pexels.com/photos/286283/pexels-photo-286283.jpeg",  # Pexels (Arreglado)
            "latitude": 6.2411,
            "longitude": -75.5890,
            "location": "Laureles, Medellín",
            "description": "Auténtica comida peruana en Medellín. Ceviches frescos todos los días traídos del pacífico.",
            "menu_highlights": ["Ceviche Rocoto", "Lomo Saltado", "Pisco Sour"],
            "whatsapp": "+573005556677",
        },
        # --- ITALIAN & PIZZA ---
        {
            "name": "Pizzería Olivia Laureles",
            "category": cat_pizza,
            "rating": 4.8,
            "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800",  # Unsplash
            "latitude": 6.2465,
            "longitude": -75.5902,
            "location": "Laureles, Medellín",
            "description": "Pizzería sostenible y cocina italiana consciente de masa madre.",
            "menu_highlights": [
                "Pizza Margarita",
                "Pasta Fresca al Pesto",
                "Brownie Vegano",
            ],
            "whatsapp": "+573007778899",
        },
        {
            "name": "Pizzaiolo",
            "category": cat_pizza,
            "rating": 4.7,
            "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",  # Unsplash
            "latitude": 6.2099,
            "longitude": -75.5710,
            "location": "Vía Primavera, El Poblado",
            "description": "Estilo Napoli. Horno de leña visible desde la calle y ambiente urbano chic.",
            "menu_highlights": ["Pizza Burrata", "Calzone Clásico", "Limoncello"],
            "whatsapp": "+573003332211",
        },
        {
            "name": "Romero Cocina",
            "category": cat_pizza,
            "rating": 4.9,
            "image": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",  # Unsplash
            "latitude": 6.1764,
            "longitude": -75.5912,
            "location": "Buena Mesa, Envigado",
            "description": "Pasta fresca hecha a mano diariamente. Sabor verdaderamente casero de la abuela italiana.",
            "menu_highlights": [
                "Raviolis 4 quesos",
                "Lasagna de carne madurada",
                "Sangría",
            ],
            "whatsapp": "+573006669988",
        },
        # --- HEALTHY & CAFE ---
        {
            "name": "Pergamino Café",
            "category": cat_cafe,
            "rating": 4.9,
            "image": "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800",  # Unsplash
            "latitude": 6.2081,
            "longitude": -75.5682,
            "location": "Vía Primavera, Medellín",
            "description": "Uno de los cafés especiales más famosos del mundo. Ganadores de múltiples premios de tostión.",
            "menu_highlights": ["Cold Brew", "Latte Fincas", "Torta de Zanahoria"],
            "whatsapp": "+573004443322",
        },
        {
            "name": "Rituales Compañía",
            "category": cat_cafe,
            "rating": 4.8,
            "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",  # Unsplash
            "latitude": 6.2415,
            "longitude": -75.5950,
            "location": "Barrio La Milagrosa",
            "description": "Café de origen de los barrios altos de Medellín, apoyando la economía de paz y desarrollo social.",
            "menu_highlights": ["Filter V60", "Sándwich de pavo"],
            "whatsapp": "+573001119988",
        },
        {
            "name": "Green Bowl",
            "category": cat_healthy,
            "rating": 4.5,
            "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",  # Unsplash
            "latitude": 6.2166,
            "longitude": -75.5741,
            "location": "Manila, El Poblado",
            "description": "La mejor opción para almorzar rico y nutritivo después del gimnasio sin remordimientos.",
            "menu_highlights": ["Bowl Tahini", "Wrap Vegano", "Jugo detox"],
            "whatsapp": "+573008887766",
        },
        {
            "name": "Salad Bar",
            "category": cat_healthy,
            "rating": 4.4,
            "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",  # Unsplash
            "latitude": 6.2450,
            "longitude": -75.5890,
            "location": "Primer Parque de Laureles",
            "description": "Tú diseñas tu propia ensalada eligiendo entre más de 40 ingredientes ultrafrescos de granjas.",
            "menu_highlights": ["Arma tu Ensalada", "Açai Bowl", "Kombucha"],
            "whatsapp": "+573005554433",
        },
        # --- MEXICAN ---
        {
            "name": "La Taquería",
            "category": cat_mexican,
            "rating": 4.7,
            "image": "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=800",  # Unsplash
            "latitude": 6.2085,
            "longitude": -75.5695,
            "location": "Provenza, El Poblado",
            "description": "Tacos al pastor estilo callejero de Ciudad de México en un ambiente fiestero inigualable.",
            "menu_highlights": ["Tacos al Pastor", "Margarita de Mango", "Esquites"],
            "whatsapp": "+573111223344",
        },
        {
            "name": "Dos Santos",
            "category": cat_mexican,
            "rating": 4.8,
            "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",  # Unsplash
            "latitude": 6.2078,
            "longitude": -75.5683,
            "location": "Vía Primavera, El Poblado",
            "description": "Alta cocina mexicana. Platillos tradicionales presentados como verdaderas obras de arte visual.",
            "menu_highlights": [
                "Trompo al Pastor gigante",
                "Queso Fundido",
                "Ceviche Acapulco",
            ],
            "whatsapp": "+573003334455",
        },
    ]

    print(f"Total a insertar/actualizar: {len(restaurants_data)} restaurantes")
    for data in restaurants_data:
        # Usamos update_or_create para que si ya existe, lo actualice (en lugar de duplicarlo).
        restaurant, created = Restaurant.objects.update_or_create(
            name=data["name"], defaults=data
        )
        if created:
            print(f"✅ Creado: {restaurant.name}")
        else:
            print(f"🔄 Actualizado: {restaurant.name}")

    print("\n--- ¡RESTAURADAS LAS DE UNSPLASH Y ARREGLADAS LAS 5 DE PEXELS! ---")

    reviews_data = [
        {
            "restaurant_name": "Mondongo's El Poblado",
            "username": "andres_med",
            "avatar": "https://images.unsplash.com/photo-1762708590808-c453c0e4fb0f?w=200",
            "rating": 5,
            "comment": "Excelente sabor y porciones generosas.",
        },
        {
            "restaurant_name": "Mondongo's El Poblado",
            "username": "maria_eats",
            "avatar": "https://images.unsplash.com/photo-1614436201459-156d322d38c6?w=200",
            "rating": 4,
            "comment": "Muy rico, volvería sin duda.",
        },
        {
            "restaurant_name": "Sushi Zen",
            "username": "luisa_food",
            "avatar": "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200",
            "rating": 5,
            "comment": "Sushi fresco y súper presentación.",
        },
    ]

    print(f"Total a insertar/actualizar: {len(reviews_data)} reviews")
    for data in reviews_data:
        restaurant = Restaurant.objects.get(name=data["restaurant_name"])
        review, created = Review.objects.update_or_create(
            restaurant=restaurant,
            username=data["username"],
            comment=data["comment"],
            defaults={
                "restaurant": restaurant,
                "username": data["username"],
                "avatar": data["avatar"],
                "rating": data["rating"],
                "comment": data["comment"],
            },
        )
        if created:
            print(f"✅ Review creada: {review.username} -> {review.restaurant.name}")
        else:
            print(f"🔄 Review actualizada: {review.username} -> {review.restaurant.name}")


if __name__ == "__main__":
    seed_data()
