"""add_order_to_lessons

Revision ID: add_order_to_lessons
Revises: 344fc5e6725b
Create Date: 2025-12-14 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_order_to_lessons'
down_revision: Union[str, Sequence[str], None] = '344fc5e6725b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add order column to lessons table."""
    op.add_column('lessons', sa.Column('order', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_lessons_order'), 'lessons', ['order'], unique=False)


def downgrade() -> None:
    """Remove order column from lessons table."""
    op.drop_index(op.f('ix_lessons_order'), table_name='lessons')
    op.drop_column('lessons', 'order')

