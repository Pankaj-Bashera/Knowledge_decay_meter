from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import engine, Base, get_db
from app.models import User
from app.auth import hash_password, create_access_token, verify_password
from app.schemas import UserCreate, Token
from app.routes import items, reviews, insights
from app.scheduler import create_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start background scheduler
    scheduler = create_scheduler()
    scheduler.start()

    yield

    scheduler.shutdown()


app = FastAPI(
    title="Knowledge Decay Tracker",
    description="A sophisticated memory system modelling knowledge decay using attention, interest, sleep quality, and usage patterns.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(items.router,    prefix="/api")
app.include_router(reviews.router,  prefix="/api")
app.include_router(insights.router, prefix="/api")


# ── Auth routes ────────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=Token, status_code=201)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(username=payload.username, hashed_password=hash_password(payload.password))
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return Token(access_token=create_access_token(user.id))


@app.post("/api/auth/login", response_model=Token)
async def login(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == payload.username))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return Token(access_token=create_access_token(user.id))


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}
