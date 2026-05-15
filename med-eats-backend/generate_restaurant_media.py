#!/usr/bin/env python
"""
Script para generar fotos y menús únicos para los 200 restaurantes existentes.
Cada restaurante tendrá:
- Una imagen distintiva (800x600) con diseño único basado en su categoría y nombre
- Un menú PDF único con platillos que reflejen su categoría
"""

import os
import sys
import django
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
import random
import hashlib

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from restaurants.models import Restaurant, Category
from django.core.files.base import ContentFile
from django.utils.text import slugify

# ============================================================
# COLORES POR CATEGORÍA
# ============================================================
CATEGORY_COLORS = {
    'Colombian Traditional': '#E74C3C',  # Rojo
    'Italian & Pizza': '#F39C12',        # Naranja
    'Japanese & Sushi': '#3498DB',       # Azul
    'Mexican': '#27AE60',                # Verde
    'Peruvian': '#E67E22',               # Naranja oscuro
    'Burgers & Casual': '#C0392B',       # Rojo oscuro
    'Cafes & Coffee': '#795548',         # Marrón
    'Vegetarian & Healthy': '#16A085',   # Verde azulado
}

# ============================================================
# PLATILLOS POR CATEGORÍA
# ============================================================
DISHES_BY_CATEGORY = {
    'Colombian Traditional': [
        ('Bandeja Paisa', '$25.000'),
        ('Ajiaco Bogotano', '$18.000'),
        ('Sancocho', '$20.000'),
        ('Arepa con Queso', '$8.000'),
        ('Empanadas', '$6.000'),
        ('Patacones', '$9.000'),
        ('Mofongo', '$12.000'),
        ('Ropa Vieja', '$19.000'),
    ],
    'Italian & Pizza': [
        ('Margherita Pizza', '$22.000'),
        ('Lasagna', '$18.000'),
        ('Fettuccine Alfredo', '$20.000'),
        ('Risotto al Funghi', '$21.000'),
        ('Ravioli Ricotta', '$19.000'),
        ('Tiramisu', '$8.000'),
        ('Panna Cotta', '$7.000'),
        ('Bruschetta', '$12.000'),
    ],
    'Japanese & Sushi': [
        ('California Roll', '$24.000'),
        ('Dragon Roll', '$28.000'),
        ('Nigiri Set', '$32.000'),
        ('Ramen', '$16.000'),
        ('Tempura', '$18.000'),
        ('Edamame', '$8.000'),
        ('Miso Soup', '$6.000'),
        ('Yakitori', '$15.000'),
    ],
    'Mexican': [
        ('Tacos al Pastor', '$18.000'),
        ('Enchiladas', '$20.000'),
        ('Mole Poblano', '$22.000'),
        ('Chiles Rellenos', '$19.000'),
        ('Ceviche', '$21.000'),
        ('Guacamole', '$10.000'),
        ('Quesadillas', '$12.000'),
        ('Churros', '$7.000'),
    ],
    'Peruvian': [
        ('Ceviche', '$24.000'),
        ('Lomo Saltado', '$22.000'),
        ('Aji de Gallina', '$20.000'),
        ('Papa a la Huancaína', '$18.000'),
        ('Causa Limeña', '$16.000'),
        ('Choclo con Queso', '$9.000'),
        ('Anticuchos', '$19.000'),
        ('Arroz con Mariscos', '$25.000'),
    ],
    'Burgers & Casual': [
        ('Burger Clásica', '$18.000'),
        ('Cheeseburger', '$19.000'),
        ('Bacon Burger', '$22.000'),
        ('BBQ Burger', '$21.000'),
        ('Papas Fritas', '$7.000'),
        ('Nuggets', '$12.000'),
        ('Hot Dog', '$10.000'),
        ('Wings', '$15.000'),
    ],
    'Cafes & Coffee': [
        ('Espresso', '$4.000'),
        ('Cappuccino', '$6.000'),
        ('Latte', '$7.000'),
        ('Americano', '$5.000'),
        ('Croissant', '$6.000'),
        ('Pastry Mix', '$8.000'),
        ('Sandwich', '$12.000'),
        ('Cake Slice', '$8.000'),
    ],
    'Vegetarian & Healthy': [
        ('Buddha Bowl', '$20.000'),
        ('Green Salad', '$14.000'),
        ('Vegan Wrap', '$16.000'),
        ('Smoothie Bowl', '$12.000'),
        ('Falafel', '$13.000'),
        ('Hummus Plate', '$11.000'),
        ('Quinoa Bowl', '$18.000'),
        ('Fresh Juice', '$8.000'),
    ],
}

def get_category_color(category_name):
    """Obtener color hexadecimal para una categoría"""
    normalized = category_name.strip()
    for cat, color in CATEGORY_COLORS.items():
        if cat.lower() in normalized.lower():
            return color
    return '#34495E'  # Color por defecto

