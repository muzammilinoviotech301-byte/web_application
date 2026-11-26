from ..errors import ServiceError
from ..supabase_client import BackendConfigurationError, get_data_client
from .interests import get_interests
from .preferences import get_preferences


def _count(client, table: str, user_id: str, column: str | None = None, value=None) -> int:
    query = client.table(table).select("id", count="exact").eq("user_id", user_id)
    if column:
        query = query.eq(column, value)
    result = query.execute()
    return int(result.count or 0)


def get_dashboard(user_id: str) -> dict:
    try:
        client = get_data_client()
        saved = (
            client.table("saved_items")
            .select("id,title,url,created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        counts = {
            "active_trials": _count(client, "user_trials", user_id, "status", "active"),
            "recommended_trials": _count(client, "user_trials", user_id, "status", "recommended"),
            "active_learnings": _count(client, "user_learnings", user_id, "status", "active"),
            "recommended_events": _count(client, "user_events", user_id, "status", "recommended"),
            "unread_messages": _count(client, "inbox_messages", user_id, "is_read", False),
        }
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not load dashboard: {exc}") from exc

    return {
        "eyebrow": "SAP.com Dashboard",
        "title": "Welcome to your dashboard",
        "interests": get_interests(user_id),
        "preferences": get_preferences(user_id),
        "counts": counts,
        "saved_items": saved.data or [],
    }
