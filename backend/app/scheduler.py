from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone
from sqlalchemy import select
from .models import KnowledgeItem
from .decay import compute_retention

async def check_all_items_and_enqueue(db_session, redis_client):
    items = await db_session.execute(select(KnowledgeItem))
    items = items.scalars().all()
    enqueued = 0
    for item in items:
        days_since_review = 0
        if item.last_reviewed:
            days_since_review = (datetime.now(timezone.utc) - item.last_reviewed).days
        k_t = compute_retention(item.k0_initial_strength, item.decay_rate, days_since_review, item.memory_floor)
        if k_t < 60:
            await redis_client.xadd('decay_alerts', {
                'item_id': str(item.id),
                'topic': item.topic,
                'retention': f'{k_t:.1f}',
                'user_id': str(item.user_id),
            })
            enqueued += 1
    print(f'[SCHEDULER] Checked {len(items)} items, enqueued {enqueued}')

scheduler = AsyncIOScheduler()
scheduler.add_job(check_all_items_and_enqueue, 'interval', hours=6)