def hex_to_rgb(hex_color):
    """Convertir hex a RGB"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def generate_restaurant_image(restaurant_name, category_name, seed=None):
    """
    Generar una imagen única para cada restaurante.
    Usa el nombre del restaurante como seed para reproducibilidad.
    """
    # Crear seed determinístico basado en nombre
    if seed is None:
        seed = int(hashlib.md5(restaurant_name.encode()).hexdigest(), 16)
    random.seed(seed)
    
    # Crear imagen
    width, height = 800, 600
    color = hex_to_rgb(get_category_color(category_name))
    
    # Generar patrón de fondo
    img = Image.new('RGB', (width, height), color)
    draw = ImageDraw.Draw(img, 'RGBA')
    
    # Agregar formas geométricas para hacer cada foto única
    # Crear círculos/rectángulos aleatorios pero determinísticos
    num_shapes = random.randint(3, 6)
    for i in range(num_shapes):
        shape_type = random.choice(['circle', 'rect'])
        alpha = random.randint(30, 80)
        overlay_color = (
            random.randint(50, 255),
            random.randint(50, 255),
            random.randint(50, 255),
            alpha
        )
        
        if shape_type == 'circle':
            x = random.randint(0, width)
            y = random.randint(0, height)
            r = random.randint(50, 200)
            draw.ellipse([x-r, y-r, x+r, y+r], fill=overlay_color)
        else:
            x1 = random.randint(0, width // 2)
            y1 = random.randint(0, height // 2)
            x2 = random.randint(width // 2, width)
            y2 = random.randint(height // 2, height)
            draw.rectangle([x1, y1, x2, y2], fill=overlay_color)
    
    # Agregar texto con nombre del restaurante
    try:
        # Intentar usar una fuente más grande si está disponible
        font_size = 60
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    # Dibujar texto centrado con fondo semi-transparente
    text = restaurant_name[:30]
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # Fondo blanco semi-transparente para el texto
    draw.rectangle(
        [x - 20, y - 10, x + text_width + 20, y + text_height + 10],
        fill=(255, 255, 255, 200)
    )
    
    # Texto en negro
    draw.text((x, y), text, font=font, fill=(0, 0, 0, 255))
    
    return img

def generate_restaurant_menu_pdf(restaurant_name, category_name, seed=None):
    """
    Generar un menú PDF único para cada restaurante.
    """
    if seed is None:
        seed = int(hashlib.md5(restaurant_name.encode()).hexdigest(), 16)
    random.seed(seed)
    
    # Obtener platos para esta categoría
    dishes = DISHES_BY_CATEGORY.get(category_name, DISHES_BY_CATEGORY['Vegetarian & Healthy'])
    
    # Mezclar platos de forma determinística
    random.shuffle(dishes)
    
    # Crear PDF en memoria
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor(get_category_color(category_name)),
        spaceAfter=12,
        alignment=1,  # Centrado
    )
    
    category_style = ParagraphStyle(
        'Category',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        alignment=1,
    )
    
    # Elementos del documento
    elements = []
    
    # Título
    elements.append(Paragraph(restaurant_name, title_style))
    elements.append(Paragraph(f"Categoría: {category_name}", category_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Menú como tabla
    menu_data = [['Platillo', 'Precio']]
    for dish_name, price in dishes:
        menu_data.append([dish_name, price])
    
    table = Table(menu_data, colWidths=[4*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(get_category_color(category_name))),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    
    elements.append(table)
    
    # Generar PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

def main():
    """Generar fotos y menús para los 200 restaurantes"""
    print("\n" + "="*70)
    print("GENERANDO FOTOS Y MENÚS PARA 200 RESTAURANTES")
    print("="*70 + "\n")
    
    # Obtener todos los restaurantes
    restaurants = Restaurant.objects.exclude(owner__isnull=True).order_by('id')[:200]
    total = restaurants.count()
    
    print(f"Encontrados: {total} restaurantes")
    print("-" * 70)
    
    success_count = 0
    error_count = 0
    
    for idx, restaurant in enumerate(restaurants, 1):
        try:
            category_name = restaurant.category.name if restaurant.category else 'Vegetarian & Healthy'
            print(f"\n[{idx}/{total}] {restaurant.name}")
            
            # ============================================================
            # 1. GENERAR IMAGEN
            # ============================================================
            print(f"  → Generando imagen...")
            img = generate_restaurant_image(restaurant.name, category_name)
            
            # Guardar imagen en memoria
            img_buffer = BytesIO()
            img.save(img_buffer, format='JPEG', quality=85)
            img_buffer.seek(0)
            
            # Asignar a restaurant.image
            img_filename = f"{slugify(restaurant.name)}_restaurant.jpg"
            restaurant.image.save(img_filename, ContentFile(img_buffer.read()), save=False)
            print(f"     ✓ Imagen guardada: {img_filename}")
            
            # ============================================================
            # 2. GENERAR MENÚ PDF
            # ============================================================
            print(f"  → Generando menú PDF...")
            pdf_buffer = generate_restaurant_menu_pdf(restaurant.name, category_name)
            
            # Asignar a restaurant.menu_pdf
            pdf_filename = f"{slugify(restaurant.name)}_menu.pdf"
            restaurant.menu_pdf.save(pdf_filename, ContentFile(pdf_buffer.read()), save=False)
            print(f"     ✓ Menú guardado: {pdf_filename}")
            
            # ============================================================
            # 3. GUARDAR CAMBIOS EN BD
            # ============================================================
            restaurant.save()
            print(f"  ✓ Restaurante actualizado en BD")
            
            # ============================================================
            # 4. ACTUALIZAR SEDES (BRANCHES)
            # ============================================================
            branches = restaurant.branches.all()
            if branches.exists():
                # Las sedes heredan la misma imagen y menú del restaurante
                branches.update(updated_at=django.utils.timezone.now())
                print(f"  ✓ {branches.count()} sedes actualizadas (heredan foto y menú)")
            
            success_count += 1
            
        except Exception as e:
            error_count += 1
            print(f"  ✗ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # ============================================================
    # RESUMEN
    # ============================================================
    print("\n" + "="*70)
    print("RESUMEN FINAL")
    print("="*70)
    print(f"Éxito:  {success_count}/{total}")
    print(f"Errores: {error_count}/{total}")
    print("="*70 + "\n")

if __name__ == '__main__':
    main()
