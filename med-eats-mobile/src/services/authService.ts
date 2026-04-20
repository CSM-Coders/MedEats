import { API_BASE_URL } from "@/src/config/api";
import { AppUser } from "@/src/models/domain";

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterCredentials = {
  username: string;
  email: string;
  password: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AppUser;
};

const USERNAME_REQUIRED_ERROR = "Username is required.";
const USERNAME_INVALID_ERROR =
  "Username must be 3-20 characters and use only letters, numbers, underscores or periods.";
const EMAIL_REQUIRED_ERROR = "Email is required.";
const EMAIL_INVALID_ERROR = "Please enter a valid email address.";
const INVALID_CREDENTIALS_ERROR = "Invalid username or password.";
const PASSWORD_REQUIRED_ERROR = "Password is required.";
const PASSWORD_WEAK_ERROR =
  "Password must be at least 8 characters and include uppercase, lowercase and a number.";
const REGISTRATION_FAILED_ERROR = "Registration failed. Please try again.";
const SESSION_REFRESH_FAILED_ERROR = "Your session expired. Please log in again.";

const AUTH_HEADERS = {
  "Content-Type": "application/json",
} as const;

type ValidationResult = {
  usernameError?: string;
  emailError?: string;
  passwordError?: string;
};

type ApiUser = {
  id: number | string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  followers_count?: number;
  following_count?: number;
};

type AuthResponse = {
  access: string;
  refresh: string;
  user: ApiUser;
};

export function validateLoginCredentials(credentials: LoginCredentials): {
  usernameError?: string;
  passwordError?: string;
} {
  const username = credentials.username.trim();
  const password = credentials.password.trim();

  const validationErrors: { usernameError?: string; passwordError?: string } = {};

  if (!username) {
    validationErrors.usernameError = USERNAME_REQUIRED_ERROR;
  }

  if (!password) {
    validationErrors.passwordError = PASSWORD_REQUIRED_ERROR;
  }

  return validationErrors;
}

export async function loginWithCredentials(
  credentials: LoginCredentials
): Promise<AuthSession> {
  const validation = validateLoginCredentials(credentials);

  if (validation.usernameError) {
    throw new Error(validation.usernameError);
  }

  if (validation.passwordError) {
    throw new Error(validation.passwordError);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      username: credentials.username.trim(),
      password: credentials.password,
    }),
  });

  return parseAuthResponse(response, INVALID_CREDENTIALS_ERROR);
}

export function validateRegistrationCredentials(
  credentials: RegisterCredentials
): ValidationResult {
  const username = credentials.username.trim();
  const email = credentials.email.trim();
  const password = credentials.password.trim();

  const validationErrors: ValidationResult = {};

  if (!username) {
    validationErrors.usernameError = USERNAME_REQUIRED_ERROR;
  } else if (!isValidUsername(username)) {
    validationErrors.usernameError = USERNAME_INVALID_ERROR;
  }

  if (!email) {
    validationErrors.emailError = EMAIL_REQUIRED_ERROR;
  } else if (!isValidEmail(email)) {
    validationErrors.emailError = EMAIL_INVALID_ERROR;
  }

  if (!password) {
    validationErrors.passwordError = PASSWORD_REQUIRED_ERROR;
  } else if (!isStrongPassword(password)) {
    validationErrors.passwordError = PASSWORD_WEAK_ERROR;
  }

  return validationErrors;
}

