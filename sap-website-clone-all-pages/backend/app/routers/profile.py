from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..schemas import (
    CurrentUser,
    InterestsUpdate,
    PreferencesUpdate,
    ProfileOut,
    ProfileUpdate,
)
from ..services.interests import get_interests, replace_interests
from ..services.preferences import get_preferences, replace_preferences
from ..services.profiles import ensure_profile, update_profile

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def get_profile(user: CurrentUser = Depends(get_current_user)) -> dict:
    return ensure_profile(user)


@router.patch("", response_model=ProfileOut)
def patch_profile(
    payload: ProfileUpdate, user: CurrentUser = Depends(get_current_user)
) -> dict:
    return update_profile(user.id, payload.model_dump())


@router.get("/preferences")
def get_email_preferences(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"preferences": get_preferences(user.id)}


@router.put("/preferences")
def put_email_preferences(
    payload: PreferencesUpdate, user: CurrentUser = Depends(get_current_user)
) -> dict:
    preferences = replace_preferences(
        user.id, [item.model_dump() for item in payload.preferences]
    )
    return {"preferences": preferences}


@router.get("/interests")
def get_user_interests(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"products": get_interests(user.id)}


@router.put("/interests")
def put_user_interests(
    payload: InterestsUpdate, user: CurrentUser = Depends(get_current_user)
) -> dict:
    return {"products": replace_interests(user.id, payload.products)}
