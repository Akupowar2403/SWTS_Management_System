import time
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.calendar.config import settings

# Cache JWKS for 1 hour
_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600


async def _get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at
    if _jwks_cache and (time.time() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache
    url = (
        f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}"
        "/protocol/openid-connect/certs"
    )
    async with httpx.AsyncClient() as client:
        r = await client.get(url, timeout=10)
        r.raise_for_status()
    _jwks_cache = r.json()
    _jwks_fetched_at = time.time()
    return _jwks_cache


async def decode_token(token: str) -> dict:
    """Verify the Keycloak JWT and return its payload."""
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        issuer_base = settings.KEYCLOAK_ISSUER_URL or settings.KEYCLOAK_URL
        expected_iss = f"{issuer_base}/realms/{settings.KEYCLOAK_REALM}"
        actual_iss = payload.get("iss", "")
        if actual_iss != expected_iss:
            raise JWTError(f"Issuer mismatch: got '{actual_iss}' expected '{expected_iss}'")
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_realm_users() -> list[dict]:
    """Fetch all users in the realm from Keycloak Admin API."""
    base = settings.KEYCLOAK_URL
    realm = settings.KEYCLOAK_REALM

    async with httpx.AsyncClient() as client:
        # Get admin access token
        token_res = await client.post(
            f"{base}/realms/master/protocol/openid-connect/token",
            data={
                "grant_type": "password",
                "client_id": "admin-cli",
                "username": settings.KEYCLOAK_ADMIN_USER,
                "password": settings.KEYCLOAK_ADMIN_PASSWORD,
            },
            timeout=10,
        )
        token_res.raise_for_status()
        admin_token = token_res.json()["access_token"]

        # Fetch users
        users_res = await client.get(
            f"{base}/admin/realms/{realm}/users?max=200",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10,
        )
        users_res.raise_for_status()
        raw_users = users_res.json()

    result = []
    for u in raw_users:
        name = " ".join(filter(None, [u.get("firstName", ""), u.get("lastName", "")])).strip()
        result.append({
            "id": u["id"],
            "username": u.get("username", ""),
            "name": name or u.get("username", ""),
            "email": u.get("email", ""),
        })

    return result
