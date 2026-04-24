export interface User {
  id: string;       // Keycloak sub (UUID)
  name: string;
  email: string;
  roles: string[];
}
