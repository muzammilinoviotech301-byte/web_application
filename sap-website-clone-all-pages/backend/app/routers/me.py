"""The signed-in user's dashboard data: trials, learning, events, saved items,
newsletters, recently viewed, cart, orders, inbox and data export.

Every query runs as the user (row-level security), so a user can only ever
read or change their own rows."""

import contextvars
import random
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Literal

import httpx
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, ConfigDict, Field

from ..config import get_settings
from ..deps import forget_token, get_current_user
from ..errors import ServiceError
from ..schemas import ApiMessage, CurrentUser
from ..services.db import first, run
from ..services.interests import get_interests
from ..services.preferences import get_preferences
from ..services.profiles import ensure_profile

router = APIRouter(prefix="/me", tags=["me"])


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class TitleIn(_Model):
    title: str = Field(min_length=1, max_length=300)
    kind: Literal["course", "tutorial", "journey"] = "course"


class SavedIn(_Model):
    title: str = Field(min_length=1, max_length=300)
    url: str = Field(default="", max_length=1000)


class StateIn(_Model):
    # Merged into dashboard_state.data (newsletters, recent, marketing, readBroadcasts…)
    data: dict[str, Any]


class CartIn(_Model):
    product: str = Field(min_length=1, max_length=300)
    plan: str = Field(default="", max_length=200)
    unit_price: float = Field(default=0, ge=0)
    quantity: int = Field(default=1, ge=1, le=999)


class QuantityIn(_Model):
    quantity: int = Field(ge=1, le=999)


# ---------------------------------------------------------------------------
# Dashboard state (JSON per user)
# ---------------------------------------------------------------------------
def _state(user_id: str) -> dict:
    rows = run(
        "load dashboard state",
        lambda c: c.table("dashboard_state").select("data").eq("user_id", user_id).limit(1).execute(),
    ) or []
    return rows[0]["data"] if rows else {}


def _save_state(user_id: str, data: dict) -> dict:
    run(
        "save dashboard state",
        lambda c: c.table("dashboard_state").upsert({"user_id": user_id, "data": data}, on_conflict="user_id").execute(),
    )
    return data


@router.get("/state")
def get_state(user: CurrentUser = Depends(get_current_user)) -> dict:
    return _state(user.id)


