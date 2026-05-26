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
  // [P2-4] fetch con auto-refresh transparente del token al recibir 401
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
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

  // [P2-4] fetch con auto-refresh: si el backend devuelve 401, intenta refrescar
  // el access token UNA vez y reintenta la petición. Si el refresh falla, limpia
  // la sesión y lanza error para que la UI redirija al login.
  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const session = await readSession();
      if (!session) {
        throw new Error("No session");
      }

      const buildHeaders = (token: string) => ({
        ...(options.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`,
      });

      const response = await fetch(url, {
        ...options,
        headers: buildHeaders(session.accessToken),
      });

      if (response.status !== 401) {
        return response;
      }

      // Token expirado: refrescar y reintentar exactamente una vez
      try {
        const newAccessToken = await refreshAccessToken(session.refreshToken);
        const updatedSession: AuthSession = {
          ...session,
          accessToken: newAccessToken,
        };
        await saveSession(updatedSession);

        return await fetch(url, {
          ...options,
          headers: buildHeaders(newAccessToken),
        });
      } catch {
        await clearSession();
        setUser(null);
        throw new Error("Session expired. Please log in again.");
      }
    },
    []
  );

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
      authenticatedFetch,
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
      authenticatedFetch,
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
