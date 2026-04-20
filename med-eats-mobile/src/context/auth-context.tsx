import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AppUser } from "@/src/models/domain";
import {
  LoginCredentials,
  RegisterCredentials,
  loginWithCredentials,
  registerWithEmailAndPassword,
} from "@/src/services/authService";

type AuthContextValue = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoggingIn(true);

    try {
      const authenticatedUser = await loginWithCredentials(credentials);
      setUser(authenticatedUser);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsRegistering(true);

    try {
      const authenticatedUser = await registerWithEmailAndPassword(credentials);
      setUser(authenticatedUser);
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoggingIn,
      isRegistering,
      login,
      register,
      logout,
    }),
    [user, isLoggingIn, isRegistering, login, register, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
