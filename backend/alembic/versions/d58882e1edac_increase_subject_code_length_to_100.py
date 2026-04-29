"""increase_subject_code_length_to_100

Revision ID: d58882e1edac
Revises: 20251207_023544
Create Date: 2025-12-09 02:39:12.928231

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd58882e1edac'
down_revision: Union[str, Sequence[str], None] = '20251207_023544'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Increase subject code length from 50 to 100 characters."""
    op.alter_column('subjects', 'code',
                    existing_type=sa.String(length=50),
                    type_=sa.String(length=100),
                    existing_nullable=True)


def downgrade() -> None:
    """Downgrade schema: Decrease subject code length from 100 to 50 characters."""
    op.alter_column('subjects', 'code',
                    existing_type=sa.String(length=100),
                    type_=sa.String(length=50),
                    existing_nullable=True)
