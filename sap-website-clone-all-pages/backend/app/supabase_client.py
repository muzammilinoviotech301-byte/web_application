import threading
from contextvars import ContextVar

from supabase import Client, create_client

from .config import get_settings

_clients: dict[str, Client] = {}


class BackendConfigurationError(RuntimeError):
    """Raised when the backend is missing required Supabase configuration."""


def _client_for(key_name: str, value: str) -> Client:
    cached = _clients.get(key_name)
    if cached is not None:
        return cached

    settings = get_settings()
    if not settings.supabase_configured:
        raise BackendConfigurationError(
            "Supabase is not configured. Copy backend/.env.example to backend/.env "
            "and add your Supabase URL and anon key."
        )

    client = create_client(settings.supabase_url, value)
    _clients[key_name] = client
    return client


def new_anon_client() -> Client:
    """A fresh anon-key client. Sign-in/sign-up store a session on the client
    they run on, so they must never share one between users."""
    settings = get_settings()
    if not settings.supabase_configured:
        raise BackendConfigurationError(
            "Supabase is not configured. Copy backend/.env.example to backend/.env "
            "and add your Supabase URL and anon key."
        )
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_auth_client() -> Client:
    """Anon-key client. Safe for verifying user JWTs and public auth calls."""
    return _client_for("anon", get_settings().supabase_anon_key)


#: The signed-in user's access token for the request being handled (set by
#: the request-token middleware in main.py).
_request_token: ContextVar[str | None] = ContextVar("request_token", default=None)
_user_clients: dict[str, Client] = {}
_user_clients_lock = threading.Lock()


def set_request_token(token: str | None):
    return _request_token.set(token)


def reset_request_token(marker) -> None:
    _request_token.reset(marker)


def get_data_client() -> Client:
    """Client for database operations on behalf of the current request.

    With a service-role key configured, the backend uses it (bypasses RLS).
    Otherwise every query runs as the signed-in user: the anon key plus the
    user's access token, so Supabase row-level security only exposes that
    user's own rows. No secret key is needed for this mode.
    """
    settings = get_settings()
    if settings.service_role_configured:
        return _client_for("service_role", settings.supabase_service_role_key)
    if not settings.supabase_configured:
        raise BackendConfigurationError(
            "Supabase is not configured. Copy backend/.env.example to backend/.env "
            "and add your Supabase URL and anon key."
        )
    token = _request_token.get()
    if not token:
        return get_auth_client()
    # One client per access token, reused across requests: keeps the HTTPS
    # connection to Supabase open instead of a new handshake per query.
    client = _user_clients.get(token)
    if client is None:
        client = create_client(settings.supabase_url, settings.supabase_anon_key)
        client.postgrest.auth(token)
        with _user_clients_lock:
            _user_clients[token] = client
            while len(_user_clients) > 200:
                _user_clients.pop(next(iter(_user_clients)))
    return client


def reset_clients() -> None:
    """Clear cached clients. Useful in tests."""
    _clients.clear()
    _user_clients.clear()
