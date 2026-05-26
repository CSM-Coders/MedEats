/* global describe, it, expect */
// ============================================================
// [P4-2] Tests de los helpers puros extraídos de homeScreen
// ------------------------------------------------------------
// Tests determinísticos (sin estado, sin mocks de red) sobre
// las funciones que rankean y filtran restaurantes.
// ============================================================
import {
  normalizeText,
  hasProximityIntent,
  getDistanceKmBetween,
  rankLocalFoodieMatch,
  mapApiRestaurant,
} from "../src/screens/home/utils/foodieMatching";

describe("normalizeText", () => {
  it("quita tildes y pasa a lowercase", () => {
    expect(normalizeText("Médellín  ")).toBe("medellin");
  });

  it("trim y normaliza espacios al inicio/fin", () => {
    expect(normalizeText("  Café  ")).toBe("cafe");
  });
});

describe("hasProximityIntent", () => {
  it("detecta intentos de proximidad en español", () => {
    expect(hasProximityIntent("algo cerca de aquí")).toBe(true);
    expect(hasProximityIntent("restaurantes alrededor")).toBe(true);
  });

  it("no marca búsquedas sin proximidad", () => {
    expect(hasProximityIntent("sushi italiano")).toBe(false);
  });
});

describe("getDistanceKmBetween", () => {
  it("retorna 0 cuando los puntos son iguales", () => {
    expect(getDistanceKmBetween(6.2, -75.5, 6.2, -75.5)).toBe(0);
  });

  it("estima distancias realistas en Medellín", () => {
    // El Poblado a Laureles ~ 5-7 km
    const km = getDistanceKmBetween(6.21, -75.57, 6.24, -75.59);
    expect(km).toBeGreaterThan(0);
    expect(km).toBeLessThan(20);
  });
});

describe("rankLocalFoodieMatch", () => {
  const restaurants = [
    {
      id: "1",
      name: "La Italiana",
      category: "Italian & Pizza",
      rating: 4.5,
      image: "",
      latitude: 6.2,
      longitude: -75.5,
      location: "El Poblado",
      description: "Pizza napolitana auténtica",
      menuHighlights: [],
      whatsapp: "",
    },
    {
      id: "2",
      name: "Sushi Master",
      category: "Japanese & Sushi",
      rating: 4.8,
      image: "",
      latitude: 6.21,
      longitude: -75.55,
      location: "Laureles",
      description: "Sushi de calidad",
      menuHighlights: [],
      whatsapp: "",
    },
  ];

  it("retorna null cuando la query es muy corta", () => {
    expect(rankLocalFoodieMatch("a", restaurants)).toBeNull();
  });

  it("matchea por categoría semántica (pizza → italiano)", () => {
    const match = rankLocalFoodieMatch("quiero pizza", restaurants);
    expect(match).not.toBeNull();
    expect(match?.id).toBe("1");
  });

  it("matchea por keyword en nombre", () => {
    const match = rankLocalFoodieMatch("sushi por favor", restaurants);
    expect(match).not.toBeNull();
    expect(match?.id).toBe("2");
  });
});

describe("mapApiRestaurant", () => {
  it("normaliza una respuesta parcial del backend", () => {
    const result = mapApiRestaurant({
      id: 42,
      name: "Test",
      rating: "4.7",
      latitude: 6.2,
      longitude: -75.5,
      location: "Centro",
      description: "Bueno",
    });
    expect(result.id).toBe("42");
    expect(result.rating).toBe(4.7);
    expect(result.category).toBe("Restaurante"); // default
    expect(result.menuHighlights).toEqual([]);
    expect(result.whatsapp).toBe("");
  });
});
