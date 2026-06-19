"""
Unit tests for the transactional email service in app.core.email.
"""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.core.email import (
    _parse_from_address,
    send_password_reset,
    send_welcome,
    _send,
    _send_resend,
    _send_sendgrid,
)

# ── Parse From Address ────────────────────────────────────────────────────────

def test_parse_from_address_with_name() -> None:
    res = _parse_from_address("NexusAI <noreply@nexusai.com>")
    assert res == {"email": "noreply@nexusai.com", "name": "NexusAI"}

def test_parse_from_address_without_name() -> None:
    res = _parse_from_address("noreply@nexusai.com")
    assert res == {"email": "noreply@nexusai.com"}

def test_parse_from_address_with_empty_name() -> None:
    res = _parse_from_address(" <noreply@nexusai.com>")
    assert res == {"email": "noreply@nexusai.com"}

# ── Password Reset & Welcome Templates ────────────────────────────────────────

@pytest.mark.asyncio
async def test_send_password_reset_calls_send() -> None:
    with patch("app.core.email._send", new_callable=AsyncMock) as mock_send:
        await send_password_reset("user@test.com", "token123")
        mock_send.assert_called_once()
        args, kwargs = mock_send.call_args
        assert args[0] == "user@test.com"
        assert "Reset your NexusAI password" in args[1]
        assert "token123" in args[2]
        assert kwargs.get("sensitive") is True

@pytest.mark.asyncio
async def test_send_welcome_calls_send() -> None:
    with patch("app.core.email._send", new_callable=AsyncMock) as mock_send:
        await send_welcome("user@test.com", "My Workspace")
        mock_send.assert_called_once()
        args, kwargs = mock_send.call_args
        assert args[0] == "user@test.com"
        assert "Welcome to NexusAI — My Workspace" in args[1]
        assert "My Workspace" in args[2]
        assert kwargs.get("sensitive") is False

# ── Send Dispatcher ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_send_dispatch_to_resend() -> None:
    with patch("app.core.email.settings.email_provider", "resend"), \
         patch("app.core.email._send_resend", new_callable=AsyncMock) as mock_resend:
        await _send("to@test.com", "Subject", "HTML", sensitive=False)
        mock_resend.assert_called_once_with("to@test.com", "Subject", "HTML", sensitive=False)

@pytest.mark.asyncio
async def test_send_dispatch_to_sendgrid() -> None:
    with patch("app.core.email.settings.email_provider", "sendgrid"), \
         patch("app.core.email._send_sendgrid", new_callable=AsyncMock) as mock_sendgrid:
        await _send("to@test.com", "Subject", "HTML", sensitive=False)
        mock_sendgrid.assert_called_once_with("to@test.com", "Subject", "HTML", sensitive=False)

@pytest.mark.asyncio
async def test_send_dispatch_to_console(capsys) -> None:
    with patch("app.core.email.settings.email_provider", "console"):
        await _send("to@test.com", "Subject", "HTML Body Content", sensitive=False)
        captured = capsys.readouterr()
        assert "EMAIL (console provider)" in captured.out
        assert "Subject: Subject" in captured.out
        assert "HTML Body Content" in captured.out

@pytest.mark.asyncio
async def test_send_dispatch_to_console_sensitive(capsys) -> None:
    with patch("app.core.email.settings.email_provider", "console"):
        await _send("to@test.com", "Subject", "HTML Body Content", sensitive=True)
        captured = capsys.readouterr()
        assert "EMAIL (console provider)" in captured.out
        assert "Subject: Subject" in captured.out
        assert "redacted" in captured.out
        assert "HTML Body Content" not in captured.out

# ── Resend Delivery ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_send_resend_success() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 200

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=mock_client), \
         patch("app.core.email.settings.resend_api_key", "re_key"), \
         patch("app.core.email.settings.email_from", "noreply@nexusai.com"):
        await _send_resend("to@test.com", "Subject", "HTML", sensitive=False)
        mock_client.post.assert_called_once_with(
            "https://api.resend.com/emails",
            headers={"Authorization": "Bearer re_key"},
            json={"from": "noreply@nexusai.com", "to": ["to@test.com"], "subject": "Subject", "html": "HTML"},
        )

@pytest.mark.asyncio
async def test_send_resend_failure() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 400

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=mock_client), \
         patch("app.core.email.settings.resend_api_key", "re_key"):
        with pytest.raises(RuntimeError, match="Resend API error 400"):
            await _send_resend("to@test.com", "Subject", "HTML", sensitive=False)

# ── SendGrid Delivery ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_send_sendgrid_success() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 202

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=mock_client), \
         patch("os.getenv", return_value="SG_key"), \
         patch("app.core.email.settings.email_from", "NexusAI <noreply@nexusai.com>"):
        await _send_sendgrid("to@test.com", "Subject", "HTML", sensitive=False)
        mock_client.post.assert_called_once_with(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": "Bearer SG_key"},
            json={
                "personalizations": [{"to": [{"email": "to@test.com"}]}],
                "from": {"email": "noreply@nexusai.com", "name": "NexusAI"},
                "subject": "Subject",
                "content": [{"type": "text/html", "value": "HTML"}],
            },
        )

@pytest.mark.asyncio
async def test_send_sendgrid_failure() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 500

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=mock_client), \
         patch("os.getenv", return_value="SG_key"):
        with pytest.raises(RuntimeError, match="SendGrid error 500"):
            await _send_sendgrid("to@test.com", "Subject", "HTML", sensitive=False)
