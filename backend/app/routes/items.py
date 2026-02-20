from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import KnowledgeItem
from app.schemas import ItemCreate, ItemOut, ItemUpdate
from app.auth import get_current_user_id
from app.decay import (
    compute_k0,
    compute_decay_rate,
    compute_retention,
    compute_half_life,
    compute_time_to_forget,
)

router = APIRouter(prefix="/items", tags=["items"])


def _enrich(item: KnowledgeItem) -> dict:
    """Add computed decay fields to a KnowledgeItem dict."""
    now = datetime.now(timezone.utc)
    last = item.last_reviewed or item.created_at
    # Ensure timezone-aware comparison
    if last and last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    days_elapsed = max((now - last).total_seconds() / 86400, 0)

    retention    = compute_retention(item.k0_initial_strength, item.decay_rate, days_elapsed, item.memory_floor)
    half_life    = compute_half_life(item.decay_rate)
    days_forget  = compute_time_to_forget(item.k0_initial_strength, item.decay_rate, item.memory_floor)

    d = {c.name: getattr(item, c.name) for c in item.__table__.columns}
    d["current_retention"]  = round(retention, 2)
    d["half_life_days"]     = round(half_life, 2)
    d["days_to_forget"]     = round(days_forget, 2)
    d["days_since_review"]  = round(days_elapsed, 2)
    return d


# ── POST /api/items ────────────────────────────────────────────────────────────

@router.post("/", response_model=ItemOut, status_code=201)
async def create_item(
    payload: ItemCreate,
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    k0 = compute_k0(payload.attention, payload.interest, payload.base_memory)
    k  = compute_decay_rate(
        difficulty         = payload.difficulty,
        interest           = payload.interest,
        sleep_quality      = payload.sleep_quality,
        base_memory        = payload.base_memory,
        attention          = payload.attention,
        revision_frequency = 0.0,
        usage_frequency    = 0.0,
    )

    item = KnowledgeItem(
        user_id             = user_id,
        topic               = payload.topic,
        content             = payload.content,
        attention           = payload.attention,
        interest            = payload.interest,
        difficulty          = payload.difficulty,
        k0_initial_strength = k0,
        decay_rate          = k,
        base_memory         = payload.base_memory,
        sleep_quality       = payload.sleep_quality,
        memory_floor        = payload.memory_floor,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return _enrich(item)


# ── GET /api/items ─────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ItemOut])
async def list_items(
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()
    return [_enrich(i) for i in items]


# ── GET /api/items/decaying ────────────────────────────────────────────────────

@router.get("/decaying", response_model=List[ItemOut])
async def get_decaying_items(
    threshold: float = 60.0,
    db:        AsyncSession = Depends(get_db),
    user_id:   int          = Depends(get_current_user_id),
):
    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()
    enriched = [_enrich(i) for i in items]
    return [e for e in enriched if e["current_retention"] < threshold]


# ── GET /api/items/{id} ────────────────────────────────────────────────────────

@router.get("/{item_id}", response_model=ItemOut)
async def get_item(
    item_id: int,
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    item = await db.get(KnowledgeItem, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status_code=404, detail="Item not found")
    return _enrich(item)


# ── PATCH /api/items/{id} ──────────────────────────────────────────────────────

@router.patch("/{item_id}", response_model=ItemOut)
async def update_item(
    item_id: int,
    payload: ItemUpdate,
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    item = await db.get(KnowledgeItem, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status_code=404, detail="Item not found")

    if payload.sleep_quality is not None:
        item.sleep_quality = payload.sleep_quality
    if payload.base_memory is not None:
        item.base_memory = payload.base_memory
    if payload.memory_floor is not None:
        item.memory_floor = payload.memory_floor

    # Recompute k with updated parameters
    item.decay_rate = compute_decay_rate(
        item.difficulty, item.interest, item.sleep_quality,
        item.base_memory, item.attention,
        item.revision_frequency, item.usage_frequency,
    )
    await db.flush()
    await db.refresh(item)
    return _enrich(item)


# ── DELETE /api/items/{id} ─────────────────────────────────────────────────────

@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    item = await db.get(KnowledgeItem, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
