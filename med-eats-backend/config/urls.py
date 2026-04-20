"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include

# ============================================================
# RUTAS BACKEND PRINCIPALES (El índice base)
# ------------------------------------------------------------
# Este es el archivo "Enrutador Maestro" de todo el proyecto Django.
# Aquí simplemente interceptamos las peticiones y las dividimos según su propósito.
# En lugar de escribir todas aquí para siempre (lo que crearía un archivo gigante e inmantenible),
# inyectamos los caminos de cada mini-aplicación separada leyendo su propio archivo routes.
# ============================================================

urlpatterns = [
    # El Panel Administrativo privado que nos dio Django
    path("admin/", admin.site.urls),
    # Endpoints de autenticación JWT (Versión 1)
    path("api/v1/auth/", include("accounts.urls")),
    # Apps de negocio (Versión 1)
    path("api/v1/", include("restaurants.urls")),
]
