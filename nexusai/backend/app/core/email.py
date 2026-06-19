"""
Transactional email service for NexusAI.

Supports two providers selected by EMAIL_PROVIDER env var:
  - resend  (default, recommended — simple REST API)
  - sendgrid (alternative)
  - console  (development — prints to stdout, no actual send)

Add to backend/.env:
  EMAIL_PROVIDER=console          # dev
  EMAIL_PROVIDER=resend           # prod
  RESEND_API_KEY=re_...
  EMAIL_FROM=noreply@nexusai.com
  APP_BASE_URL=https://nexusai.example.com
"""
from __future__ import annotations

import os
import re
import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)


async def send_password_reset(to_email: str, reset_token: str) -> None:
    """
    Send a password reset email.
    The token is appended to APP_BASE_URL/reset-password?token=...
    """
    reset_url = f"{settings.app_base_url}/reset-password?token={reset_token}"
    subject = "Reset your NexusAI password"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:0 16px">
      <h2 style="font-size:20px;color:#0f172a">Reset your password</h2>
      <p style="color:#475569;line-height:1.6">
        We received a request to reset the password for your NexusAI account.
        Click the button below — the link expires in <strong>1 hour</strong>.
      </p>
      <a href="{reset_url}"
         style="display:inline-block;margin:24px 0;background:#f59e0b;color:#0f172a;
                text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">
        Reset password
      </a>
      <p style="color:#94a3b8;font-size:12px">
        If you didn't request this, you can safely ignore this email.<br>
        The link will expire automatically.
      </p>
    </div>
    """
    # sensitive=True prevents the HTML body (which contains the live token)
    # from appearing in console output or error logs.
    await _send(to_email, subject, html, sensitive=True)


async def send_welcome(to_email: str, workspace_name: str) -> None:
    """Sent immediately after successful registration."""
    subject = f"Welcome to NexusAI — {workspace_name}"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:0 16px">
      <h2 style="font-size:20px;color:#0f172a">Welcome to NexusAI 🧠</h2>
      <p style="color:#475569;line-height:1.6">
        Your workspace <strong>{workspace_name}</strong> is ready.
        Upload your first document and start asking questions.
      </p>
      <a href="{settings.app_base_url}/dashboard/documents"
         style="display:inline-block;margin:24px 0;background:#f59e0b;color:#0f172a;
                text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px">
        Upload your first document
      </a>
    </div>
    """
    await _send(to_email, subject, html, sensitive=False)


async def send_verification(to_email: str, verify_url: str) -> None:
    """Send an email verification link."""
    subject = "Verify your NexusAI email"
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:0 16px">
      <h2>Verify your email</h2>
      <p>Click the button below to verify your NexusAI account email address.</p>
      <a href="{verify_url}" style="display:inline-block;margin:24px 0;background:#f59e0b;color:#0f172a;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;">Verify email</a>
      <p style="color:#94a3b8;font-size:12px">This link expires in 24 hours.</p>
    </div>
    """
    await _send(to_email, subject, html, sensitive=False)


# ── Provider dispatch ─────────────────────────────────────────────────────────

async def _send(to: str, subject: str, html: str, *, sensitive: bool = False) -> None:
    if settings.email_provider == "resend":
        await _send_resend(to, subject, html, sensitive=sensitive)
    elif settings.email_provider == "sendgrid":
        await _send_sendgrid(to, subject, html, sensitive=sensitive)
    else:
        # Console provider — development only.
        # Never print the HTML body for sensitive emails (e.g. password reset)
        # as it contains live tokens that would appear in terminal logs.
        log.info("email.console", subject=subject)
        print(f"\n{'─'*60}")
        print(f"📧 EMAIL (console provider)")
        print(f"   Subject: {subject}")
        if sensitive:
            print(f"   Body:    [redacted — contains sensitive token]")
        else:
            print(f"   Preview: {html[:200].strip()}...")
        print(f"{'─'*60}\n")


async def _send_resend(to: str, subject: str, html: str, *, sensitive: bool = False) -> None:
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={"from": settings.email_from, "to": [to], "subject": subject, "html": html},
        )
        if response.status_code >= 400:
            # Never log response.text — the provider may echo the request
            # payload which contains the HTML body with the live reset token.
            log.error("email.resend_failed", status=response.status_code)
            raise RuntimeError(f"Resend API error {response.status_code}")
        log.info("email.sent", provider="resend")


def _parse_from_address(raw: str) -> dict[str, str]:
    """
    Parse an RFC 822 formatted From address into a SendGrid ``from`` object.

    Handles both:
      - "NexusAI <noreply@nexusai.com>"  → {"email": "...", "name": "NexusAI"}
      - "noreply@nexusai.com"            → {"email": "..."}
    """
    match = re.match(r"^(.*?)\s*<([^>]+)>\s*$", raw)
    if match:
        name = match.group(1).strip()
        email = match.group(2).strip()
        result: dict[str, str] = {"email": email}
        if name:
            result["name"] = name
        return result
    return {"email": raw.strip()}


async def _send_sendgrid(to: str, subject: str, html: str, *, sensitive: bool = False) -> None:
    """
    Send via SendGrid v3 Mail Send API.

    Fix: the original payload was missing the required ``personalizations``
    wrapper, which caused a 400 Bad Request from SendGrid.
    """
    import httpx
    sg_key = os.getenv("SENDGRID_API_KEY", "")
    from_obj = _parse_from_address(settings.email_from)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={"Authorization": f"Bearer {sg_key}"},
            json={
                "personalizations": [
                    {
                        "to": [{"email": to}],
                    }
                ],
                "from": from_obj,
                "subject": subject,
                "content": [{"type": "text/html", "value": html}],
            },
        )
        if response.status_code >= 400:
            log.error("email.sendgrid_failed", status=response.status_code)
            raise RuntimeError(f"SendGrid error {response.status_code}")
        log.info("email.sent", provider="sendgrid")
