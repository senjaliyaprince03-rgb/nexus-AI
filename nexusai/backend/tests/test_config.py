from __future__ import annotations

from pathlib import Path

import pytest

from app.core.config import Settings, _resolve_env_files


def test_resolve_env_files_prefers_explicit_override(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENV_FILE", ".env.production")
    assert _resolve_env_files() == (".env.production",)


def test_production_placeholders_are_rejected() -> None:
    scratch_dir = Path(__file__).resolve().parent / ".tmp-local-config"
    scratch_dir.mkdir(exist_ok=True)
    env_file = scratch_dir / ".env.production"
    env_file.write_text(
        "\n".join(
            [
                "ENVIRONMENT=production",
                "MONGODB_URI=mongodb://user:pass@localhost:27017/?authSource=admin",
                "SECRET_KEY=super-secret-key",
                "OPENAI_API_KEY=real-openai-key",
                "APP_BASE_URL=https://app.nexusai.local",
                'CORS_ORIGINS=["https://<your-app>.up.railway.app"]',
            ]
        ),
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="CORS_ORIGINS still contains placeholder values"):
        Settings(_env_file=env_file)

    env_file.unlink(missing_ok=True)


def test_provider_specific_llm_credentials_are_resolved() -> None:
    scratch_dir = Path(__file__).resolve().parent / ".tmp-local-config"
    scratch_dir.mkdir(exist_ok=True)
    env_file = scratch_dir / ".env.production"
    env_file.write_text(
        "\n".join(
            [
                "ENVIRONMENT=production",
                "LLM_PROVIDER=nvidia",
                "MONGODB_URI=mongodb://user:pass@localhost:27017/?authSource=admin",
                "SECRET_KEY=super-secret-key-that-is-long-enough",
                "NVIDIA_API_KEY=real-nvidia-key",
                "NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1",
                "APP_BASE_URL=https://app.nexusai.local",
                'CORS_ORIGINS=["https://app.nexusai.local"]',
            ]
        ),
        encoding="utf-8",
    )

    settings = Settings(_env_file=env_file)
    api_key, base_url = settings.get_llm_credentials()

    assert api_key == "real-nvidia-key"
    assert base_url == "https://integrate.api.nvidia.com/v1"

    env_file.unlink(missing_ok=True)
