from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

class KnowledgeItem(Base):
    __tablename__ = 'knowledge_items'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, default=1)
    topic = Column(String, nullable=False)
    content = Column(String)
    attention = Column(Float, nullable=False)
    interest = Column(Float, nullable=False)
    difficulty = Column(Float, nullable=False)
    k0_initial_strength = Column(Float, nullable=False)
    decay_rate = Column(Float, nullable=False)
    revision_frequency = Column(Float, default=0)
    usage_frequency = Column(Float, default=0)
    last_reviewed = Column(DateTime(timezone=True))
    last_used = Column(DateTime(timezone=True))
    base_memory = Column(Float, default=0.7)
    sleep_quality = Column(Float, default=0.8)
    memory_floor = Column(Float, default=0.10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())