"""Public catalog and page content (editable in the admin panel)."""

from fastapi import APIRouter, Query

from ..services.db import run

router = APIRouter(tags=["catalog"])

KINDS = ("trial", "learning", "event", "demo", "newsletter", "product", "product_login", "whats_new")


@router.get("/catalog")
def list_catalog(kind: str | None = Query(default=None)) -> list[dict]:
    def query(client):
        q = client.table("catalog_items").select("*").eq("active", True)
        if kind:
            q = q.eq("kind", kind)
        return q.order("kind").order("sort").order("created_at").execute()

    return run("load the catalog", query) or []


@router.get("/content")
def list_content() -> dict:
    rows = run("load page content", lambda c: c.table("site_content").select("key,data").execute()) or []
    return {row["key"]: row["data"] for row in rows}


@router.get("/content/{key}")
def get_content(key: str) -> dict:
    rows = run(
        "load page content",
        lambda c: c.table("site_content").select("data").eq("key", key).limit(1).execute(),
    ) or []
    return rows[0]["data"] if rows else {}
