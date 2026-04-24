"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import type KeycloakType from "keycloak-js";
import { getKeycloak } from "./keycloak";

export interface AuthUser {
  id: string;      // Keycloak sub (UUID)
  name: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  hasRole: (...roles: string[]) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  hasRole: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const kcRef = useRef<KeycloakType | null>(null);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setInterval>;

    getKeycloak()
      .then((kc) => {
        kcRef.current = kc;
        return kc.init({
          onLoad: "login-required",   // redirects to Keycloak if not logged in
          checkLoginIframe: false,
          pkceMethod: "S256",
        });
      })
      .then((authenticated) => {
        const kc = kcRef.current;
        if (authenticated && kc?.tokenParsed) {
          const t = kc.tokenParsed as Record<string, unknown>;
          setUser({
            id: t.sub as string,
            name: ((t.name || t.preferred_username || t.email) as string) ?? "",
            email: (t.email as string) ?? "",
            roles: (t.realm_access as { roles?: string[] })?.roles ?? [],
          });
        }
        setIsLoading(false);

        // Refresh the token every 60 s if it expires within 30 s
        refreshTimer = setInterval(() => {
          kcRef.current?.updateToken(30).catch(() => kcRef.current?.login());
        }, 60_000);
      })
      .catch(() => setIsLoading(false));

    return () => clearInterval(refreshTimer);
  }, []);

  function logout() {
    kcRef.current?.logout({ redirectUri: window.location.origin });
  }

  function hasRole(...roles: string[]) {
    return roles.some((r) => user?.roles.includes(r));
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Connecting to SWTS…</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, hasRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
