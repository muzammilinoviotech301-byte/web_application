from ..errors import ServiceError
from ..schemas import CurrentUser
from ..supabase_client import BackendConfigurationError, get_data_client


def _profile_rows(user_id: str) -> list[dict]:
    try:
        result = (
            get_data_client()
            .table("profiles")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not load profile: {exc}") from exc
    return result.data or []


def ensure_profile(user: CurrentUser) -> dict:
    rows = _profile_rows(user.id)
    if rows:
        return rows[0]

    metadata = user.metadata
    first_name = str(metadata.get("first_name") or "")
    last_name = str(metadata.get("last_name") or "")
    display_name = str(
        metadata.get("display_name")
        or f"{first_name} {last_name}".strip()
        or user.email.split("@")[0]
        or "SAP User"
    )

    payload = {
        "id": user.id,
        "email": user.email,
        "first_name": first_name,
        "last_name": last_name,
        "display_name": display_name,
        "company": str(metadata.get("company") or ""),
        "country": str(metadata.get("country") or "Pakistan"),
        "department": str(metadata.get("department") or ""),
        "relationship": str(metadata.get("relationship") or ""),
        "phone": str(metadata.get("phone") or ""),
    }

    try:
        result = (
            get_data_client()
            .table("profiles")
            .upsert(payload, on_conflict="id")
            .execute()
        )
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not create profile: {exc}") from exc

    if not result.data:
        raise ServiceError("Profile could not be created.")
    return result.data[0] if isinstance(result.data, list) else result.data


def update_profile(user_id: str, values: dict) -> dict:
    payload = {key: value for key, value in values.items() if value is not None}
    if not payload:
        rows = _profile_rows(user_id)
        if not rows:
            raise ServiceError("Profile not found.", status_code=404)
        return rows[0]

    try:
        result = (
            get_data_client()
            .table("profiles")
            .update(payload)
            .eq("id", user_id)
            .execute()
        )
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc
    except Exception as exc:
        raise ServiceError(f"Could not update profile: {exc}") from exc

    if not result.data:
        return _profile_rows(user_id)[0]
    return result.data[0]
