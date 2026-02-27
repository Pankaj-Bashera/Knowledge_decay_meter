import asyncio
from logging.config import fileConfig
import os
import sys

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from dotenv import load_dotenv

# Load .env FIRST
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Alembic Config
config = context.config

# Inject DATABASE_URL into alembic
db_url = os.getenv("DATABASE_URL")
config.set_main_option("sqlalchemy.url", db_url)

# Logging config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import models
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.database import Base
from app.models import KnowledgeItem, User  # noqa: F401

target_metadata = Base.metadata