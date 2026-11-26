from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..schemas import CurrentUser, DashboardSummary
from ..services.dashboard import get_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardSummary)
def dashboard(user: CurrentUser = Depends(get_current_user)) -> dict:
    return get_dashboard(user.id)
