from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CurrentUser(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    email: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ApiMessage(BaseModel):
    message: str


class SignUpRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3)
    password: str = Field(min_length=6)
    metadata: dict[str, Any] = Field(default_factory=dict)


class RegisterRequest(BaseModel):
    """The fields of SAP's registration form ("We see you're new to SAP")."""

    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3)
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    country: str = Field(min_length=1)
    phone: str = ""
    company: str = Field(min_length=1)
    department: str = Field(min_length=1)
    relationship: str = Field(min_length=1)
    contact_by_email: bool = False
    contact_by_phone: bool = False
    terms_accepted: bool

    @field_validator("terms_accepted")
    @classmethod
    def _terms_required(cls, value: bool) -> bool:
        if not value:
            raise ValueError("The Terms and Conditions of SAP.com must be accepted.")
        return value


class SignInRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class EmailCheckRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3)


class EmailCheckOut(BaseModel):
    email: str
    registered: bool


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str = Field(min_length=1)


class PasswordUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    password: str = Field(min_length=8)


class PasswordRecoveryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3)


class AuthSessionOut(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: int | None = None
    token_type: str
    user: dict[str, Any]


class SignUpOut(BaseModel):
    user: dict[str, Any] | None
    needs_confirmation: bool


class ProfileOut(BaseModel):
    id: str
    email: str
    first_name: str = ""
    last_name: str = ""
    display_name: str = ""
    company: str = ""
    country: str = ""
    department: str = ""
    relationship: str = ""
    phone: str = ""
    contact_by_email: bool = False
    contact_by_phone: bool = False
    terms_accepted_at: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    company: str | None = None
    country: str | None = None
    department: str | None = None
    relationship: str | None = None
    phone: str | None = None
    contact_by_email: bool | None = None
    contact_by_phone: bool | None = None


class PreferenceItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str = Field(min_length=1)
    enabled: bool


class PreferencesUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    preferences: list[PreferenceItem]


class InterestsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    products: list[str]


class InboxMessageOut(BaseModel):
    id: str
    subject: str
    sender: str
    body: str = ""
    is_read: bool = False
    created_at: str | None = None


class DashboardSummary(BaseModel):
    eyebrow: str = "SAP.com Dashboard"
    title: str = "Welcome to your dashboard"
    interests: list[str] = Field(default_factory=list)
    preferences: dict[str, bool] = Field(default_factory=dict)
    counts: dict[str, int] = Field(default_factory=dict)
    saved_items: list[dict[str, Any]] = Field(default_factory=list)
