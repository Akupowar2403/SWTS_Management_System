import type KeycloakType from "keycloak-js";

// Singleton — only lives on the client. Never instantiated during SSR.
let _kc: KeycloakType | null = null;

export async function getKeycloak(): Promise<KeycloakType> {
  if (_kc) return _kc;
  const { default: Keycloak } = await import("keycloak-js");
  _kc = new Keycloak({
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "swts-realm",
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "swts-app",
  });
  return _kc;
}

/** Returns the current bearer token, or undefined if not yet authenticated. */
export function keycloakToken(): string | undefined {
  return _kc?.token;
}
