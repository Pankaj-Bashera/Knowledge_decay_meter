"""
APScheduler job — runs every 6 hours.

For every knowledge item:
  1. Compute current K(t)
  2. If K(t) < 60 % → enqueue decay alert in Redis Stream 'decay_alerts'

The worker.py process reads from this stream and sends Telegram notifications.
"""

from datetime import datetime, timezone

import redis.asyncio as aioredis
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.decay import compute_retention
from app.models import KnowledgeItem

ALERT_THRESHOLD = 60.0    # Enqueue items below this retention %


async def check_all_items_and_enqueue() -> None:
    r = await aioredis.from_url(settings.REDIS_URL)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(KnowledgeItem))
        items  = result.scalars().all()

        enqueued = 0
        for item in items:
            last = item.last_reviewed or item.created_at
            if last and last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)

            days_since = (datetime.now(timezone.utc) - last).total_seconds() / 86400

            k_t = compute_retention(
                item.k0_initial_strength,
                item.decay_rate,
                days_since,
                item.memory_floor,
            )

            if k_t < ALERT_THRESHOLD:
                await r.xadd(
                    "decay_alerts",
                    {
                        "item_id":   str(item.id),
                        "topic":     item.topic,
                        "retention": f"{k_t:.1f}",
                        "user_id":   str(item.user_id),
                    },
                )
                enqueued += 1

        print(f"[SCHEDULER] Checked {len(items)} items, enqueued {enqueued} alerts")

    await r.aclose()


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_all_items_and_enqueue,
        trigger="interval",
        hours=6,
        id="decay_check",
        replace_existing=True,
    )
    return scheduler
