from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .config import get_settings
from .errors import ServiceError
from .routers import admin, auth, catalog, dashboard, health, inbox, me, profile
from .supabase_client import reset_request_token, set_request_token

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description="Backend API for the SAP website clone, backed by Supabase.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RequestTokenMiddleware:
    """Expose the request's bearer token to get_data_client() so database
    calls run as the signed-in user (row-level security applies)."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        token = None
        for name, value in scope.get("headers", []):
            if name == b"authorization":
                text = value.decode("latin-1")
                if text.lower().startswith("bearer "):
                    token = text.split(" ", 1)[1].strip() or None
                break
        marker = set_request_token(token)
        try:
            await self.app(scope, receive, send)
        finally:
            reset_request_token(marker)


app.add_middleware(RequestTokenMiddleware)


@app.exception_handler(ServiceError)
async def service_error_handler(_: Request, exc: ServiceError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(profile.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(inbox.router, prefix=settings.api_prefix)
app.include_router(catalog.router, prefix=settings.api_prefix)
app.include_router(me.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)


@app.get("/", tags=["health"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "version": __version__,
        "docs": "/docs",
        "api": settings.api_prefix,
    }
