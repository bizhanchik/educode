"""Add lesson_materials table

Revision ID: a1b2c3d4e5f6
Revises: fb50021cae86
Create Date: 2025-10-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'fb50021cae86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Skip if lesson_materials table already exists
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if 'lesson_materials' in inspector.get_table_names():
        return

    # Create lesson_materials table
    op.create_table(
        'lesson_materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('text', 'file', 'youtube', name='materialtype'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('file_url', sa.String(length=512), nullable=True),
        sa.Column('youtube_url', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], name=op.f('fk_lesson_materials_lesson_id_lessons'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_lesson_materials'))
    )
    op.create_index(op.f('ix_lesson_materials_id'), 'lesson_materials', ['id'], unique=False)
    op.create_index(op.f('ix_lesson_materials_lesson_id'), 'lesson_materials', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_lesson_materials_type'), 'lesson_materials', ['type'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_lesson_materials_type'), table_name='lesson_materials')
    op.drop_index(op.f('ix_lesson_materials_lesson_id'), table_name='lesson_materials')
    op.drop_index(op.f('ix_lesson_materials_id'), table_name='lesson_materials')

    # Drop table
    op.drop_table('lesson_materials')

    # Drop enum type
    sa.Enum('text', 'file', 'youtube', name='materialtype').drop(op.get_bind(), checkfirst=True)
