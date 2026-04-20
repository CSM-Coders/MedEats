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

  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
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

  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
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
  const response = await fetch(`${API_BASE_URL}/api/auth/me/`, {
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

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
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
  return response
    .json()
    .catch(() => null)
    .then((payload) => {
      if (!response.ok) {
        throw new Error(resolveErrorMessage(payload, fallbackErrorMessage));
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

function resolveErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
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

  return fallbackMessage;
}

function normalizeUser(user: ApiUser): AppUser {
  const displayName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  return {
    id: String(user.id),
    username: user.username,
    name: displayName || user.username,
    email: user.email,
    bio: "",
    location: "",
    followers: 0,
    following: 0,
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
