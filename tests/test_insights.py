"""Tests for the 7 insight endpoints."""

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


async def seed_items(client, n=3):
    items = []
    for i in range(n):
        r = await client.post("/api/items/", json={
            "topic":       f"Topic {i}",
            "attention":   0.5 + i * 0.1,
            "interest":    0.4 + i * 0.1,
            "difficulty":  0.5,
            "base_memory": 0.7,
            "sleep_quality": 0.8,
            "memory_floor":  0.10,
        })
        items.append(r.json())
    return items


@pytest.mark.asyncio
async def test_summary_empty(client):
    r = await client.get("/api/insights/summary")
    assert r.status_code == 200
    assert r.json()["total_items"] == 0


@pytest.mark.asyncio
async def test_summary_with_items(client):
    await seed_items(client)
    r = await client.get("/api/insights/summary")
    data = r.json()
    assert data["total_items"] == 3
    assert 0 < data["avg_retention"] <= 100
    assert data["avg_half_life"] > 0


@pytest.mark.asyncio
async def test_weakest_returns_sorted_asc(client):
    await seed_items(client)
    r = await client.get("/api/insights/weakest?limit=10")
    assert r.status_code == 200
    retentions = [i["retention"] for i in r.json()]
    assert retentions == sorted(retentions)


@pytest.mark.asyncio
async def test_weakest_limit(client):
    await seed_items(client, n=5)
    r = await client.get("/api/insights/weakest?limit=2")
    assert len(r.json()) <= 2


@pytest.mark.asyncio
async def test_hardest_returns_sorted_by_half_life(client):
    await seed_items(client)
    r = await client.get("/api/insights/hardest")
    assert r.status_code == 200
    half_lives = [i["half_life"] for i in r.json()]
    assert half_lives == sorted(half_lives)


@pytest.mark.asyncio
async def test_timeline_returns_30_days(client):
    await seed_items(client)
    r = await client.get("/api/insights/timeline")
    assert r.status_code == 200
    assert len(r.json()) == 30


@pytest.mark.asyncio
async def test_timeline_empty_with_no_items(client):
    r = await client.get("/api/insights/timeline")
    assert r.json() == []


@pytest.mark.asyncio
async def test_upcoming_forgets(client):
    await seed_items(client)
    r = await client.get("/api/insights/upcoming-forgets?days=90")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_most_reviewed(client):
    items = await seed_items(client, n=2)
    # Review item 0 multiple times
    for _ in range(5):
        await client.post(f"/api/items/{items[0]['id']}/review", json={"used_in_practice": False})
    r = await client.get("/api/insights/most-reviewed?limit=5")
    assert r.status_code == 200
    data = r.json()
    # Most reviewed item should be first
    assert data[0]["id"] == items[0]["id"]


@pytest.mark.asyncio
async def test_sleep_impact(client):
    await seed_items(client)
    r = await client.get("/api/insights/sleep-impact")
    assert r.status_code == 200
    for row in r.json():
        assert row["k_poor_sleep"] > row["k_good_sleep"]
        assert row["decay_multiplier"] > 1.0
