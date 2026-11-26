import time

from fastapi import Header, HTTPException, status

from .config import get_settings
from .schemas import CurrentUser
from .supabase_client import BackendConfigurationError, get_auth_client


# Verified tokens, cached briefly so each page load doesn't re-ask Supabase
# Auth about the same token for every API call.
_verified: dict[str, tuple[float, CurrentUser]] = {}
_TTL_SECONDS = 60


def forget_token(token: str) -> None:
    """Drop a token from the cache (called on sign-out)."""
    _verified.pop(token, None)


def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    """Verify a Supabase access token and return the authenticated user."""
    settings = get_settings()
    if not settings.supabase_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured on the backend.",
        )

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cached = _verified.get(token)
    if cached and cached[0] > time.monotonic():
        return cached[1]

    try:
        response = get_auth_client().auth.get_user(jwt=token)
    except BackendConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = getattr(response, "user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    current = CurrentUser(
        id=str(user.id),
        email=user.email or "",
        metadata=dict(getattr(user, "user_metadata", None) or {}),
    )
    if len(_verified) > 500:
        _verified.clear()
    _verified[token] = (time.monotonic() + _TTL_SECONDS, current)
    return current
