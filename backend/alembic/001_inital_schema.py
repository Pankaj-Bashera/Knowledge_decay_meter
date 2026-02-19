"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-18 14:27:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id",              sa.Integer(), primary_key=True),
        sa.Column("username",        sa.String(),  nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(),  nullable=False),
        sa.Column("base_memory",     sa.Float(),   default=0.7),
        sa.Column("sleep_quality",   sa.Float(),   default=0.8),
        sa.Column("memory_floor",    sa.Float(),   default=0.10),
        sa.Column("created_at",      sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "knowledge_items",
        sa.Column("id",                  sa.Integer(), primary_key=True),
        sa.Column("user_id",             sa.Integer(), nullable=False),
        sa.Column("topic",               sa.String(),  nullable=False),
        sa.Column("content",             sa.String(),  nullable=True),
        sa.Column("attention",           sa.Float(),   nullable=False),
        sa.Column("interest",            sa.Float(),   nullable=False),
        sa.Column("difficulty",          sa.Float(),   nullable=False),
        sa.Column("k0_initial_strength", sa.Float(),   nullable=False),
        sa.Column("decay_rate",          sa.Float(),   nullable=False),
        sa.Column("revision_frequency",  sa.Float(),   default=0.0),
        sa.Column("usage_frequency",     sa.Float(),   default=0.0),
        sa.Column("last_reviewed",       sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_used",           sa.DateTime(timezone=True), nullable=True),
        sa.Column("base_memory",         sa.Float(),   default=0.7),
        sa.Column("sleep_quality",       sa.Float(),   default=0.8),
        sa.Column("memory_floor",        sa.Float(),   default=0.10),
        sa.Column("created_at",          sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Performance indexes
    op.create_index("idx_user_last_reviewed", "knowledge_items", ["user_id", "last_reviewed"])
    op.create_index("idx_user_decay_rate",    "knowledge_items", ["user_id", "decay_rate"])


def downgrade() -> None:
    op.drop_index("idx_user_decay_rate",    table_name="knowledge_items")
    op.drop_index("idx_user_last_reviewed", table_name="knowledge_items")
    op.drop_table("knowledge_items")
    op.drop_table("users")
