"""Security layer tests — JWT, bcrypt, token rotation, file validation."""
from __future__ import annotations

import io
import pytest
from jose import JWTError
from unittest.mock import MagicMock, patch

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token_subject,
    hash_password,
    verify_password,
    verify_token,
)


# ── Password hashing ──────────────────────────────────────────────

def test_hash_password_is_not_plaintext() -> None:
    hashed = hash_password("supersecret")
    assert hashed != "supersecret"
    assert len(hashed) > 20


def test_verify_password_correct() -> None:
    hashed = hash_password("correct-horse-battery")
    assert verify_password("correct-horse-battery", hashed) is True


def test_verify_password_wrong() -> None:
    hashed = hash_password("correct-password")
    assert verify_password("wrong-password", hashed) is False


def test_hash_is_deterministically_different() -> None:
    """bcrypt uses random salt — same plaintext → different hashes."""
    h1 = hash_password("same")
    h2 = hash_password("same")
    assert h1 != h2


def test_verify_works_with_either_hash() -> None:
    h1 = hash_password("same")
    h2 = hash_password("same")
    assert verify_password("same", h1)
    assert verify_password("same", h2)


# ── JWT access tokens ─────────────────────────────────────────────

def test_create_access_token_returns_string() -> None:
    token = create_access_token("user-123")
    assert isinstance(token, str)
    assert len(token) > 10


def test_verify_access_token_returns_payload() -> None:
    token = create_access_token("user-abc", extra={"role": "admin"})
    payload = verify_token(token, token_type="access")
    assert payload["sub"] == "user-abc"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_access_token_wrong_type_rejected() -> None:
    token = create_access_token("user-123")
    with pytest.raises(JWTError):
        verify_token(token, token_type="refresh")


# ── JWT refresh tokens ────────────────────────────────────────────

def test_create_refresh_token_valid() -> None:
    token = create_refresh_token("user-xyz")
    payload = verify_token(token, token_type="refresh")
    assert payload["sub"] == "user-xyz"
    assert payload["type"] == "refresh"


def test_refresh_token_rejected_as_access() -> None:
    token = create_refresh_token("user-xyz")
    with pytest.raises(JWTError):
        verify_token(token, token_type="access")


def test_tampered_token_rejected() -> None:
    token = create_access_token("user-123")
    tampered = token[:-5] + "XXXXX"
    with pytest.raises(JWTError):
        verify_token(tampered)


def test_decode_token_subject_valid() -> None:
    token = create_access_token("user-999")
    sub = decode_token_subject(token)
    assert sub == "user-999"


def test_decode_token_subject_invalid_returns_empty() -> None:
    sub = decode_token_subject("not.a.valid.token")
    assert sub == ""


# ── File validation ───────────────────────────────────────────────
# validate_upload accepts a FastAPI UploadFile and reads it asynchronously.
# We build a minimal async-compatible mock with io.BytesIO as the backing store.

def _make_upload_file(content: bytes, filename: str = "test.pdf") -> MagicMock:
    """Create an async-iterable UploadFile mock backed by a BytesIO buffer."""
    mock_file = MagicMock()
    mock_file.filename = filename
    mock_file.read = MagicMock()

    async def read():
        return content

    mock_file.read = read

    async def async_iter():
        yield content

    mock_file.__aiter__ = lambda self: async_iter().__aiter__()
    return mock_file


@pytest.mark.asyncio
async def test_file_validation_rejects_oversized() -> None:
    from fastapi import HTTPException
    from app.core.file_validation import validate_upload

    big_content = b"x" * (51 * 1024 * 1024)  # 51 MB > 50 MB limit
    upload = _make_upload_file(big_content, filename="big.pdf")
    with pytest.raises(HTTPException) as exc:
        await validate_upload(upload)
    assert exc.value.status_code == 413


@pytest.mark.asyncio
async def test_file_validation_rejects_unsupported_extension() -> None:
    from fastapi import HTTPException
    from app.core.file_validation import validate_upload

    upload = _make_upload_file(b"data", filename="image.png")
    with pytest.raises(HTTPException) as exc:
        await validate_upload(upload)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_file_validation_rejects_pdf_spoof() -> None:
    """File with .pdf extension but non-PDF magic bytes is rejected."""
    from fastapi import HTTPException
    from app.core.file_validation import validate_upload

    # Patch magic so we can control the detected MIME type
    with patch("app.core.file_validation.magic") as mock_magic:
        mock_magic.Magic.return_value.from_buffer.return_value = "image/jpeg"
        upload = _make_upload_file(b"not a real pdf", filename="spoof.pdf")
        with pytest.raises(HTTPException) as exc:
            await validate_upload(upload)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_file_validation_accepts_valid_pdf() -> None:
    from app.core.file_validation import validate_upload

    with patch("app.core.file_validation.magic") as mock_magic:
        mock_magic.Magic.return_value.from_buffer.return_value = "application/pdf"
        upload = _make_upload_file(b"%PDF-1.4 minimal content", filename="doc.pdf")
        # Should not raise
        result = await validate_upload(upload)
    assert result == b"%PDF-1.4 minimal content"


@pytest.mark.asyncio
async def test_file_validation_accepts_text() -> None:
    from app.core.file_validation import validate_upload

    with patch("app.core.file_validation.magic") as mock_magic:
        mock_magic.Magic.return_value.from_buffer.return_value = "text/plain"
        upload = _make_upload_file(b"Plain text content here.", filename="note.txt")
        result = await validate_upload(upload)
    assert result == b"Plain text content here."


@pytest.mark.asyncio
async def test_file_validation_rejects_empty() -> None:
    from fastapi import HTTPException
    from app.core.file_validation import validate_upload

    upload = _make_upload_file(b"", filename="empty.txt")
    with pytest.raises(HTTPException) as exc:
        await validate_upload(upload)
    assert exc.value.status_code == 400
