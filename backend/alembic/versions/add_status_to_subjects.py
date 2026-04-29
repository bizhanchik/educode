"""add_status_to_subjects

Revision ID: add_status_to_subjects
Revises: d58882e1edac
Create Date: 2025-12-12 08:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_status_to_subjects'
down_revision = '775263b324ed'
branch_labels = None
depends_on = None


def upgrade():
    # Add status column to subjects table
    op.add_column('subjects', sa.Column('status', sa.String(length=50), nullable=True, server_default='Активен'))
    # Create index on status column
    op.create_index(op.f('ix_subjects_status'), 'subjects', ['status'], unique=False)


def downgrade():
    # Drop index
    op.drop_index(op.f('ix_subjects_status'), table_name='subjects')
    # Drop status column
    op.drop_column('subjects', 'status')


