import json
import logging
import math
import re
import unicodedata
from dataclasses import dataclass
from typing import Any
from urllib import error, request

from django.conf import settings


logger = logging.getLogger(__name__)


@dataclass
class FoodieAssistantResult:
    restaurant_id: int
    explanation: str
    source: str


class FoodieOutOfScopeError(ValueError):
    pass


PROXIMITY_HINTS = [
    "cerca",
    "cerquita",
    "cercano",
    "cercana",
    "near",
    "cerca de mi",
    "por aqui",
    "por aca",
    "alrededor",
]

SEMANTIC_GROUPS = [
    ["pizza", "italian", "italiana", "napolitana"],
    ["sushi", "japonesa", "japanese", "asiatica", "asiatico"],
    ["burger", "hamburguesa", "grill", "parrilla"],
    ["healthy", "fit", "saludable", "vegano", "vegana"],
    ["mexican", "mexicana", "tacos", "taqueria"],
    ["cafe", "cafeteria", "bakery", "panaderia"],
]

DOMAIN_HINTS = [
    "restaurante",
    "restaurantes",
    "comer",
    "almorzar",
    "cenar",
    "desayunar",
    "merendar",
    "pizza",
    "sushi",
    "burger",
    "hamburguesa",
    "healthy",
    "vegano",
    "vegana",
    "mexican",
    "mexicana",
    "tacos",
    "cafe",
    "cafeteria",
    "parche",
    "antojito",
    "cerca",
    "cerca de mi",
    "cercano",
    "ubicacion",
    "ubicación",
    "precio",
    "barato",
    "economico",
    "económico",
    "recomienda",
    "recomendar",
    "recomendacion",
    "recomendación",
    "menu",
    "menú",
    "plato",
    "platos",
    "pedido",
    "hambre",
]

OUT_OF_SCOPE_HINTS = [
    "raiz cuadrada",
    "sqrt",
    "math",
    "matemat",
    "ecuacion",
    "integral",
    "derivada",
    "capital de",
    "historia",
    "física",
    "fisica",
    "quimica",
    "química",
    "programacion",
    "programación",
    "clima",
    "noticias",
    "deportes",
    "política",
    "politica",
    "horoscopo",
    "horóscopo",
    "musica",
    "música",
    "pelicula",
    "película",
    "serie",
    "viaje",
    "viajar",
    "trabajo",
    "estudio",
    "salud",
    "medicina",
]


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    no_accents = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", no_accents.lower()).strip()


def _is_proximity_intent(message_norm: str) -> bool:
    return any(term in message_norm for term in PROXIMITY_HINTS)


def _intent_terms_from_message(message_norm: str) -> set[str]:
    matched_terms: set[str] = set()
    for group in SEMANTIC_GROUPS:
        if any(term in message_norm for term in group):
            matched_terms.update(group)
    return matched_terms


def _is_domain_query(message_norm: str) -> bool:
    if any(term in message_norm for term in OUT_OF_SCOPE_HINTS):
        return False

    if any(term in message_norm for term in DOMAIN_HINTS):
        return True

    # Permite consultas implícitamente relacionadas con comida/restaurantes
    # aunque no usen la palabra "restaurante".
    tokens = set(message_norm.split(" "))
    food_tokens = {
        "pizza",
        "sushi",
        "burger",
        "hamburguesa",
        "tacos",
        "cafe",
        "café",
        "vegano",
        "vegana",
        "ensalada",
        "desayuno",
        "almuerzo",
        "cena",
        "antojito",
        "parche",
        "comida",
        "cocina",
        "menu",
        "menú",
    }

    return any(token in food_tokens for token in tokens)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_km * c


