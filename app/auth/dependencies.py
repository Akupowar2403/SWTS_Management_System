from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.keycloak import decode_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract and validate the Keycloak user from the Bearer token."""
    payload = await decode_token(credentials.credentials)
    return {
        "id": payload["sub"],
        "name": payload.get("name") or payload.get("preferred_username", ""),
        "email": payload.get("email", ""),
        "roles": payload.get("realm_access", {}).get("roles", []),
    }


def require_role(*roles: str):
    """Dependency factory — raises 403 if user doesn't have any of the given roles."""
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if not any(r in user["roles"] for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {list(roles)}",
            )
        return user
    return checker
