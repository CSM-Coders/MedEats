import { API_BASE_URL } from "@/src/config/api";

// ============================================================
// [P2-6] CLIENTE HTTP CENTRALIZADO
// ------------------------------------------------------------
// Sustituye los `fetch` dispersos por una única función `apiRequest`
// que:
//   - Adjunta el header Authorization si se le pasa accessToken
//   - Maneja Content-Type automáticamente (JSON vs FormData)
//   - Convierte errores HTTP en ApiError con código tipado
//   - Devuelve un único formato de error para toda la app
// ============================================================

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() { return this.status === 401; }
  get isNotFound() { return this.status === 404; }
  get isRateLimited() { return this.status === 429; }
  get isServerError() { return this.status >= 500; }
}

type RequestOptions = RequestInit & {
  accessToken?: string;
  skipContentType?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { accessToken, skipContentType, ...fetchOptions } = options;

  const headers: Record<string, string> = {};

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (!skipContentType && !(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) },
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${response.status}`;

    try {
      const body = await response.json();
      message = body.detail || body.message || message;
      code = body.code || code;
    } catch {
      /* sin cuerpo JSON */
    }

    if (response.status === 401) throw new ApiError(401, "UNAUTHORIZED", "Sesión expirada.");
    if (response.status === 403) throw new ApiError(403, "FORBIDDEN", "Sin permisos.");
    if (response.status === 404) throw new ApiError(404, "NOT_FOUND", "No encontrado.");
    if (response.status === 429) throw new ApiError(429, "RATE_LIMITED", "Demasiadas solicitudes.");
    if (response.status >= 500) throw new ApiError(response.status, "SERVER_ERROR", "Error del servidor.");

    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
