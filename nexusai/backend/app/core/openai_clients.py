from __future__ import annotations

from functools import lru_cache

from openai import AsyncOpenAI, OpenAI

from app.core.config import settings


@lru_cache(maxsize=None)
def _sync_client(api_key: str, base_url: str) -> OpenAI:
    return OpenAI(api_key=api_key, base_url=base_url)


@lru_cache(maxsize=None)
def _async_client(api_key: str, base_url: str) -> AsyncOpenAI:
    return AsyncOpenAI(api_key=api_key, base_url=base_url)


def get_llm_credentials() -> tuple[str, str]:
    return settings.get_llm_credentials()


def get_openai_client() -> OpenAI:
    api_key, base_url = get_llm_credentials()
    return _sync_client(api_key, base_url)


def get_async_openai_client() -> AsyncOpenAI:
    api_key, base_url = get_llm_credentials()
    return _async_client(api_key, base_url)
