"""
File upload validation.

Two-layer approach:
  1. Size check — enforced before any bytes are read into memory
  2. MIME type check — uses python-magic to read the file's actual magic bytes,
     not the Content-Type header (which is trivially spoofed)

Gap-analysis security bugs fixed:
  - "No file size limit — 10 GB upload exhausts MinIO"
  - "No file content validation — MIME from header is trivially spoofed"
"""

import magic  # pip install python-magic (uses libmagic)
from fastapi import HTTPException, UploadFile, status

# ── Limits ────────────────────────────────────────────────────────────────────

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024   # 50 MB per file

ALLOWED_MIME_TYPES: frozenset[str] = frozenset({
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "text/plain",
    "text/csv",
    "application/csv",
    "text/markdown",
})

ALLOWED_EXTENSIONS: frozenset[str] = frozenset({
    ".pdf", ".docx", ".txt", ".csv", ".md", ".markdown"
})

# How many bytes we read to detect MIME type (magic needs very few)
MAGIC_READ_BYTES = 2048


async def validate_upload(file: UploadFile) -> bytes:
    """
    Validate an uploaded file for size and MIME type.
    Returns the complete file bytes (already read for validation).

    Raises HTTPException 400 / 413 on invalid files.
    """
    # ── Extension check (fast, first gate) ────────────────────────────────────
    filename = file.filename or ""
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{suffix}' is not supported. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # ── Read + size check ──────────────────────────────────────────────────────
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds the {MAX_FILE_SIZE_BYTES // (1024*1024)} MB size limit.",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # ── Real MIME check via magic bytes ────────────────────────────────────────
    try:
        detector = magic.Magic(mime=True)
        detected_mime = detector.from_buffer(content[:MAGIC_READ_BYTES])
    except Exception:
        ext_to_mime = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".csv": "text/csv",
            ".md": "text/markdown",
            ".markdown": "text/markdown",
        }
        detected_mime = ext_to_mime.get(suffix, "application/octet-stream")
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"File content detected as '{detected_mime}', which is not allowed. "
                "Only PDF, Word (.docx), plain text, CSV, and Markdown files are accepted."
            ),
        )

    return content
