from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from sqlalchemy.sql import func
from app.database import Base


class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, default=1, index=True)
    topic   = Column(String, nullable=False)
    content = Column(String, nullable=True)

    # ── Encoding factors (set at creation) ─────────────────────────────────
    attention  = Column(Float, nullable=False)   # A: 0-1
    interest   = Column(Float, nullable=False)   # I: 0-1
    difficulty = Column(Float, nullable=False)   # D: 0-1

    # ── Computed at creation ────────────────────────────────────────────────
    k0_initial_strength = Column(Float, nullable=False)  # K₀ (0-100)

    # ── Updated on each review ──────────────────────────────────────────────
    decay_rate          = Column(Float, nullable=False)       # k (per day)
    revision_frequency  = Column(Float, default=0.0)          # Rf (EMA, reviews/day)
    usage_frequency     = Column(Float, default=0.0)          # U  (EMA, uses/day)
    last_reviewed       = Column(DateTime(timezone=True), nullable=True)
    last_used           = Column(DateTime(timezone=True), nullable=True)

    # ── User-level settings ─────────────────────────────────────────────────
    base_memory   = Column(Float, default=0.7)    # B: 0-1
    sleep_quality = Column(Float, default=0.8)    # S: 0-1 (updated daily)
    memory_floor  = Column(Float, default=0.10)   # M: 5-20 % (as decimal)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── Composite indexes for scheduler & analytics queries ─────────────────
    __table_args__ = (
        Index("idx_user_last_reviewed", "user_id", "last_reviewed"),
        Index("idx_user_decay_rate",    "user_id", "decay_rate"),
    )


class User(Base):
    """Minimal user model — expand with hashed_password for real auth."""
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    base_memory   = Column(Float, default=0.7)
    sleep_quality = Column(Float, default=0.8)
    memory_floor  = Column(Float, default=0.10)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
