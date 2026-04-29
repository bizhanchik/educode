"""Add subject code column

Revision ID: d3e4f5g6h7i8
Revises: a1b2c3d4e5f6
Create Date: 2025-12-06 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3e4f5g6h7i8'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add code column to subjects table."""
    op.add_column('subjects', 
        sa.Column('code', sa.String(length=50), nullable=True)
    )
    op.create_index(op.f('ix_subjects_code'), 'subjects', ['code'], unique=False)


def downgrade() -> None:
    """Remove code column from subjects table."""
    op.drop_index(op.f('ix_subjects_code'), table_name='subjects')
    op.drop_column('subjects', 'code')

