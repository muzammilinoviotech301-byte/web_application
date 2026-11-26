from ..errors import ServiceError
from ..supabase_client import BackendConfigurationError, get_data_client


def get_messages(user_id: str) -> list[dict]:
    try:
        result = (
            get_data_client()
            .table("inbox_messages")
            .select("id,subject,sender,body,is_read,created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not load inbox: {exc}") from exc

    return result.data or []


def mark_read(user_id: str, message_id: str) -> dict:
    try:
        result = (
            get_data_client()
            .table("inbox_messages")
            .update({"is_read": True})
            .eq("id", message_id)
            .eq("user_id", user_id)
            .execute()
        )
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not update message: {exc}") from exc

    if not result.data:
        raise ServiceError("Message not found.", status_code=404)
    return result.data[0]
