"""add_txt_to_material_type_enum

Revision ID: 3a75224a0d22
Revises: 59afca765324
Create Date: 2025-12-09 22:18:02.149423

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a75224a0d22'
down_revision: Union[str, Sequence[str], None] = '59afca765324'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add 'txt' value to MaterialType enum."""
    # Add 'txt' to the materialtype enum
    op.execute("ALTER TYPE materialtype ADD VALUE IF NOT EXISTS 'txt'")


def downgrade() -> None:
    """Downgrade schema: Remove 'txt' value from MaterialType enum."""
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum, which is complex
    # For now, we'll leave it as a no-op
    # In production, you might need to handle this differently
    pass