def _keyword_score(
    message: str,
    candidate: dict[str, Any],
    user_coords: tuple[float, float] | None = None,
    excluded_restaurant_id: int | None = None,
) -> float:
    if excluded_restaurant_id is not None and int(candidate.get("id", 0)) == excluded_restaurant_id:
        return float("-inf")

    message_norm = _normalize_text(message)
    name = _normalize_text(candidate.get("name") or "")
    category = _normalize_text(candidate.get("category") or "")
    description = _normalize_text(candidate.get("description") or "")
    location = _normalize_text(candidate.get("location") or "")

    if not message_norm:
        return 0.0

    score = 0.0
    for token in set(message_norm.split(" ")):
        if len(token) < 3:
            continue
        if token in name:
            score += 3.0
        if token in category:
            score += 4.0
        if token in description:
            score += 1.5
        if token in location:
            score += 0.5

    for group in SEMANTIC_GROUPS:
        query_hits_group = any(term in message_norm for term in group)
        candidate_hits_group = any(
            term in category or term in name or term in description for term in group
        )
        if query_hits_group and candidate_hits_group:
            score += 6.0

    # Bonus ligero para términos de jerga local.
    if "antoj" in message_norm and (
        "food" in category or "pizza" in category or "sushi" in category
    ):
        score += 0.75
    if "parche" in message_norm and "poblado" in location:
        score += 0.75

    # Si la intención es "cerca", damos prioridad fuerte a distancia real.
    if user_coords and _is_proximity_intent(message_norm):
        try:
            rest_lat = float(candidate.get("latitude"))
            rest_lon = float(candidate.get("longitude"))
            distance_km = _haversine_km(user_coords[0], user_coords[1], rest_lat, rest_lon)
            # 15 pts si está a 0 km y decrece linealmente hasta 0 pts a los 15 km.
            score += max(0.0, 15.0 - distance_km)
        except (TypeError, ValueError):
            pass

    return score


def _fallback_result(
    user_message: str,
    restaurants: list[dict[str, Any]],
    user_coords: tuple[float, float] | None = None,
    excluded_restaurant_id: int | None = None,
) -> FoodieAssistantResult:
    message_norm = _normalize_text(user_message)
    available_restaurants = (
        [item for item in restaurants if int(item.get("id", 0)) != excluded_restaurant_id]
        if excluded_restaurant_id is not None
        else restaurants
    )

    if not available_restaurants:
        available_restaurants = restaurants

    # Regla fuerte para consultas de cercanía: elegir por menor distancia real.
    if user_coords and _is_proximity_intent(message_norm):
        intent_terms = _intent_terms_from_message(message_norm)

        def candidate_matches_intent(candidate: dict[str, Any]) -> bool:
            if not intent_terms:
                return True
            text = _normalize_text(
                " ".join(
                    [
                        str(candidate.get("name") or ""),
                        str(candidate.get("category") or ""),
                        str(candidate.get("description") or ""),
                    ]
                )
            )
            return any(term in text for term in intent_terms)

        intent_pool = [item for item in available_restaurants if candidate_matches_intent(item)]
        pool = intent_pool if intent_pool else available_restaurants

        def distance_for(item: dict[str, Any]) -> float:
            try:
                return _haversine_km(
                    user_coords[0],
                    user_coords[1],
                    float(item.get("latitude")),
                    float(item.get("longitude")),
                )
            except (TypeError, ValueError):
                return 9999.0

        best = min(pool, key=distance_for)
        distance_km = distance_for(best)
        explanation = (
            f"Te recomiendo {best['name']} porque es el más cercano a tu ubicación "
            f"(aprox. {distance_km:.1f} km, {best['category']} en {best['location']})."
        )
        return FoodieAssistantResult(
            restaurant_id=best["id"],
            explanation=explanation,
            source="fallback",
        )

    ranked = sorted(
        available_restaurants,
        key=lambda item: _keyword_score(
            user_message,
            item,
            user_coords=user_coords,
            excluded_restaurant_id=excluded_restaurant_id,
        ),
        reverse=True,
    )

    best = ranked[0]
    explanation = ""

    if user_coords and _is_proximity_intent(message_norm):
        try:
            distance_km = _haversine_km(
                user_coords[0],
                user_coords[1],
                float(best.get("latitude")),
                float(best.get("longitude")),
            )
            explanation = (
                f"Te recomiendo {best['name']} porque es de los más cercanos a ti "
                f"(aprox. {distance_km:.1f} km, {best['category']} en {best['location']})."
            )
        except (TypeError, ValueError):
            explanation = (
                f"Te recomiendo {best['name']} porque coincide mejor con lo que pediste "
                f"({best['category']} en {best['location']})."
            )
    else:
        explanation = (
            f"Te recomiendo {best['name']} porque coincide mejor con lo que pediste "
            f"({best['category']} en {best['location']})."
        )

    return FoodieAssistantResult(
        restaurant_id=best["id"],
        explanation=explanation,
        source="fallback",
    )


def _out_of_scope_response() -> FoodieAssistantResult:
    raise FoodieOutOfScopeError(
        "Solo puedo ayudar con restaurantes, comida, cercanía, categorías, precios y recomendaciones de la app."
    )


