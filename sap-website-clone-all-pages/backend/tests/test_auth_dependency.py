from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app import deps


class _FakeAuth:
    def __init__(self, user):
        self._user = user

    def get_user(self, jwt):
        if jwt != "valid-token":
            raise ValueError("invalid token")
        return SimpleNamespace(user=self._user)


class _FakeClient:
    def __init__(self, user):
        self.auth = _FakeAuth(user)


@pytest.fixture
def configured(monkeypatch):
    monkeypatch.setattr(
        deps,
        "get_settings",
        lambda: SimpleNamespace(supabase_configured=True),
    )


def test_missing_token_is_rejected(configured) -> None:
    with pytest.raises(HTTPException) as error:
        deps.get_current_user(None)
    assert error.value.status_code == 401


def test_valid_token_returns_current_user(configured, monkeypatch) -> None:
    user = SimpleNamespace(
        id="11111111-1111-1111-1111-111111111111",
        email="user@sap.com",
        user_metadata={"first_name": "SAP"},
    )
    monkeypatch.setattr(deps, "get_auth_client", lambda: _FakeClient(user))

    result = deps.get_current_user("Bearer valid-token")
    assert result.id == str(user.id)
    assert result.email == "user@sap.com"
    assert result.metadata["first_name"] == "SAP"


def test_invalid_token_is_rejected(configured, monkeypatch) -> None:
    user = SimpleNamespace(id="id", email="user@sap.com", user_metadata={})
    monkeypatch.setattr(deps, "get_auth_client", lambda: _FakeClient(user))

    with pytest.raises(HTTPException) as error:
        deps.get_current_user("Bearer bad-token")
    assert error.value.status_code == 401
