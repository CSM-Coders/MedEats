import { AppUser } from "@/src/models/domain";
import { currentUser } from "@/src/services/mockData";

export type LoginCredentials = {
  username: string;
  password: string;
};

const REGISTERED_CREDENTIALS: LoginCredentials = {
  username: "foodlover_med",
  password: "Medeats123!",
};

const INVALID_CREDENTIALS_ERROR = "Invalid username or password.";

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

export function getInvalidCredentialsErrorMessage() {
  return INVALID_CREDENTIALS_ERROR;
}
