"""
Tests for the review submission endpoint.
Validates Rf/U EMA updates and k recomputation.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
from app.database import Base, get_db

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    app.dependency_overrides[get_db] = override_get_db
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def item_id(client):
    r = await client.post("/api/items/", json={
        "topic": "Quick Sort", "attention": 0.7, "interest": 0.6, "difficulty": 0.6,
        "base_memory": 0.7, "sleep_quality": 0.8, "memory_floor": 0.10,
    })
    return r.json()["id"]


@pytest.mark.asyncio
async def test_passive_review_increments_rf(client, item_id):
    before = (await client.get(f"/api/items/{item_id}")).json()
    r = await client.post(f"/api/items/{item_id}/review", json={"used_in_practice": False})
    assert r.status_code == 200
    after = r.json()
    assert after["revision_frequency"] > before["revision_frequency"]
    assert after["usage_frequency"] == before["usage_frequency"]


@pytest.mark.asyncio
async def test_active_usage_increments_u(client, item_id):
    before = (await client.get(f"/api/items/{item_id}")).json()
    r = await client.post(f"/api/items/{item_id}/review", json={"used_in_practice": True})
    assert r.status_code == 200
    after = r.json()
    assert after["usage_frequency"] > before["usage_frequency"]
    assert after["revision_frequency"] == before["revision_frequency"]


@pytest.mark.asyncio
async def test_review_recomputes_lower_decay_rate(client, item_id):
    before = (await client.get(f"/api/items/{item_id}")).json()
    await client.post(f"/api/items/{item_id}/review", json={"used_in_practice": True})
    await client.post(f"/api/items/{item_id}/review", json={"used_in_practice": True})
    after = (await client.get(f"/api/items/{item_id}")).json()
    assert after["decay_rate"] < before["decay_rate"]


@pytest.mark.asyncio
async def test_usage_slows_decay_more_than_revision(client):
    """Create two identical items; review one passively, one actively. Active should have lower k."""
    payload = {
        "topic": "Test", "attention": 0.7, "interest": 0.5, "difficulty": 0.7,
        "base_memory": 0.7, "sleep_quality": 0.8, "memory_floor": 0.10,
    }
    id_passive = (await client.post("/api/items/", json={**payload, "topic": "Passive Item"})).json()["id"]
    id_active  = (await client.post("/api/items/", json={**payload, "topic": "Active Item"})).json()["id"]

    for _ in range(5):
        await client.post(f"/api/items/{id_passive}/review", json={"used_in_practice": False})
        await client.post(f"/api/items/{id_active}/review",  json={"used_in_practice": True})

    passive = (await client.get(f"/api/items/{id_passive}")).json()
    active  = (await client.get(f"/api/items/{id_active}")).json()
    assert active["decay_rate"] < passive["decay_rate"]


@pytest.mark.asyncio
async def test_review_404(client):
    r = await client.post("/api/items/9999/review", json={"used_in_practice": False})
    assert r.status_code == 404
