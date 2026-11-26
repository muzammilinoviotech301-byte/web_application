"""Admin panel API: catalog, page content, broadcast messages, admins.

Access is enforced twice: require_admin() below, and row-level security in
the database (public.is_admin()), so a non-admin token can't write even if
it reached these routes."""

from typing import Any, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from ..deps import get_current_user
from ..errors import ServiceError
from ..schemas import ApiMessage, CurrentUser
from ..services.db import first, run

router = APIRouter(prefix="/admin", tags=["admin"])

Kind = Literal["trial", "learning", "event", "demo", "newsletter", "product", "product_login", "whats_new"]


def _is_admin() -> bool:
    return bool(run("check admin access", lambda c: c.rpc("is_admin", {}).execute()))


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not _is_admin():
        raise ServiceError("Admin access required.", status_code=403)
    return user


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CatalogIn(_Model):
    kind: Kind
    title: str = Field(min_length=1, max_length=300)
    description: str = ""
    category: str = ""
    url: str = ""
    image_url: str = ""
    price: float = Field(default=0, ge=0)
    badge: str = ""
    meta: dict[str, Any] = Field(default_factory=dict)
    sort: int = 0
    active: bool = True


class CatalogPatch(_Model):
    kind: Kind | None = None
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    category: str | None = None
    url: str | None = None
    image_url: str | None = None
    price: float | None = Field(default=None, ge=0)
    badge: str | None = None
    meta: dict[str, Any] | None = None
    sort: int | None = None
    active: bool | None = None


class ContentIn(_Model):
    data: dict[str, Any]


class BroadcastIn(_Model):
    subject: str = Field(min_length=1, max_length=300)
    sender: str = Field(default="SAP", max_length=120)
    body: str = ""
    active: bool = True


class BroadcastPatch(_Model):
    subject: str | None = Field(default=None, min_length=1, max_length=300)
    sender: str | None = None
    body: str | None = None
    active: bool | None = None


class AdminIn(_Model):
    email: str = Field(min_length=3, max_length=320)


@router.get("/me")
def admin_me(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"is_admin": _is_admin(), "email": user.email}


# Catalog --------------------------------------------------------------------
@router.get("/catalog")
def all_catalog(_: CurrentUser = Depends(require_admin)) -> list[dict]:
    return run(
        "load the catalog",
        lambda c: c.table("catalog_items").select("*").order("kind").order("sort").order("created_at").execute(),
    ) or []


@router.post("/catalog")
def create_catalog(payload: CatalogIn, _: CurrentUser = Depends(require_admin)) -> dict:
    return first(run("create the item", lambda c: c.table("catalog_items").insert(payload.model_dump()).execute()))


@router.patch("/catalog/{item_id}")
def update_catalog(item_id: str, payload: CatalogPatch, _: CurrentUser = Depends(require_admin)) -> dict:
    values = payload.model_dump(exclude_none=True)
    if not values:
        raise ServiceError("Nothing to update.", status_code=400)
    return first(run("update the item", lambda c: c.table("catalog_items").update(values).eq("id", item_id).execute()))


@router.delete("/catalog/{item_id}", response_model=ApiMessage)
def delete_catalog(item_id: str, _: CurrentUser = Depends(require_admin)) -> ApiMessage:
    run("delete the item", lambda c: c.table("catalog_items").delete().eq("id", item_id).execute())
    return ApiMessage(message="Deleted.")


# Page content ----------------------------------------------------------------
@router.put("/content/{key}")
def put_content(key: str, payload: ContentIn, user: CurrentUser = Depends(require_admin)) -> dict:
    row = first(run(
        "save page content",
        lambda c: c.table("site_content").upsert(
            {"key": key, "data": payload.data, "updated_by": user.email}, on_conflict="key"
        ).execute(),
    ))
    return row["data"]


@router.delete("/content/{key}", response_model=ApiMessage)
def reset_content(key: str, _: CurrentUser = Depends(require_admin)) -> ApiMessage:
    run("reset page content", lambda c: c.table("site_content").delete().eq("key", key).execute())
    return ApiMessage(message="Restored the default content.")


# Broadcast messages ------------------------------------------------------------
@router.get("/broadcasts")
def broadcasts(_: CurrentUser = Depends(require_admin)) -> list[dict]:
    return run(
        "load messages",
        lambda c: c.table("broadcast_messages").select("*").order("created_at", desc=True).execute(),
    ) or []


@router.post("/broadcasts")
def create_broadcast(payload: BroadcastIn, _: CurrentUser = Depends(require_admin)) -> dict:
    return first(run("send the message", lambda c: c.table("broadcast_messages").insert(payload.model_dump()).execute()))


@router.patch("/broadcasts/{item_id}")
def update_broadcast(item_id: str, payload: BroadcastPatch, _: CurrentUser = Depends(require_admin)) -> dict:
    values = payload.model_dump(exclude_none=True)
    return first(run("update the message", lambda c: c.table("broadcast_messages").update(values).eq("id", item_id).execute()))


@router.delete("/broadcasts/{item_id}", response_model=ApiMessage)
def delete_broadcast(item_id: str, _: CurrentUser = Depends(require_admin)) -> ApiMessage:
    run("delete the message", lambda c: c.table("broadcast_messages").delete().eq("id", item_id).execute())
    return ApiMessage(message="Deleted.")


# Admins -------------------------------------------------------------------------
@router.get("/admins")
def admins(_: CurrentUser = Depends(require_admin)) -> list[dict]:
    return run("load admins", lambda c: c.table("app_admins").select("*").order("created_at").execute()) or []


@router.post("/admins")
def add_admin(payload: AdminIn, _: CurrentUser = Depends(require_admin)) -> dict:
    email = payload.email.strip().lower()
    return first(run("add the admin", lambda c: c.table("app_admins").upsert({"email": email}, on_conflict="email").execute()))


@router.delete("/admins/{email}", response_model=ApiMessage)
def remove_admin(email: str, user: CurrentUser = Depends(require_admin)) -> ApiMessage:
    if email.strip().lower() == user.email.lower():
        raise ServiceError("You can't remove your own admin access.", status_code=400)
    run("remove the admin", lambda c: c.table("app_admins").delete().eq("email", email.strip().lower()).execute())
    return ApiMessage(message="Removed.")
