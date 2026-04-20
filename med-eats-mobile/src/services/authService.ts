import { AppUser } from "@/src/models/domain";
import { API_BASE_URL } from "@/src/config/api";
import { currentUser } from "@/src/services/mockData";

export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterCredentials = {
  email: string;
  password: string;
};

const REGISTERED_CREDENTIALS: LoginCredentials = {
  username: "foodlover_med",
  password: "Medeats123!",
};

const INVALID_CREDENTIALS_ERROR = "Invalid username or password.";
const EMAIL_REQUIRED_ERROR = "Email is required.";
const EMAIL_INVALID_ERROR = "Please enter a valid email address.";
const PASSWORD_REQUIRED_ERROR = "Password is required.";
const PASSWORD_WEAK_ERROR =
  "Password must be at least 8 characters and include uppercase, lowercase and a number.";
const REGISTRATION_FAILED_ERROR = "Registration failed. Please try again.";

const USE_REAL_AUTH_API = process.env.EXPO_PUBLIC_USE_REAL_AUTH === "true";

type ValidationResult = {
  emailError?: string;
  passwordError?: string;
};

export async function loginWithCredentials(
  credentials: LoginCredentials
): Promise<AppUser> {
  await new Promise((resolve) => setTimeout(resolve, 650));

  const normalizedUsername = credentials.username.trim().toLowerCase();
  const normalizedPassword = credentials.password.trim();

  const isValidUser =
    normalizedUsername === REGISTERED_CREDENTIALS.username &&
    normalizedPassword === REGISTERED_CREDENTIALS.password;

  if (!isValidUser) {
    throw new Error(INVALID_CREDENTIALS_ERROR);
  }

  return currentUser;
}

export function validateRegistrationCredentials(
  credentials: RegisterCredentials
): ValidationResult {
  const email = credentials.email.trim();
  const password = credentials.password.trim();

  const validationErrors: ValidationResult = {};

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
): Promise<AppUser> {
  const validation = validateRegistrationCredentials(credentials);

  if (validation.emailError) {
    throw new Error(validation.emailError);
  }

  if (validation.passwordError) {
    throw new Error(validation.passwordError);
  }

  if (USE_REAL_AUTH_API) {
    return registerInBackend(credentials);
  }

  await new Promise((resolve) => setTimeout(resolve, 700));
  return currentUser;
}

async function registerInBackend(credentials: RegisterCredentials): Promise<AppUser> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const backendMessage = payload?.message ?? payload?.detail;
      throw new Error(backendMessage || REGISTRATION_FAILED_ERROR);
    }

    const createdUser = payload?.user;

    if (!createdUser) {
      return currentUser;
    }

    return {
      id: createdUser.id ?? currentUser.id,
      username:
        createdUser.username ??
        (createdUser.email ? String(createdUser.email).split("@")[0] : currentUser.username),
      name: createdUser.name ?? currentUser.name,
      bio: createdUser.bio ?? currentUser.bio,
      location: createdUser.location ?? currentUser.location,
      followers: createdUser.followers ?? 0,
      following: createdUser.following ?? 0,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(REGISTRATION_FAILED_ERROR);
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
