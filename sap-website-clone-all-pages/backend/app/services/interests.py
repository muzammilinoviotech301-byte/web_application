from ..errors import ServiceError
from ..supabase_client import BackendConfigurationError, get_data_client


def get_interests(user_id: str) -> list[str]:
    try:
        result = (
            get_data_client()
            .table("user_interests")
            .select("product")
            .eq("user_id", user_id)
            .order("product")
            .execute()
        )
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not load interests: {exc}") from exc

    return [row["product"] for row in (result.data or []) if row.get("product")]


def replace_interests(user_id: str, products: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for product in products:
        value = product.strip()
        if value and value not in seen:
            seen.add(value)
            cleaned.append(value)

    rows = [{"user_id": user_id, "product": value} for value in cleaned]

    try:
        client = get_data_client()
        client.table("user_interests").delete().eq("user_id", user_id).execute()
        if rows:
            client.table("user_interests").insert(rows).execute()
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not save interests: {exc}") from exc

    return get_interests(user_id)
