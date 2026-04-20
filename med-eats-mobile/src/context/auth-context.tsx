import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { AppUser } from "@/src/models/domain";
import {
  AuthSession,
  fetchMyPublicProfile,
  LoginCredentials,
  RegisterCredentials,
  fetchUserProfile,
  loginWithCredentials,
  refreshAccessToken,
  registerWithEmailAndPassword,
  logoutFromServer,
} from "@/src/services/authService";

type AuthContextValue = {
  user: AppUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  refreshProfile: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_SESSION_KEY = "medeats.auth.session";

async function saveSession(session: AuthSession) {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

async function readSession(): Promise<AuthSession | null> {
  const storedValue = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as AuthSession;
  } catch {
    return null;
  }
}

async function clearSession() {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await readSession();

        if (!session) {
          return;
        }

        try {
          const currentUser = await fetchUserProfile(session.accessToken);
          setUser(currentUser);
          return;
        } catch {
          const newAccessToken = await refreshAccessToken(session.refreshToken);
          const currentUser = await fetchUserProfile(newAccessToken);
          const restoredSession: AuthSession = {
            accessToken: newAccessToken,
            refreshToken: session.refreshToken,
            user: currentUser,
          };

          setUser(currentUser);
          await saveSession(restoredSession);
        }
      } catch {
        await clearSession();
        setUser(null);
      } finally {
        setIsHydrating(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoggingIn(true);

    try {
      const session = await loginWithCredentials(credentials);
      setUser(session.user);
      await saveSession(session);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsRegistering(true);

    try {
      const session = await registerWithEmailAndPassword(credentials);
      setUser(session.user);
      await saveSession(session);
    } finally {
      setIsRegistering(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const session = await readSession();
    if (!session) {
      return;
    }

    try {
      const currentUser = await fetchMyPublicProfile(session.accessToken);
      setUser(currentUser);

      const updatedSession: AuthSession = {
        ...session,
        user: currentUser,
      };
      await saveSession(updatedSession);
    } catch {
      const newAccessToken = await refreshAccessToken(session.refreshToken);
      const currentUser = await fetchMyPublicProfile(newAccessToken);
      const updatedSession: AuthSession = {
        accessToken: newAccessToken,
        refreshToken: session.refreshToken,
        user: currentUser,
      };

      setUser(currentUser);
      await saveSession(updatedSession);
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    const session = await readSession();
    if (!session) {
      return null;
    }

    // IMPORTANTE:
    // Este método debe ser "read-only" para evitar loops de render en pantallas
    // que dependen del usuario autenticado (por ejemplo, Feed).
    // Si aquí hacemos setUser() en cada request del feed, se vuelve a disparar
    // el efecto de carga y se crea un ciclo de "Loading..." infinito.
    return session.accessToken;
  }, []);

  const logout = useCallback(async () => {
    try {
      const session = await readSession();
      if (session) {
        await logoutFromServer(session.refreshToken, session.accessToken);
      }
    } catch (error) {
      console.warn("Server-side logout failed, but clearing local session anyway.", error);
    } finally {
      setUser(null);
      await clearSession();
    }
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isHydrating,
      isLoggingIn,
      isRegistering,
      refreshProfile,
      getAccessToken,
      login,
      register,
      logout,
    }),
    [
      user,
      isHydrating,
      isLoggingIn,
      isRegistering,
      refreshProfile,
      getAccessToken,
      login,
      register,
      logout,
    ]
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