export async function registerWithEmailAndPassword(
  credentials: RegisterCredentials
): Promise<AuthSession> {
  const validation = validateRegistrationCredentials(credentials);

  if (validation.usernameError) {
    throw new Error(validation.usernameError);
  }

  if (validation.emailError) {
    throw new Error(validation.emailError);
  }

  if (validation.passwordError) {
    throw new Error(validation.passwordError);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register/`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      username: credentials.username.trim(),
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    }),
  });

  return parseAuthResponse(response, REGISTRATION_FAILED_ERROR);
}

export async function fetchUserProfile(accessToken: string): Promise<AppUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(SESSION_REFRESH_FAILED_ERROR);
  }

  const payload = (await response.json()) as ApiUser;
  return normalizeUser(payload);
}

export async function fetchMyPublicProfile(accessToken: string): Promise<AppUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile/me/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(SESSION_REFRESH_FAILED_ERROR);
  }

  const payload = (await response.json()) as {
    user_id: string | number;
    username: string;
    name?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    followers_count?: number;
    following_count?: number;
  };

  return {
    id: String(payload.user_id),
    username: payload.username,
    name: payload.name || payload.username,
    avatarUrl: payload.avatar_url,
    bio: payload.bio ?? "",
    location: payload.location ?? "",
    followers: Number(payload.followers_count) || 0,
    following: Number(payload.following_count) || 0,
  };
}

export async function updateMyProfile(
  accessToken: string,
  input: { displayName?: string; avatarUrl?: string; bio?: string; location?: string }
): Promise<AppUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile/me/`, {
    method: "PATCH",
    headers: {
      ...AUTH_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      display_name: input.displayName,
      avatar_url: input.avatarUrl,
      bio: input.bio,
      location: input.location,
    }),
  });

  const payload = await response.text();
  const parsed = parseResponseBody(payload) as
    | {
        user_id?: string | number;
        username?: string;
        name?: string;
        avatar_url?: string;
        bio?: string;
        location?: string;
        followers_count?: number;
        following_count?: number;
      }
    | null;

  if (!response.ok || !parsed?.user_id || !parsed.username) {
    throw new Error(resolveErrorMessage(parsed, REGISTRATION_FAILED_ERROR, response.status));
  }

  return {
    id: String(parsed.user_id),
    username: parsed.username,
    name: parsed.name || parsed.username,
    avatarUrl: parsed.avatar_url,
    bio: parsed.bio ?? "",
    location: parsed.location ?? "",
    followers: Number(parsed.followers_count) || 0,
    following: Number(parsed.following_count) || 0,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    throw new Error(SESSION_REFRESH_FAILED_ERROR);
  }

  const payload = (await response.json()) as { access?: string };

  if (!payload.access) {
    throw new Error(SESSION_REFRESH_FAILED_ERROR);
  }

  return payload.access;
}

function parseAuthResponse(response: Response, fallbackErrorMessage: string) {
  return response.text().then((rawBody) => {
    const payload = parseResponseBody(rawBody);

    if (!response.ok) {
      throw new Error(resolveErrorMessage(payload, fallbackErrorMessage, response.status));
    }

    const typedPayload = payload as Partial<AuthResponse> | null;

    if (!typedPayload?.access || !typedPayload.refresh || !typedPayload.user) {
      throw new Error(fallbackErrorMessage);
    }

    return {
      accessToken: typedPayload.access,
      refreshToken: typedPayload.refresh,
      user: normalizeUser(typedPayload.user),
    } satisfies AuthSession;
  });
}

function parseResponseBody(rawBody: string) {
  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}

function resolveErrorMessage(
  payload: unknown,
  fallbackMessage: string,
  statusCode?: number
) {
  if (typeof payload === "string") {
    const trimmedPayload = normalizeErrorText(payload);
    if (trimmedPayload) {
      return trimmedPayload;
    }

    return fallbackMessage;
  }

  if (!payload || typeof payload !== "object") {
    return statusCode ? `${fallbackMessage} (HTTP ${statusCode})` : fallbackMessage;
  }

  const typedPayload = payload as Record<string, unknown>;

  if (typeof typedPayload.detail === "string") {
    return typedPayload.detail;
  }

  const fieldNames = ["username", "email", "password", "non_field_errors"];
  for (const fieldName of fieldNames) {
    const fieldValue = typedPayload[fieldName];
    if (Array.isArray(fieldValue) && typeof fieldValue[0] === "string") {
      return fieldValue[0];
    }
    if (typeof fieldValue === "string") {
      return fieldValue;
    }
  }

  const nestedMessage = findFirstStringValue(typedPayload);
  if (nestedMessage) {
    return nestedMessage;
  }

  return statusCode ? `${fallbackMessage} (HTTP ${statusCode})` : fallbackMessage;
}

function findFirstStringValue(value: unknown): string | null {
  if (typeof value === "string") {
    const normalizedValue = normalizeErrorText(value);
    return normalizedValue || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findFirstStringValue(item);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      const nested = findFirstStringValue(nestedValue);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function normalizeErrorText(text: string) {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUser(user: ApiUser): AppUser {
  const displayName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  return {
    id: String(user.id),
    username: user.username,
    name: user.name || displayName || user.username,
    email: user.email,
    avatarUrl: user.avatar_url,
    bio: user.bio ?? "",
    location: user.location ?? "",
    followers: Number(user.followers_count) || 0,
    following: Number(user.following_count) || 0,
  };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9._]{3,20}$/.test(username);
}

function isStrongPassword(password: string) {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
}

export function getInvalidCredentialsErrorMessage() {
  return INVALID_CREDENTIALS_ERROR;
}

export function getRegistrationFailedErrorMessage() {
  return REGISTRATION_FAILED_ERROR;
}
