import asyncio
import redis.asyncio as aioredis

async def consume_queue():
    r = await aioredis.from_url('redis://localhost')
    try:
        await r.xgroup_create('decay_alerts', 'workers', id='0', mkstream=True)
    except:
        pass
    while True:
        messages = await r.xreadgroup('workers', 'w1', {'decay_alerts': '>'}, count=10)
        for stream, entries in messages:
            for msg_id, data in entries:
                topic = data[b'topic'].decode()
                retention = data[b'retention'].decode()
                print(f"[WORKER] ⚠️  {topic} at {retention}% retention")
                await r.xack('decay_alerts', 'workers', msg_id)
        await asyncio.sleep(10)