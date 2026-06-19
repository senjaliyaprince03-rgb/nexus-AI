"""Analytics service tests."""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_query_volume_returns_daily_counts(client: AsyncClient, auth_headers):
    with patch("app.services.analytics_service.get_query_volume", new_callable=AsyncMock) as mock:
        mock.return_value = [{"date": "2025-01-01", "count": 5}]
        res = await client.get("/api/analytics/queries", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_document_usage_reads_citations(client: AsyncClient, auth_headers):
    with patch("app.services.analytics_service.get_document_usage", new_callable=AsyncMock) as mock:
        mock.return_value = [{"document_id": "d1", "filename": "doc.pdf", "query_hits": 10}]
        res = await client.get("/api/analytics/documents/usage", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data[0]["query_hits"] == 10


@pytest.mark.asyncio
async def test_analytics_requires_auth(client: AsyncClient):
    res = await client.get("/api/analytics/queries")
    assert res.status_code in (401, 403)
