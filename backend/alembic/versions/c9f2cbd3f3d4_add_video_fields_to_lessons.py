"""add video fields to lessons

Revision ID: c9f2cbd3f3d4
Revises: bad9732bd478
Create Date: 2025-11-10 07:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9f2cbd3f3d4'
down_revision: Union[str, None] = 'bad9732bd478'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('lessons', sa.Column('video_url', sa.String(length=1024), nullable=True))
    op.add_column('lessons', sa.Column('video_description', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('lessons', 'video_description')
    op.drop_column('lessons', 'video_url')
