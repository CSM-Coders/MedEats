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
from django.db import connection
from django.http import JsonResponse
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


def health_check(request):
    """Endpoint para load balancers y orquestadores de contenedores."""
    checks = {"status": "ok", "db": "unknown", "cache": "unknown"}

    try:
        connection.ensure_connection()
        checks["db"] = "ok"
    except Exception:
        checks["db"] = "error"
        checks["status"] = "degraded"

    try:
        from django.core.cache import cache

        cache.set("health_check", "ok", timeout=10)
        checks["cache"] = "ok" if cache.get("health_check") == "ok" else "error"
    except Exception:
        checks["cache"] = "error"

    return JsonResponse(checks, status=200 if checks["status"] == "ok" else 503)


# ============================================================
# RUTAS BACKEND PRINCIPALES (El índice base)
# ------------------------------------------------------------
# Este es el archivo "Enrutador Maestro" de todo el proyecto Django.
# Aquí simplemente interceptamos las peticiones y las dividimos según su propósito.
# En lugar de escribir todas aquí para siempre (lo que crearía un archivo gigante e inmantenible),
# inyectamos los caminos de cada mini-aplicación separada leyendo su propio archivo routes.
# ============================================================

urlpatterns = [
    # [P1-13] Health check para load balancers y Docker healthcheck
    path("health/", health_check, name="health-check"),
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/", include("restaurants.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
