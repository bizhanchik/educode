"""add_extracted_images_to_lesson_materials

Revision ID: 59afca765324
Revises: d58882e1edac
Create Date: 2025-12-09 21:55:46.148787

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '59afca765324'
down_revision: Union[str, Sequence[str], None] = 'd58882e1edac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add extracted_images column to lesson_materials table."""
    op.add_column('lesson_materials', 
        sa.Column('extracted_images', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema: Remove extracted_images column from lesson_materials table."""
    op.drop_column('lesson_materials', 'extracted_images')
