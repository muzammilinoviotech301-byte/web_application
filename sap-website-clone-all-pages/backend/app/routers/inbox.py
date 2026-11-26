from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..schemas import CurrentUser, InboxMessageOut
from ..services.inbox import get_messages, mark_read

router = APIRouter(prefix="/inbox", tags=["inbox"])


@router.get("", response_model=list[InboxMessageOut])
def inbox(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return get_messages(user.id)


@router.patch("/{message_id}", response_model=InboxMessageOut)
def patch_message(
    message_id: str, user: CurrentUser = Depends(get_current_user)
) -> dict:
    return mark_read(user.id, message_id)
