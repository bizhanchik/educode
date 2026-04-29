"""stub for missing revision

Revision ID: 1a413f359804
Revises: af8800040578
Create Date: 2026-04-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1a413f359804'
down_revision: Union[str, Sequence[str], None] = 'af8800040578'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
