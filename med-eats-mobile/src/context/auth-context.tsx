import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AppUser } from "@/src/models/domain";
import { LoginCredentials, loginWithCredentials } from "@/src/services/authService";

type AuthContextValue = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoggingIn(true);

    try {
      const authenticatedUser = await loginWithCredentials(credentials);
      setUser(authenticatedUser);
    } finally {
      setIsLoggingIn(false);
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
      login,
      logout,
    }),
    [user, isLoggingIn, login, logout]
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
