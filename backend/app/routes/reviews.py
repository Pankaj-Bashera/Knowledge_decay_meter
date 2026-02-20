from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import KnowledgeItem
from app.schemas import ReviewSubmit, ItemOut
from app.auth import get_current_user_id
from app.decay import compute_decay_rate, compute_retention, compute_half_life, compute_time_to_forget, update_ema

router = APIRouter(prefix="/items", tags=["reviews"])


@router.post("/{item_id}/review", response_model=ItemOut)
async def submit_review(
    item_id: int,
    payload: ReviewSubmit,
    db:      AsyncSession = Depends(get_db),
    user_id: int          = Depends(get_current_user_id),
):
    """
    Submit a review for a knowledge item.

    - If used_in_practice=False → increments Rf (passive review)
    - If used_in_practice=True  → increments U  (active usage, 2× more effective)

    After updating Rf/U, k is recomputed. last_reviewed is always updated.
    """
    item = await db.get(KnowledgeItem, item_id)
    if not item or item.user_id != user_id:
        raise HTTPException(status_code=404, detail="Item not found")

    now = datetime.now(timezone.utc)

    if payload.used_in_practice:
        # Real-world usage — increment U via EMA
        item.usage_frequency = update_ema(item.usage_frequency)
        item.last_used       = now
    else:
        # Passive review — increment Rf via EMA
        item.revision_frequency = update_ema(item.revision_frequency)

    item.last_reviewed = now

    # Recompute decay rate with new Rf / U
    item.decay_rate = compute_decay_rate(
        difficulty         = item.difficulty,
        interest           = item.interest,
        sleep_quality      = item.sleep_quality,
        base_memory        = item.base_memory,
        attention          = item.attention,
        revision_frequency = item.revision_frequency,
        usage_frequency    = item.usage_frequency,
    )

    await db.flush()
    await db.refresh(item)

    # Build enriched response
    d = {c.name: getattr(item, c.name) for c in item.__table__.columns}
    d["current_retention"] = round(
        compute_retention(item.k0_initial_strength, item.decay_rate, 0, item.memory_floor), 2
    )
    d["half_life_days"]    = round(compute_half_life(item.decay_rate), 2)
    d["days_to_forget"]    = round(compute_time_to_forget(item.k0_initial_strength, item.decay_rate, item.memory_floor), 2)
    d["days_since_review"] = 0.0
    return d
