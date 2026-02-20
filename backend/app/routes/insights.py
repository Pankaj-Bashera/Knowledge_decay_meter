from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import KnowledgeItem
from app.schemas import WeakItem, DailyRetention, InsightSummary
from app.auth import get_current_user_id
from app.decay import compute_retention, compute_half_life, compute_time_to_forget

router = APIRouter(prefix="/insights", tags=["insights"])


def _days_elapsed(item: KnowledgeItem) -> float:
    now  = datetime.now(timezone.utc)
    last = item.last_reviewed or item.created_at
    if last and last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    return max((now - last).total_seconds() / 86400, 0)


def _retention(item: KnowledgeItem) -> float:
    return compute_retention(
        item.k0_initial_strength, item.decay_rate, _days_elapsed(item), item.memory_floor
    )


# ── 1. Weakest topics ──────────────────────────────────────────────────────────

@router.get("/weakest", response_model=List[WeakItem])
async def get_weakest_topics(
    limit:   int = Query(10, ge=1, le=100),
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()

    rows = [
        WeakItem(
            id                = i.id,
            topic             = i.topic,
            retention         = round(_retention(i), 1),
            half_life         = round(compute_half_life(i.decay_rate), 1),
            days_since_review = round(_days_elapsed(i), 1),
        )
        for i in items
    ]
    rows.sort(key=lambda x: x.retention)
    return rows[:limit]


# ── 2. Summary stats ───────────────────────────────────────────────────────────

@router.get("/summary", response_model=InsightSummary)
async def get_summary(
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()

    if not items:
        return InsightSummary(total_items=0, avg_retention=0, avg_half_life=0,
                              items_below_60=0, items_below_40=0, items_near_floor=0)

    retentions = [_retention(i) for i in items]
    half_lives = [compute_half_life(i.decay_rate) for i in items]
    floors     = [i.memory_floor * 100 for i in items]

    return InsightSummary(
        total_items      = len(items),
        avg_retention    = round(sum(retentions) / len(retentions), 1),
        avg_half_life    = round(sum(half_lives) / len(half_lives), 1),
        items_below_60   = sum(1 for r in retentions if r < 60),
        items_below_40   = sum(1 for r in retentions if r < 40),
        items_near_floor = sum(1 for r, m in zip(retentions, floors) if r < m + 5),
    )


# ── 3. Retention timeline (last 30 days) ──────────────────────────────────────

@router.get("/timeline", response_model=List[DailyRetention])
async def get_retention_timeline(
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    """Average retention across all items for each of the past 30 days."""
    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()
    if not items:
        return []

    today  = datetime.now(timezone.utc).date()
    points = []
    for day_offset in range(29, -1, -1):
        target = today - timedelta(days=day_offset)
        # Compute K(t) as of that date using created_at as reference
        day_retentions = []
        for item in items:
            created = item.created_at
            if created and created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            elapsed = max((datetime.combine(target, datetime.min.time()).replace(tzinfo=timezone.utc) - created).days, 0)
            r = compute_retention(item.k0_initial_strength, item.decay_rate, elapsed, item.memory_floor)
            day_retentions.append(r)
        avg = sum(day_retentions) / len(day_retentions)
        points.append(DailyRetention(date=str(target), retention=round(avg, 1)))

    return points


# ── 4. Hardest topics (highest k) ─────────────────────────────────────────────

@router.get("/hardest", response_model=List[WeakItem])
async def get_hardest_topics(
    limit:   int = Query(10, ge=1, le=100),
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()
    rows   = [
        WeakItem(
            id                = i.id,
            topic             = i.topic,
            retention         = round(_retention(i), 1),
            half_life         = round(compute_half_life(i.decay_rate), 1),
            days_since_review = round(_days_elapsed(i), 1),
        )
        for i in items
    ]
    rows.sort(key=lambda x: x.half_life)   # shortest half-life = hardest
    return rows[:limit]


# ── 5. Upcoming forgets (next 30 days) ────────────────────────────────────────

@router.get("/upcoming-forgets")
async def get_upcoming_forgets(
    days:    int = Query(30, ge=1, le=90),
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()

    now  = datetime.now(timezone.utc)
    rows = []
    for item in items:
        t_forget = compute_time_to_forget(
            item.k0_initial_strength, item.decay_rate, item.memory_floor
        )
        elapsed = _days_elapsed(item)
        days_remaining = t_forget - elapsed
        if 0 < days_remaining <= days:
            forget_date = (now + timedelta(days=days_remaining)).date()
            rows.append({
                "id":           item.id,
                "topic":        item.topic,
                "forget_date":  str(forget_date),
                "days_left":    round(days_remaining, 1),
                "retention":    round(_retention(item), 1),
            })

    rows.sort(key=lambda x: x["days_left"])
    return rows


# ── 6. Most reviewed items ─────────────────────────────────────────────────────

@router.get("/most-reviewed")
async def get_most_reviewed(
    limit:   int = Query(10, ge=1, le=100),
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()
    rows   = [
        {
            "id":                 i.id,
            "topic":              i.topic,
            "revision_frequency": round(i.revision_frequency, 3),
            "usage_frequency":    round(i.usage_frequency, 3),
            "retention":          round(_retention(i), 1),
        }
        for i in items
    ]
    rows.sort(key=lambda x: -(x["revision_frequency"] + x["usage_frequency"]))
    return rows[:limit]


# ── 7. Sleep quality impact ────────────────────────────────────────────────────

@router.get("/sleep-impact")
async def get_sleep_impact(
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    """Show how today's sleep quality affects decay rates across all items."""
    from app.decay import compute_decay_rate as cdr

    result = await db.execute(select(KnowledgeItem).where(KnowledgeItem.user_id == user_id))
    items  = result.scalars().all()

    rows = []
    for item in items:
        k_good_sleep = cdr(item.difficulty, item.interest, 0.9, item.base_memory, item.attention,
                           item.revision_frequency, item.usage_frequency)
        k_poor_sleep = cdr(item.difficulty, item.interest, 0.3, item.base_memory, item.attention,
                           item.revision_frequency, item.usage_frequency)
        rows.append({
            "id":              item.id,
            "topic":           item.topic,
            "current_k":       round(item.decay_rate, 4),
            "k_good_sleep":    round(k_good_sleep, 4),
            "k_poor_sleep":    round(k_poor_sleep, 4),
            "decay_multiplier": round(k_poor_sleep / k_good_sleep, 2) if k_good_sleep > 0 else None,
        })

    rows.sort(key=lambda x: -(x["decay_multiplier"] or 0))
    return rows
