from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_WEAK_SECRETS = {
    "change-me-in-production",
    "secret",
    "minioadmin",
    "",
    "local-dev-secret-change-before-production",
    "local-dev-refresh-secret-change-before-production",
}

_PLACEHOLDER_FRAGMENTS = ("<", "example.com")


def _resolve_env_files() -> tuple[str, ...]:
    explicit_env_file = os.getenv("ENV_FILE", "").strip()
    if explicit_env_file:
        return (explicit_env_file,)

    env_files: list[str] = [".env"]
    runtime_environment = os.getenv("ENVIRONMENT", "").strip().lower()
    if runtime_environment:
        candidate = f".env.{runtime_environment}"
        if Path(candidate).exists():
            env_files.append(candidate)
    return tuple(env_files)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_resolve_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"
    cors_origins: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3002",
        ],
        validation_alias=AliasChoices("CORS_ORIGINS", "ALLOWED_ORIGINS"),
    )

    mongodb_uri: str = Field(
        default="",
        validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI"),
    )
    mongodb_db_name: str = Field(
        default="",
        validation_alias=AliasChoices("MONGODB_DB_NAME", "MONGO_DB_NAME"),
    )
    use_mongo_mock: bool = Field(
        default=False,
        validation_alias=AliasChoices("USE_MONGO_MOCK", "MONGO_MOCK"),
    )
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        validation_alias=AliasChoices("REDIS_URL", "CELERY_BROKER_URL", "CELERY_RESULT_BACKEND"),
    )

    jwt_secret: str = Field(
        ...,
        description="JWT signing secret — set via JWT_SECRET env var",
        validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"),
    )
    refresh_token_secret: str = Field(
        default="",
        validation_alias=AliasChoices("REFRESH_TOKEN_SECRET", "JWT_SECRET", "SECRET_KEY"),
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    llm_provider: Literal["openai", "nvidia", "mistral", "gemini"] = "nvidia"
    anthropic_api_key: str = Field(default="", description="Set via ANTHROPIC_API_KEY env var")
    openai_api_key: str = Field(
        default="",
        description="Set via OPENAI_API_KEY / NVIDIA_API_KEY / MISTRAL_API_KEY / GEMINI_API_KEY env var",
        validation_alias=AliasChoices(
            "OPENAI_API_KEY",
            "NVIDIA_API_KEY",
            "MISTRAL_API_KEY",
            "GEMINI_API_KEY",
        ),
    )
    nvidia_api_key: str = Field(default="", validation_alias=AliasChoices("NVIDIA_API_KEY"))
    mistral_api_key: str = Field(default="", validation_alias=AliasChoices("MISTRAL_API_KEY"))
    gemini_api_key: str = Field(default="", validation_alias=AliasChoices("GEMINI_API_KEY"))
    nvidia_base_url: str = Field(default="https://integrate.api.nvidia.com/v1")
    mistral_base_url: str = Field(default="https://api.mistral.ai/v1")
    gemini_base_url: str = Field(default="https://generativelanguage.googleapis.com/v1beta/openai/")
    openai_base_url: str = Field(
        default="https://api.openai.com/v1",
        description="Set via OPENAI_BASE_URL / NVIDIA_BASE_URL / MISTRAL_BASE_URL / GEMINI_BASE_URL env var",
        validation_alias=AliasChoices(
            "OPENAI_BASE_URL",
            "NVIDIA_BASE_URL",
            "MISTRAL_BASE_URL",
            "GEMINI_BASE_URL",
        ),
    )
    huggingface_api_key: str = Field(
        default="",
        description="Set via HUGGINGFACE_API_KEY / HF_API_KEY env var",
        validation_alias=AliasChoices("HUGGINGFACE_API_KEY", "HF_API_KEY"),
    )
    huggingface_model: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        validation_alias=AliasChoices("HUGGINGFACE_MODEL"),
    )
    embedding_model: str = Field(
        default="all-MiniLM-L6-v2",
        validation_alias=AliasChoices("EMBEDDING_MODEL"),
    )
    embedding_dimension: int = Field(
        default=384,
        validation_alias=AliasChoices("EMBEDDING_DIM", "EMBEDDING_DIMENSION"),
    )
    llm_model: str = Field(
        default="deepseek-ai/deepseek-v4-pro",
        validation_alias=AliasChoices("LLM_MODEL", "CLAUDE_MODEL"),
    )
    llm_max_tokens: int = 2048
    rag_top_k: int = 5
    rag_min_score: float = 0.3
    atlas_vector_search_index: str = Field(
        default="",
        validation_alias=AliasChoices("ATLAS_VECTOR_SEARCH_INDEX"),
    )
    allow_local_vector_fallback: bool = Field(
        default=False,
        validation_alias=AliasChoices("ALLOW_LOCAL_VECTOR_FALLBACK"),
    )

    email_provider: str = "console"
    resend_api_key: str = Field(default="", description="Set via RESEND_API_KEY env var")
    email_from: str = Field(
        default="NexusAI <noreply@nexusai.com>",
        validation_alias=AliasChoices("EMAIL_FROM", "FROM_EMAIL"),
    )
    server_url: str = Field(
        default="http://localhost:8000",
        validation_alias=AliasChoices("SERVER_URL", "APP_BASE_URL"),
    )
    app_base_url: str = "http://localhost:3000"
    static_dir: str = Field(default="static", validation_alias=AliasChoices("STATIC_DIR"))
    static_mount_path: str = Field(default="/static", validation_alias=AliasChoices("STATIC_MOUNT_PATH"))
    static_upload_subdir: str = Field(default="uploads", validation_alias=AliasChoices("STATIC_UPLOAD_SUBDIR"))
    minio_endpoint: str = Field(default="", validation_alias=AliasChoices("MINIO_ENDPOINT"))
    minio_access_key: str = Field(default="", validation_alias=AliasChoices("MINIO_ACCESS_KEY"))
    minio_secret_key: str = Field(default="", validation_alias=AliasChoices("MINIO_SECRET_KEY"))
    minio_bucket: str = Field(default="nexusai-documents", validation_alias=AliasChoices("MINIO_BUCKET"))
    minio_use_ssl: bool = Field(default=False, validation_alias=AliasChoices("MINIO_USE_SSL", "MINIO_SECURE"))

    google_client_id: str = Field(default="", description="Set via GOOGLE_CLIENT_ID env var")
    google_client_secret: str = Field(default="", description="Set via GOOGLE_CLIENT_SECRET env var")
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    stripe_api_key: str = Field(default="", description="Set via STRIPE_API_KEY env var")
    stripe_webhook_secret: str = Field(default="", description="Set via STRIPE_WEBHOOK_SECRET env var")
    stripe_pro_monthly_price_id: str = Field(default="", validation_alias=AliasChoices("STRIPE_PRO_MONTHLY_PRICE_ID"))
    stripe_pro_yearly_price_id: str = Field(default="", validation_alias=AliasChoices("STRIPE_PRO_YEARLY_PRICE_ID"))

    sentry_dsn: str = Field(default="", description="Set via SENTRY_DSN env var")

    @property
    def secret_key(self) -> str:
        return self.jwt_secret

    def get_llm_credentials(self) -> tuple[str, str]:
        provider = self.llm_provider.lower()
        if provider == "nvidia":
            return self.nvidia_api_key or self.openai_api_key, self.nvidia_base_url or self.openai_base_url
        if provider == "mistral":
            return self.mistral_api_key or self.openai_api_key, self.mistral_base_url or self.openai_base_url
        if provider == "gemini":
            return self.gemini_api_key or self.openai_api_key, self.gemini_base_url or self.openai_base_url
        return self.openai_api_key, self.openai_base_url

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            import json

            return json.loads(value)
        return value

    @field_validator(
        "mongodb_uri",
        "mongodb_db_name",
        "atlas_vector_search_index",
        "minio_endpoint",
        "minio_access_key",
        "minio_secret_key",
        "minio_bucket",
        mode="before",
    )
    @classmethod
    def strip_string_values(cls, value: str | None) -> str:
        return value.strip() if isinstance(value, str) else ""

    @staticmethod
    def _is_placeholder_url(value: str) -> bool:
        return any(fragment in value for fragment in _PLACEHOLDER_FRAGMENTS)

    @model_validator(mode="after")
    def validate_mongo_runtime(self) -> "Settings":
        if self.use_mongo_mock:
            return self

        missing: list[str] = []
        if not self.mongodb_uri:
            missing.append("MONGODB_URI")
        if not self.mongodb_db_name:
            missing.append("MONGODB_DB_NAME")
        if missing:
            raise ValueError(
                f"MongoDB startup blocked — missing required settings: {missing}. "
                "Set them in backend/.env or the process environment."
            )
        return self

    @model_validator(mode="after")
    def reject_weak_secrets_in_production(self) -> "Settings":
        if self.environment != "production":
            return self

        flagged: list[str] = []
        llm_api_key, llm_base_url = self.get_llm_credentials()
        checks = {
            "jwt_secret": self.jwt_secret,
            f"{self.llm_provider}_api_key": llm_api_key,
        }
        for name, value in checks.items():
            if value in _WEAK_SECRETS:
                flagged.append(name)
        if flagged:
            raise ValueError(
                f"Production startup blocked — weak/empty credentials detected: {flagged}. "
                "Set strong values via environment variables."
            )
        if self._is_placeholder_url(self.server_url):
            raise ValueError("Production startup blocked — SERVER_URL still contains a placeholder value.")
        if self._is_placeholder_url(self.app_base_url):
            raise ValueError("Production startup blocked — APP_BASE_URL still contains a placeholder value.")
        if self._is_placeholder_url(llm_base_url):
            raise ValueError("Production startup blocked — LLM base URL still contains a placeholder value.")
        if any(self._is_placeholder_url(origin) for origin in self.cors_origins):
            raise ValueError("Production startup blocked — CORS_ORIGINS still contains placeholder values.")
        if (self.google_client_id or self.google_client_secret) and self._is_placeholder_url(self.google_redirect_uri):
            raise ValueError("Production startup blocked — GOOGLE_REDIRECT_URI still contains a placeholder value.")
        return self

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
