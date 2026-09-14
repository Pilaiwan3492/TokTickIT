import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  changePasswordApi,
  getMeApi,
  getStoredToken,
  loginApi,
  logoutApi,
  removeStoredToken,
  setStoredToken,
} from "../api/auth.api";
import {
  AuthUser,
  ChangePasswordPayload,
  LoginCredentials,
  UserRole,
} from "../types/auth";

export interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial session hydration
  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      const stored = getStoredToken();
      if (!stored) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await getMeApi(stored);
        if (isMounted) {
          setToken(stored);
          setUser(profile);
        }
      } catch (err) {
        // Token is revoked, expired, or invalid - clear session safely
        removeStoredToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Global session-expired event listener (dispatched by apiFetch on 401 SESSION_*)
  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener("toktickit:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("toktickit:session-expired", handleSessionExpired);
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthUser> => {
      const authData = await loginApi(credentials);
      setStoredToken(authData.token);
      setToken(authData.token);
      setUser(authData.user);
      return authData.user;
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    const currentToken = token || getStoredToken();
    // Clear local authentication state first to avoid stale sessions
    removeStoredToken();
    setToken(null);
    setUser(null);

    // Dispatch server-side revocation
    if (currentToken) {
      await logoutApi(currentToken);
    }
  }, [token]);

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload): Promise<void> => {
      await changePasswordApi(payload, token);
      setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
      // Refresh authoritative user profile from /auth/me
      try {
        const updatedUser = await getMeApi(token);
        setUser(updatedUser);
      } catch {
        // If refresh fails, client state already recorded mustChangePassword = false
      }
    },
    [token]
  );

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const currentToken = token || getStoredToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      return null;
    }

    try {
      const profile = await getMeApi(currentToken);
      setUser(profile);
      return profile;
    } catch (err) {
      // If /me rejects (revoked, expired, inactive), clear session
      removeStoredToken();
      setToken(null);
      setUser(null);
      return null;
    }
  }, [token]);

  const isAuthenticated = !!token && !!user && user.isActive !== false;
  const mustChangePassword = !!user?.mustChangePassword;
  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isLoading,
        isAuthenticated,
        mustChangePassword,
        login,
        logout,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
