"""add_created_by_to_subjects

Revision ID: add_created_by_to_subjects
Revises: 344fc5e6725b
Create Date: 2026-04-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_created_by_to_subjects'
down_revision: Union[str, Sequence[str], None] = '1a413f359804'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add created_by column to subjects table."""
    op.add_column('subjects', sa.Column('created_by', sa.Integer(), nullable=True))
    op.create_index('ix_subjects_created_by', 'subjects', ['created_by'], unique=False)
    op.create_foreign_key(
        'fk_subjects_created_by_users',
        'subjects', 'users',
        ['created_by'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Remove created_by column from subjects table."""
    op.drop_constraint('fk_subjects_created_by_users', 'subjects', type_='foreignkey')
    op.drop_index('ix_subjects_created_by', table_name='subjects')
    op.drop_column('subjects', 'created_by')
