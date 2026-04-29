"""add_color_and_image_to_subjects

Revision ID: 344fc5e6725b
Revises: add_status_to_subjects
Create Date: 2025-12-14 20:16:39.055892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '344fc5e6725b'
down_revision: Union[str, Sequence[str], None] = 'add_status_to_subjects'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add color and image columns to subjects table."""
    op.add_column('subjects', sa.Column('color', sa.String(length=7), nullable=True))
    op.add_column('subjects', sa.Column('image', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Remove color and image columns from subjects table."""
    op.drop_column('subjects', 'image')
    op.drop_column('subjects', 'color')
