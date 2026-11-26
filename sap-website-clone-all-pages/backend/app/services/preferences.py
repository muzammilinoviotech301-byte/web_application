from ..errors import ServiceError
from ..supabase_client import BackendConfigurationError, get_data_client

DEFAULT_PREFERENCES = (
    "News and updates",
    "Product announcements",
    "Events and webinars",
    "Learning and tutorials",
    "Newsletters",
    "Special offers",
)


def get_preferences(user_id: str) -> dict[str, bool]:
    try:
        result = (
            get_data_client()
            .table("email_preferences")
            .select("topic,enabled")
            .eq("user_id", user_id)
            .execute()
        )
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not load preferences: {exc}") from exc

    stored = {row["topic"]: bool(row["enabled"]) for row in (result.data or [])}
    preferences = {topic: stored.get(topic, False) for topic in DEFAULT_PREFERENCES}
    for topic, enabled in stored.items():
        if topic not in preferences:
            preferences[topic] = enabled
    return preferences


def replace_preferences(user_id: str, preferences: list[dict]) -> dict[str, bool]:
    seen: set[str] = set()
    rows = []
    for item in preferences:
        topic = item["topic"].strip()
        if not topic or topic in seen:
            continue
        seen.add(topic)
        rows.append({"user_id": user_id, "topic": topic, "enabled": bool(item["enabled"])})

    try:
        client = get_data_client()
        client.table("email_preferences").delete().eq("user_id", user_id).execute()
        if rows:
            client.table("email_preferences").insert(rows).execute()
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not save preferences: {exc}") from exc

    return get_preferences(user_id)
