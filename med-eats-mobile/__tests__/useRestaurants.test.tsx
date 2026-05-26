/* global describe, it, expect, jest, beforeEach */
// ============================================================
// [P4-2] Tests del hook useRestaurants
// ------------------------------------------------------------
// Mockeamos fetchRestaurants y verificamos:
//  - estado de loading inicial
//  - población de restaurants al resolver el fetch
//  - manejo de error
//  - filtrado en memoria por category/minRating/searchQuery
// ============================================================
import { renderHook, waitFor } from "@testing-library/react-native";
import { useRestaurants } from "../src/screens/home/hooks/useRestaurants";

jest.mock("../src/services/restaurantApi", () => ({
  fetchRestaurants: jest.fn(),
}));

import { fetchRestaurants } from "../src/services/restaurantApi";

const mockedFetchRestaurants = fetchRestaurants as jest.MockedFunction<typeof fetchRestaurants>;

const mockRestaurants = [
  {
    id: "1",
    name: "Pizza Place",
    category: "Italian & Pizza",
    rating: 4.5,
    image: "",
    latitude: 6.2,
    longitude: -75.5,
    location: "El Poblado",
    description: "",
    menuHighlights: [],
    whatsapp: "",
  },
  {
    id: "2",
    name: "Sushi Spot",
    category: "Japanese & Sushi",
    rating: 3.8,
    image: "",
    latitude: 6.21,
    longitude: -75.55,
    location: "Laureles",
    description: "",
    menuHighlights: [],
    whatsapp: "",
  },
];

const initialFilters = { category: null, minRating: null, maxDistanceKm: null };

describe("useRestaurants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("arranca en loading=true y deja loading=false tras resolver", async () => {
    mockedFetchRestaurants.mockResolvedValueOnce(mockRestaurants as any);

    const { result } = renderHook(() => useRestaurants(initialFilters, ""));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.restaurants).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it("setea error cuando fetchRestaurants falla", async () => {
    mockedFetchRestaurants.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useRestaurants(initialFilters, ""));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("No se pudieron cargar los restaurantes.");
  });

  it("filtra por category", async () => {
    mockedFetchRestaurants.mockResolvedValueOnce(mockRestaurants as any);

    const filters = { ...initialFilters, category: "Japanese & Sushi" };
    const { result } = renderHook(() => useRestaurants(filters, ""));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe("Sushi Spot");
  });

  it("filtra por minRating", async () => {
    mockedFetchRestaurants.mockResolvedValueOnce(mockRestaurants as any);

    const filters = { ...initialFilters, minRating: 4 };
    const { result } = renderHook(() => useRestaurants(filters, ""));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe("Pizza Place");
  });

  it("filtra por searchQuery (substring case-insensitive)", async () => {
    mockedFetchRestaurants.mockResolvedValueOnce(mockRestaurants as any);

    const { result } = renderHook(() => useRestaurants(initialFilters, "PIZZA"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe("Pizza Place");
  });
});