@router.patch("/state")
def patch_state(payload: StateIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    data = {**_state(user.id), **payload.data}
    return _save_state(user.id, data)


@router.post("/recent")
def add_recent(payload: SavedIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    """Recently viewed pages (newest first, max 20)."""
    data = _state(user.id)
    recent = [item for item in data.get("recent", []) if item.get("url") != payload.url]
    recent.insert(0, {"title": payload.title, "url": payload.url, "at": datetime.now(timezone.utc).isoformat()})
    data["recent"] = recent[:20]
    _save_state(user.id, data)
    return {"recent": data["recent"]}


# ---------------------------------------------------------------------------
# Trials, learnings, events, saved items
# ---------------------------------------------------------------------------
def _list(table: str, user_id: str, columns: str = "*") -> list[dict]:
    return run(
        f"load {table}",
        lambda c: c.table(table).select(columns).eq("user_id", user_id).order("created_at", desc=True).execute(),
    ) or []


def _delete(table: str, user_id: str, item_id: str) -> ApiMessage:
    run(f"remove from {table}", lambda c: c.table(table).delete().eq("id", item_id).eq("user_id", user_id).execute())
    return ApiMessage(message="Removed.")


def _add_unique(table: str, user_id: str, row: dict) -> dict:
    existing = run(
        f"check {table}",
        lambda c: c.table(table).select("*").eq("user_id", user_id).eq("title" if "title" in row else "name", row.get("title", row.get("name"))).limit(1).execute(),
    ) or []
    if existing:
        return existing[0]
    return first(run(f"add to {table}", lambda c: c.table(table).insert({"user_id": user_id, **row}).execute()))


@router.get("/trials")
def trials(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return _list("user_trials", user.id)


@router.post("/trials")
def start_trial(payload: TitleIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_profile(user)
    return _add_unique("user_trials", user.id, {"name": payload.title, "status": "active"})


@router.delete("/trials/{item_id}", response_model=ApiMessage)
def end_trial(item_id: str, user: CurrentUser = Depends(get_current_user)) -> ApiMessage:
    return _delete("user_trials", user.id, item_id)


@router.get("/learnings")
def learnings(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return _list("user_learnings", user.id)


@router.post("/learnings")
def enroll(payload: TitleIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_profile(user)
    return _add_unique("user_learnings", user.id, {"title": payload.title, "kind": payload.kind, "status": "active"})


@router.patch("/learnings/{item_id}")
def complete_learning(item_id: str, user: CurrentUser = Depends(get_current_user)) -> dict:
    return first(run(
        "update the learning",
        lambda c: c.table("user_learnings").update({"status": "completed"}).eq("id", item_id).eq("user_id", user.id).execute(),
    ))


@router.delete("/learnings/{item_id}", response_model=ApiMessage)
def unenroll(item_id: str, user: CurrentUser = Depends(get_current_user)) -> ApiMessage:
    return _delete("user_learnings", user.id, item_id)


@router.get("/events")
def events(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return _list("user_events", user.id)


@router.post("/events")
def register_event(payload: TitleIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_profile(user)
    return _add_unique("user_events", user.id, {"title": payload.title, "status": "registered"})


@router.delete("/events/{item_id}", response_model=ApiMessage)
def cancel_event(item_id: str, user: CurrentUser = Depends(get_current_user)) -> ApiMessage:
    return _delete("user_events", user.id, item_id)


@router.get("/saved")
def saved(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return _list("saved_items", user.id)


@router.post("/saved")
def save_item(payload: SavedIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_profile(user)
    return _add_unique("saved_items", user.id, {"title": payload.title, "url": payload.url})


@router.delete("/saved/{item_id}", response_model=ApiMessage)
def unsave(item_id: str, user: CurrentUser = Depends(get_current_user)) -> ApiMessage:
    return _delete("saved_items", user.id, item_id)


# ---------------------------------------------------------------------------
# Shopping cart and orders (demo checkout: no payment is taken)
# ---------------------------------------------------------------------------
@router.get("/cart")
def cart(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    return run(
        "load the cart",
        lambda c: c.table("cart_items").select("*").eq("user_id", user.id).order("created_at").execute(),
    ) or []


@router.post("/cart")
def add_to_cart(payload: CartIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    ensure_profile(user)
    existing = run(
        "check the cart",
        lambda c: c.table("cart_items").select("*").eq("user_id", user.id).eq("product", payload.product).limit(1).execute(),
    ) or []
    if existing:
        item = existing[0]
        return first(run(
            "update the cart",
            lambda c: c.table("cart_items").update({"quantity": item["quantity"] + payload.quantity}).eq("id", item["id"]).execute(),
        ))
    return first(run(
        "add to the cart",
        lambda c: c.table("cart_items").insert({"user_id": user.id, **payload.model_dump()}).execute(),
    ))


@router.patch("/cart/{item_id}")
def set_quantity(item_id: str, payload: QuantityIn, user: CurrentUser = Depends(get_current_user)) -> dict:
    return first(run(
        "update the cart",
        lambda c: c.table("cart_items").update({"quantity": payload.quantity}).eq("id", item_id).eq("user_id", user.id).execute(),
    ))


@router.delete("/cart/{item_id}", response_model=ApiMessage)
def remove_from_cart(item_id: str, user: CurrentUser = Depends(get_current_user)) -> ApiMessage:
    return _delete("cart_items", user.id, item_id)


@router.post("/checkout")
def checkout(user: CurrentUser = Depends(get_current_user)) -> dict:
    items = cart(user)
    if not items:
        raise ServiceError("Your cart is empty.", status_code=400)
    total = round(sum(float(i["unit_price"]) * int(i["quantity"]) for i in items), 2)
    number = f"SAP-{random.randint(100000, 999999)}"
    order = first(run(
        "create the order",
        lambda c: c.table("orders").insert(
            {"user_id": user.id, "order_number": number, "status": "Completed", "total": total}
        ).execute(),
    ))
    run("empty the cart", lambda c: c.table("cart_items").delete().eq("user_id", user.id).execute())
    lines = "\n".join(f"{i['quantity']} × {i['product']}" for i in items)
    run(
        "send the confirmation",
        lambda c: c.table("inbox_messages").insert({
            "user_id": user.id,
            "subject": f"Order confirmation {number}",
            "sender": "SAP Store",
            "body": f"Thank you for your order.\n\n{lines}\n\nTotal: ${total:,.2f}",
        }).execute(),
    )
    # Keep the order's line items with the order (orders has no item column).
    data = _state(user.id)
    data.setdefault("orderItems", {})[number] = [
        {"product": i["product"], "plan": i["plan"], "quantity": i["quantity"], "unit_price": i["unit_price"]} for i in items
    ]
    _save_state(user.id, data)
    return order


@router.get("/orders")
def orders(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    rows = _list("orders", user.id)
    items = _state(user.id).get("orderItems", {})
    for row in rows:
        row["items"] = items.get(row["order_number"], [])
    return rows


# ---------------------------------------------------------------------------
# Inbox: the user's own messages plus admin broadcasts
# ---------------------------------------------------------------------------
@router.get("/inbox")
def inbox(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    own = _list("inbox_messages", user.id)
    broadcasts = run(
        "load messages",
        lambda c: c.table("broadcast_messages").select("*").eq("active", True).order("created_at", desc=True).execute(),
    ) or []
    read = set(_state(user.id).get("readBroadcasts", []))
    messages = [{**m, "source": "user"} for m in own] + [
        {**b, "source": "broadcast", "is_read": b["id"] in read} for b in broadcasts
    ]
    return sorted(messages, key=lambda m: m.get("created_at") or "", reverse=True)


@router.post("/inbox/{message_id}/read", response_model=ApiMessage)
def read_message(message_id: str, source: str = "user", user: CurrentUser = Depends(get_current_user)) -> ApiMessage:
    if source == "broadcast":
        data = _state(user.id)
        read = set(data.get("readBroadcasts", []))
        read.add(message_id)
        data["readBroadcasts"] = sorted(read)
        _save_state(user.id, data)
    else:
        run(
            "update the message",
            lambda c: c.table("inbox_messages").update({"is_read": True}).eq("id", message_id).eq("user_id", user.id).execute(),
        )
    return ApiMessage(message="Marked as read.")


@router.delete("/inbox/{message_id}", response_model=ApiMessage)
def delete_message(message_id: str, user: CurrentUser = Depends(get_current_user)) -> ApiMessage:
    return _delete("inbox_messages", user.id, message_id)


# ---------------------------------------------------------------------------
# Dashboard summary, data export, sign out everywhere
# ---------------------------------------------------------------------------
@router.get("/summary")
def summary(user: CurrentUser = Depends(get_current_user)) -> dict:
    # The queries are independent; run them side by side (each one is a
    # round trip to Supabase). copy_context() carries the user's token.
    jobs = {
        "trials": lambda: trials(user),
        "learnings": lambda: learnings(user),
        "events": lambda: events(user),
        "state": lambda: _state(user.id),
        "own": lambda: _list("inbox_messages", user.id, "id,is_read"),
        "broadcasts": lambda: run(
            "load messages",
            lambda c: c.table("broadcast_messages").select("id").eq("active", True).execute(),
        ) or [],
        "catalog": lambda: run(
            "load the catalog",
            lambda c: c.table("catalog_items").select("kind,title").eq("active", True).execute(),
        ) or [],
        "interests": lambda: get_interests(user.id),
        "preferences": lambda: get_preferences(user.id),
        "saved": lambda: _list("saved_items", user.id, "id"),
        "cart": lambda: _list("cart_items", user.id, "quantity"),
        "orders": lambda: _list("orders", user.id, "id"),
    }
    with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
        futures = {name: pool.submit(contextvars.copy_context().run, job) for name, job in jobs.items()}
        got = {name: future.result() for name, future in futures.items()}

    catalog = got["catalog"]
    kinds: dict[str, int] = {}
    for row in catalog:
        kinds[row["kind"]] = kinds.get(row["kind"], 0) + 1
    trials_rows, learning_rows, state = got["trials"], got["learnings"], got["state"]
    started = {t["name"] for t in trials_rows}
    read = set(state.get("readBroadcasts", []))
    unread = len([m for m in got["own"] if not m["is_read"]]) + len([b for b in got["broadcasts"] if b["id"] not in read])
    return {
        "interests": got["interests"],
        "trials": {
            "active": len([t for t in trials_rows if t["status"] == "active"]),
            "recommended": len([r for r in catalog if r["kind"] == "trial" and r["title"] not in started]),
        },
        "learnings": {
            "courses": len([l for l in learning_rows if l["kind"] in ("course", "journey") and l["status"] == "active"]),
            "tutorials": len([l for l in learning_rows if l["kind"] == "tutorial" and l["status"] == "active"]),
            "completed": len([l for l in learning_rows if l["status"] == "completed"]),
        },
        "events": {"registered": len(got["events"]), "recommended": kinds.get("event", 0)},
        "demos": kinds.get("demo", 0),
        "whats_new": kinds.get("whats_new", 0),
        "newsletters": len(state.get("newsletters", [])),
        "saved": len(got["saved"]),
        "recent": len(state.get("recent", [])),
        "marketing": len([v for v in state.get("marketing", {}).values() if v == "Interested"])
        + len([v for v in got["preferences"].values() if v]),
        "unread": unread,
        "messages": len(got["own"]) + len(got["broadcasts"]),
        "cart": sum(int(i["quantity"]) for i in got["cart"]),
        "orders": len(got["orders"]),
    }


@router.get("/export")
def export_data(user: CurrentUser = Depends(get_current_user)) -> dict:
    """Everything stored for this user ("My Data")."""
    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": user.model_dump(),
        "profile": ensure_profile(user),
        "interests": get_interests(user.id),
        "email_preferences": get_preferences(user.id),
        "dashboard": _state(user.id),
        "trials": trials(user),
        "learnings": learnings(user),
        "events": events(user),
        "saved_items": saved(user),
        "cart": cart(user),
        "orders": _list("orders", user.id),
        "inbox": _list("inbox_messages", user.id),
    }


@router.post("/signout-everywhere", response_model=ApiMessage)
def signout_everywhere(
    authorization: str | None = Header(default=None),
    _: CurrentUser = Depends(get_current_user),
) -> ApiMessage:
    """Revoke every session of this user (all browsers and devices)."""
    settings = get_settings()
    token = (authorization or "").split(" ", 1)[-1].strip()
    forget_token(token)
    try:
        httpx.post(
            f"{settings.supabase_url}/auth/v1/logout?scope=global",
            headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"},
            timeout=20,
        )
    except httpx.HTTPError as exc:
        raise ServiceError(f"Could not sign out: {exc}", status_code=502) from exc
    return ApiMessage(message="You have been signed out on all devices.")
