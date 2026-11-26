from fastapi import APIRouter

from .. import __version__
from ..config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": __version__,
        "environment": settings.environment,
        "supabase": "configured" if settings.supabase_configured else "not_configured",
        "service_role": "configured" if settings.service_role_configured else "not_configured",
    }
