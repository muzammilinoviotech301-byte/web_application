"""Small helpers shared by the account and admin routers."""

from typing import Any, Callable

from ..errors import ServiceError
from ..supabase_client import BackendConfigurationError, get_data_client


def run(label: str, action: Callable[[Any], Any]) -> Any:
    """Run a Supabase query as the current request's user and return .data."""
    try:
        result = action(get_data_client())
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except ServiceError:
        raise
    except Exception as exc:  # postgrest errors carry a dict-like message
        message = getattr(exc, "message", None) or str(exc)
        status = 403 if "row-level security" in message or "permission denied" in message else 500
        raise ServiceError(f"Could not {label}: {message}", status_code=status) from exc
    return getattr(result, "data", result)


def first(rows: Any) -> dict:
    if isinstance(rows, list):
        if not rows:
            raise ServiceError("Not found.", status_code=404)
        return rows[0]
    return rows or {}
