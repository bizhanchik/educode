"""add_missing_columns_and_group_teachers_table

Revision ID: bad9732bd478
Revises: a1b2c3d4e5f6
Create Date: 2025-11-05 06:14:30.840417

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bad9732bd478'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to users table
    op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True))

    # Add missing columns to groups table
    op.add_column('groups', sa.Column('course', sa.Integer(), nullable=True))
    op.add_column('groups', sa.Column('semester', sa.Integer(), nullable=True))

    # Create group_teachers association table
    op.create_table(
        'group_teachers',
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_group_teachers_group_id_groups')),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], name=op.f('fk_group_teachers_teacher_id_users')),
        sa.PrimaryKeyConstraint('group_id', 'teacher_id', name=op.f('pk_group_teachers'))
    )


def downgrade() -> None:
    # Drop group_teachers table
    op.drop_table('group_teachers')

    # Remove columns from groups table
    op.drop_column('groups', 'semester')
    op.drop_column('groups', 'course')

    # Remove column from users table
    op.drop_column('users', 'phone')

