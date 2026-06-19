from datetime import UTC, datetime, timedelta
import uuid
from typing import Any

from jose import JWTError, jwt
from passlib.hash import pbkdf2_sha256

from app.core.config import settings


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pbkdf2_sha256.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pbkdf2_sha256.verify(plain, hashed)
    except (ValueError, TypeError):
        return False


# ── Token helpers ─────────────────────────────────────────────────────────────

def _make_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(UTC) + expires_delta
    payload["iat"] = datetime.now(UTC)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    data: dict[str, Any] = {"sub": subject, "type": "access"}
    if extra:
        data.update(extra)
    return _make_token(data, timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(subject: str) -> str:
    return _make_token(
        {"sub": subject, "type": "refresh", "jti": str(uuid.uuid4())},
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT.
    Raises ValueError (wrapping JWTError) on any failure.
    """
    try:
        payload: dict[str, Any] = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return payload
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


def verify_token(token: str, token_type: str | None = None) -> dict[str, Any]:
    """
    Decode and verify a JWT, optionally enforcing the token ``type`` claim.

    Raises ``jose.JWTError`` directly (not wrapped) so callers can catch it
    from the ``jose`` namespace, which is the standard pattern in tests.

    Args:
        token:       The encoded JWT string.
        token_type:  If provided, the payload ``type`` field must match this
                     value; otherwise a ``JWTError`` is raised.

    Returns:
        The decoded payload dict.
    """
    try:
        payload: dict[str, Any] = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
    except JWTError:
        raise  # propagate as-is so callers can catch jose.JWTError

    if token_type is not None and payload.get("type") != token_type:
        raise JWTError(
            f"Expected token type '{token_type}', got '{payload.get('type')}'"
        )

    return payload


def decode_token_subject(token: str) -> str:
    """
    Safely decode a token and return its ``sub`` claim.

    Returns an empty string instead of raising on any failure so callers can
    use a simple truthiness check rather than a try/except block.
    """
    try:
        payload: dict[str, Any] = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return str(payload.get("sub", ""))
    except JWTError:
        return ""
