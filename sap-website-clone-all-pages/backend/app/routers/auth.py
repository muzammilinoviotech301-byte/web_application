from typing import Any

import httpx
from fastapi import APIRouter, Depends, Header

from ..config import get_settings
from ..deps import forget_token, get_current_user
from ..errors import ServiceError
from ..schemas import (
    ApiMessage,
    AuthSessionOut,
    CurrentUser,
    EmailCheckOut,
    EmailCheckRequest,
    PasswordRecoveryRequest,
    PasswordUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    SignInRequest,
    SignUpOut,
    SignUpRequest,
)
from ..services.profiles import ensure_profile
from ..supabase_client import BackendConfigurationError, get_auth_client, new_anon_client

router = APIRouter(prefix="/auth", tags=["auth"])


def _dump(value: Any) -> dict:
    if value is None:
        return {}
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    return dict(value)


def _client():
    try:
        return new_anon_client()
    except BackendConfigurationError as exc:
        raise ServiceError(str(exc), status_code=503) from exc


def _session_out(session) -> AuthSessionOut:
    if session is None:
        raise ServiceError("Supabase did not return a session.", status_code=401)
    return AuthSessionOut(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_at=session.expires_at,
        token_type=session.token_type,
        user=_dump(session.user),
    )


def _clean_error(exc: Exception) -> str:
    # supabase-py errors carry GoTrue's message (e.g. "Invalid login
    # credentials", "Email not confirmed"); show that, not the class name.
    return getattr(exc, "message", None) or str(exc)


@router.post("/check-email", response_model=EmailCheckOut)
def check_email(payload: EmailCheckRequest) -> EmailCheckOut:
    """Sign-in step 1: decide between the password step and registration."""
    email = payload.email.strip()
    try:
        # No session involved, so the shared client (and its open connection) is fine.
        result = get_auth_client().rpc("email_registered", {"p_email": email}).execute()
    except Exception as exc:
        raise ServiceError(f"Could not check e-mail: {_clean_error(exc)}", status_code=502) from exc
    return EmailCheckOut(email=email, registered=bool(result.data))


@router.post("/signup", response_model=SignUpOut)
def signup(payload: SignUpRequest) -> SignUpOut:
    settings = get_settings()
    try:
        response = _client().auth.sign_up(
            {
                "email": payload.email.strip(),
                "password": payload.password,
                "options": {
                    "data": payload.metadata,
                    "email_redirect_to": f"{settings.frontend_url}/verify-email?confirmed=1",
                },
            }
        )
    except Exception as exc:
        raise ServiceError(f"Registration failed: {_clean_error(exc)}", status_code=400) from exc

    return SignUpOut(
        user=_dump(response.user) or None,
        needs_confirmation=response.session is None,
    )


@router.post("/register", response_model=ApiMessage)
def register(payload: RegisterRequest) -> ApiMessage:
    """SAP-style registration: no password on the form. Supabase creates the
    user (profile filled from the metadata by the on_auth_user_created
    trigger) and e-mails a verification link; the password is chosen in
    step 3 after the link is opened."""
    settings = get_settings()
    metadata = payload.model_dump(exclude={"email"})
    metadata["display_name"] = f"{payload.first_name} {payload.last_name}".strip()
    try:
        _client().auth.sign_in_with_otp(
            {
                "email": payload.email.strip(),
                "options": {
                    "should_create_user": True,
                    "data": metadata,
                    "email_redirect_to": f"{settings.frontend_url}/verify-email?confirmed=1",
                },
            }
        )
    except Exception as exc:
        raise ServiceError(f"Registration failed: {_clean_error(exc)}", status_code=400) from exc
    return ApiMessage(message="We sent you an e-mail to verify your address.")


@router.post("/resend", response_model=ApiMessage)
def resend_confirmation(payload: EmailCheckRequest) -> ApiMessage:
    settings = get_settings()
    try:
        _client().auth.resend(
            {
                "type": "signup",
                "email": payload.email.strip(),
                "options": {"email_redirect_to": f"{settings.frontend_url}/verify-email?confirmed=1"},
            }
        )
    except Exception as exc:
        raise ServiceError(f"Could not resend e-mail: {_clean_error(exc)}", status_code=400) from exc
    return ApiMessage(message="We sent you a new verification e-mail.")


@router.post("/signin", response_model=AuthSessionOut)
def signin(payload: SignInRequest) -> AuthSessionOut:
    try:
        response = _client().auth.sign_in_with_password(
            {"email": payload.email.strip(), "password": payload.password}
        )
    except Exception as exc:
        raise ServiceError(_clean_error(exc), status_code=401) from exc
    return _session_out(response.session)


@router.post("/refresh", response_model=AuthSessionOut)
def refresh(payload: RefreshRequest) -> AuthSessionOut:
    try:
        response = _client().auth.refresh_session(payload.refresh_token)
    except Exception as exc:
        raise ServiceError(f"Session expired: {_clean_error(exc)}", status_code=401) from exc
    return _session_out(response.session)


@router.post("/recover", response_model=ApiMessage)
def recover(payload: PasswordRecoveryRequest) -> ApiMessage:
    settings = get_settings()
    try:
        _client().auth.reset_password_for_email(
            payload.email.strip(),
            {"redirect_to": f"{settings.frontend_url}/reset-password"},
        )
    except Exception as exc:
        raise ServiceError(f"Password recovery failed: {_clean_error(exc)}", status_code=400) from exc

    return ApiMessage(message="If the account exists, a password reset e-mail has been sent.")


@router.post("/password", response_model=ApiMessage)
def update_password(
    payload: PasswordUpdateRequest,
    authorization: str | None = Header(default=None),
    user: CurrentUser = Depends(get_current_user),
) -> ApiMessage:
    """Set a new password for the signed-in user (also used after a reset link)."""
    settings = get_settings()
    token = (authorization or "").split(" ", 1)[-1].strip()
    try:
        response = httpx.put(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"},
            json={"password": payload.password},
            timeout=20,
        )
    except httpx.HTTPError as exc:
        raise ServiceError(f"Could not update password: {exc}", status_code=502) from exc
    if response.status_code >= 400:
        detail = response.json().get("msg") or response.json().get("message") or response.text
        raise ServiceError(f"Could not update password: {detail}", status_code=400)
    return ApiMessage(message="Your password has been changed.")


@router.post("/signout", response_model=ApiMessage)
def signout(
    authorization: str | None = Header(default=None),
    _: CurrentUser = Depends(get_current_user),
) -> ApiMessage:
    """Revoke the session's refresh token on Supabase."""
    settings = get_settings()
    token = (authorization or "").split(" ", 1)[-1].strip()
    forget_token(token)
    try:
        httpx.post(
            f"{settings.supabase_url}/auth/v1/logout",
            headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"},
            timeout=20,
        )
    except httpx.HTTPError:
        pass  # the browser forgets the session regardless
    return ApiMessage(message="Signed out.")


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {
        "user": user.model_dump(),
        "profile": ensure_profile(user),
    }
