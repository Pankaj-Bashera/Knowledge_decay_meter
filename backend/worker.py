"""
Worker process — reads from Redis Stream 'decay_alerts' and sends Telegram notifications.

Run:  python worker.py
Docker: see docker-compose.yml 'worker' service
"""

import asyncio
import os
import sys

import redis.asyncio as aioredis

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.config import settings
from app.database import AsyncSessionLocal
from app.decay import compute_time_to_forget
from app.models import KnowledgeItem


async def notify_user(item_data: dict) -> None:
    """Send a Telegram message for a decaying item."""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        print(f"[WORKER] Telegram not configured — skipping notification for {item_data.get('topic')}")
        return

    try:
        from telegram import Bot

        async with AsyncSessionLocal() as db:
            item = await db.get(KnowledgeItem, int(item_data[b"item_id"].decode()))

        if not item:
            return

        t_forget = compute_time_to_forget(
            item.k0_initial_strength,
            item.decay_rate,
            item.memory_floor,
            threshold=10.0,
        )

        topic     = item_data[b"topic"].decode()
        retention = item_data[b"retention"].decode()

        msg = (
            f"🧠 *Memory Decay Alert*\n\n"
            f"Topic: {topic}\n"
            f"Current retention: {retention}%\n"
            f"Days until forgotten: {round(t_forget, 1)}\n\n"
            f"Review now to reset decay rate."
        )

        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
        await bot.send_message(
            chat_id    = settings.TELEGRAM_CHAT_ID,
            text       = msg,
            parse_mode = "Markdown",
        )
        print(f"[WORKER] ✅ Notified: {topic} at {retention}%")

    except Exception as e:
        print(f"[WORKER] ❌ Telegram error: {e}")


async def consume_queue() -> None:
    r = await aioredis.from_url(settings.REDIS_URL)

    # Create consumer group if it doesn't exist
    try:
        await r.xgroup_create("decay_alerts", "workers", id="0", mkstream=True)
        print("[WORKER] Consumer group created")
    except Exception:
        pass   # Already exists

    print("[WORKER] Listening for decay alerts...")

    while True:
        try:
            messages = await r.xreadgroup(
                "workers", "w1",
                {"decay_alerts": ">"},
                count=10,
                block=5000,    # block for 5 s if empty
            )

            if messages:
                for _stream, entries in messages:
                    for msg_id, data in entries:
                        topic     = data[b"topic"].decode()
                        retention = data[b"retention"].decode()
                        print(f"[WORKER] ⚠️  {topic} at {retention}% retention")

                        await notify_user(data)
                        await r.xack("decay_alerts", "workers", msg_id)

        except Exception as e:
            print(f"[WORKER] Error: {e}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(consume_queue())
