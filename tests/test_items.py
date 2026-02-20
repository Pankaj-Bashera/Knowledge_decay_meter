"""
Integration tests for /api/items endpoints.
Uses an in-memory SQLite database for isolation.
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


ITEM_PAYLOAD = {
    "topic":      "Binary Search",
    "content":    "A divide-and-conquer search algorithm.",
    "attention":  0.9,
    "interest":   0.8,
    "difficulty": 0.5,
    "base_memory":   0.7,
    "sleep_quality": 0.8,
    "memory_floor":  0.10,
}


@pytest.mark.asyncio
async def test_create_item_returns_k0(client):
    r = await client.post("/api/items/", json=ITEM_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    # K₀ = 100×(0.4×0.9 + 0.3×0.8 + 0.3×0.7) = 100×(0.36+0.24+0.21) = 81
    assert 79 <= data["k0_initial_strength"] <= 83


@pytest.mark.asyncio
async def test_create_item_returns_decay_rate(client):
    r = await client.post("/api/items/", json=ITEM_PAYLOAD)
    assert r.status_code == 201
    assert r.json()["decay_rate"] > 0


@pytest.mark.asyncio
async def test_list_items_empty(client):
    r = await client.get("/api/items/")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_list_items_after_create(client):
    await client.post("/api/items/", json=ITEM_PAYLOAD)
    r = await client.get("/api/items/")
    assert len(r.json()) == 1


@pytest.mark.asyncio
async def test_get_item_by_id(client):
    created = (await client.post("/api/items/", json=ITEM_PAYLOAD)).json()
    r = await client.get(f"/api/items/{created['id']}")
    assert r.status_code == 200
    assert r.json()["topic"] == "Binary Search"


@pytest.mark.asyncio
async def test_get_item_404(client):
    r = await client.get("/api/items/9999")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_delete_item(client):
    created = (await client.post("/api/items/", json=ITEM_PAYLOAD)).json()
    r = await client.delete(f"/api/items/{created['id']}")
    assert r.status_code == 204
    r2 = await client.get(f"/api/items/{created['id']}")
    assert r2.status_code == 404


@pytest.mark.asyncio
async def test_decaying_items_threshold(client):
    """Newly created item has full retention — should NOT appear in /decaying at threshold 60."""
    await client.post("/api/items/", json=ITEM_PAYLOAD)
    r = await client.get("/api/items/decaying?threshold=60")
    # Retention at t=0 ≈ K₀ (~81) > 60 → list should be empty
    assert r.status_code == 200
    assert len(r.json()) == 0


@pytest.mark.asyncio
async def test_computed_fields_present(client):
    r = await client.post("/api/items/", json=ITEM_PAYLOAD)
    data = r.json()
    assert "current_retention" in data
    assert "half_life_days"    in data
    assert "days_to_forget"    in data
    assert "days_since_review" in data
