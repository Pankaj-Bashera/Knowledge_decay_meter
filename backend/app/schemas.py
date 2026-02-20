from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# ── Shared validators ──────────────────────────────────────────────────────────

def clamp_01(v: float) -> float:
    if not (0.0 <= v <= 1.0):
        raise ValueError("Value must be between 0 and 1")
    return v


# ── Item schemas ───────────────────────────────────────────────────────────────

class ItemCreate(BaseModel):
    topic:      str   = Field(..., min_length=1, max_length=200)
    content:    Optional[str] = None
    attention:  float = Field(..., ge=0, le=1, description="A — focus during learning")
    interest:   float = Field(..., ge=0, le=1, description="I — intrinsic interest")
    difficulty: float = Field(..., ge=0, le=1, description="D — topic complexity")
    # User-level settings (frontend reads from Zustand store)
    base_memory:   float = Field(0.7,  ge=0, le=1)
    sleep_quality: float = Field(0.8,  ge=0, le=1)
    memory_floor:  float = Field(0.10, ge=0.05, le=0.20)


class ItemUpdate(BaseModel):
    sleep_quality: Optional[float] = Field(None, ge=0, le=1)
    base_memory:   Optional[float] = Field(None, ge=0, le=1)
    memory_floor:  Optional[float] = Field(None, ge=0.05, le=0.20)


class ItemOut(BaseModel):
    id:                 int
    user_id:            int
    topic:              str
    content:            Optional[str]
    attention:          float
    interest:           float
    difficulty:         float
    k0_initial_strength: float
    decay_rate:         float
    revision_frequency: float
    usage_frequency:    float
    base_memory:        float
    sleep_quality:      float
    memory_floor:       float
    last_reviewed:      Optional[datetime]
    last_used:          Optional[datetime]
    created_at:         datetime
    # Computed fields (added by route)
    current_retention:  Optional[float] = None
    half_life_days:     Optional[float] = None
    days_to_forget:     Optional[float] = None
    days_since_review:  Optional[float] = None

    class Config:
        from_attributes = True


# ── Review schemas ─────────────────────────────────────────────────────────────

class ReviewSubmit(BaseModel):
    used_in_practice: bool = Field(
        False,
        description="True = active real-world usage (increments U); False = passive review (increments Rf)"
    )


# ── Insight schemas ────────────────────────────────────────────────────────────

class WeakItem(BaseModel):
    id:               int
    topic:            str
    retention:        float
    half_life:        float
    days_since_review: float


class DailyRetention(BaseModel):
    date:      str
    retention: float


class InsightSummary(BaseModel):
    total_items:      int
    avg_retention:    float
    avg_half_life:    float
    items_below_60:   int
    items_below_40:   int
    items_near_floor: int


# ── Auth schemas ───────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
