import time
import logging
import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, status

from app.calendar.config import settings

logger = logging.getLogger(__name__)

# Cache JWKS for 1 hour so we don't hit Keycloak on every request
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
            options={"verify_aud": False},  # audience varies by Keycloak config
        )
        # Validate issuer — use public URL if set (token iss uses the browser-facing hostname)
        issuer_base = settings.KEYCLOAK_ISSUER_URL or settings.KEYCLOAK_URL
        expected_iss = f"{issuer_base}/realms/{settings.KEYCLOAK_REALM}"
        actual_iss = payload.get("iss", "")
        print(f"[AUTH] Token iss: {actual_iss!r} | Expected: {expected_iss!r}", flush=True)
        if actual_iss != expected_iss:
            raise JWTError(f"Issuer mismatch: got '{actual_iss}' expected '{expected_iss}'")
        return payload
    except JWTError as exc:
        print(f"[AUTH ERROR] JWT failed: {exc}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as exc:
        logger.error("Unexpected error during token validation: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation error: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