def _extract_json_block(text: str) -> str:
    text = text.strip()
    fenced = re.search(r"```json\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
    if fenced:
        return fenced.group(1)

    plain = re.search(r"(\{.*\})", text, flags=re.DOTALL)
    if plain:
        return plain.group(1)

    return text


def _call_gemini(
    user_message: str,
    restaurants: list[dict[str, Any]],
    user_coords: tuple[float, float] | None = None,
    excluded_restaurant_id: int | None = None,
) -> FoodieAssistantResult:
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    configured_model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY no está configurada")

    location_context = ""
    if user_coords:
        location_context = (
            f"Ubicación actual del usuario (lat, lon): ({user_coords[0]}, {user_coords[1]}). "
            "Si el usuario pregunta por lugares cercanos, prioriza distancia real.\n\n"
        )

    excluded_context = ""
    if excluded_restaurant_id is not None:
        excluded_context = (
            f"No recomiendes el restaurante con id {excluded_restaurant_id}; el usuario pidió otra opción distinta.\n\n"
        )

    prompt = (
        "Eres un asistente foodie de Medellin. Entiendes jerga local como 'antojito' y 'parche'. "
        "Debes elegir el restaurante mas relevante para la intencion semantica del usuario. "
        "Si el usuario pide algo cerca, privilegia el restaurante más cercano con buena coincidencia de intención. "
        "Si el usuario pide otra opción o una alternativa, evita repetir el restaurante anterior. "
        "Responde SOLO JSON valido con esta forma: "
        '{"restaurant_id": <numero>, "explanation": "<texto breve en espanol>"}. '\
        "No inventes ids. Usa exactamente uno de los restaurantes listados.\n\n"
        f"{location_context}"
        f"{excluded_context}"
        f"Consulta del usuario: {user_message}\n\n"
        "Restaurantes disponibles (JSON):\n"
        f"{json.dumps(restaurants, ensure_ascii=False)}"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    # Algunos modelos cambian con el tiempo. Si el modelo configurado no existe,
    # probamos una lista corta de modelos estables para evitar caer siempre a fallback.
    candidate_models = [
        configured_model,
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
    ]
    # Preserva orden y evita duplicados.
    seen_models: set[str] = set()
    unique_models = [m for m in candidate_models if not (m in seen_models or seen_models.add(m))]

    raw = ""
    last_exc: Exception | None = None
    for model_name in unique_models:
        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            f"?key={api_key}"
        )

        req = request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=10) as resp:
                raw = resp.read().decode("utf-8")
                break
        except error.HTTPError as exc:
            last_exc = exc
            # Si el modelo no existe o está descontinuado, intentamos el siguiente.
            if exc.code == 404:
                continue
            raise RuntimeError(f"Error llamando Gemini: {exc}") from exc
        except error.URLError as exc:
            last_exc = exc
            raise RuntimeError(f"Error llamando Gemini: {exc}") from exc

    if not raw:
        raise RuntimeError(f"No se pudo llamar Gemini con los modelos configurados: {last_exc}")

    data = json.loads(raw)
    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )

    parsed = json.loads(_extract_json_block(text))
    return FoodieAssistantResult(
        restaurant_id=int(parsed["restaurant_id"]),
        explanation=str(parsed["explanation"]).strip(),
        source="gemini",
    )


def get_foodie_recommendation(
    user_message: str,
    restaurants: list[dict[str, Any]],
    user_latitude: float | None = None,
    user_longitude: float | None = None,
    excluded_restaurant_id: int | None = None,
) -> FoodieAssistantResult:
    if not restaurants:
        raise ValueError("No hay restaurantes disponibles para recomendar")

    message_norm = _normalize_text(user_message)
    if not _is_domain_query(message_norm):
        return _out_of_scope_response()

    user_coords: tuple[float, float] | None = None
    if user_latitude is not None and user_longitude is not None:
        user_coords = (user_latitude, user_longitude)

    try:
        result = _call_gemini(
            user_message=user_message,
            restaurants=restaurants,
            user_coords=user_coords,
            excluded_restaurant_id=excluded_restaurant_id,
        )
        valid_ids = {item["id"] for item in restaurants}
        if excluded_restaurant_id is not None:
            valid_ids.discard(excluded_restaurant_id)
        if result.restaurant_id not in valid_ids:
            raise RuntimeError("Gemini devolvió un restaurant_id inválido")
        if not result.explanation:
            raise RuntimeError("Gemini devolvió explicación vacía")
        return result
    except Exception:
        logger.warning(
            "Foodie AI fallback activado para mensaje='%s'",
            user_message,
            exc_info=True,
        )
        return _fallback_result(
            user_message=user_message,
            restaurants=restaurants,
            user_coords=user_coords,
            excluded_restaurant_id=excluded_restaurant_id,
        )
