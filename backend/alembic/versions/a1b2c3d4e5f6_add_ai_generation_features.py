"""Add AI generation features and lesson assignment system

Revision ID: a1b2c3d4e5f6
Revises: 85b74f001768
Create Date: 2025-11-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '85b74f001768'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Add new material types to MaterialType enum (PDF, PPTX, DOCX)
    # Note: PostgreSQL requires ALTER TYPE for adding enum values
    op.execute("ALTER TYPE materialtype ADD VALUE IF NOT EXISTS 'PDF'")
    op.execute("ALTER TYPE materialtype ADD VALUE IF NOT EXISTS 'PPTX'")
    op.execute("ALTER TYPE materialtype ADD VALUE IF NOT EXISTS 'DOCX'")

    # 2. Add new columns to lesson_materials table
    op.add_column('lesson_materials', sa.Column('extracted_text', sa.Text(), nullable=True))
    op.add_column('lesson_materials', sa.Column('use_for_ai_generation', sa.Boolean(), nullable=False, server_default='false'))

    # 3. Create teacher_subject_groups table
    op.create_table(
        'teacher_subject_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], name=op.f('fk_teacher_subject_groups_teacher_id_users')),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], name=op.f('fk_teacher_subject_groups_subject_id_subjects')),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_teacher_subject_groups_group_id_groups')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_teacher_subject_groups')),
        sa.UniqueConstraint('teacher_id', 'subject_id', 'group_id', name='unique_teacher_subject_group')
    )
    op.create_index(op.f('ix_teacher_subject_groups_id'), 'teacher_subject_groups', ['id'], unique=False)
    op.create_index(op.f('ix_teacher_subject_groups_teacher_id'), 'teacher_subject_groups', ['teacher_id'], unique=False)
    op.create_index(op.f('ix_teacher_subject_groups_subject_id'), 'teacher_subject_groups', ['subject_id'], unique=False)
    op.create_index(op.f('ix_teacher_subject_groups_group_id'), 'teacher_subject_groups', ['group_id'], unique=False)

    # 4. Create lesson_assignments table
    op.create_table(
        'lesson_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('deadline_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], name=op.f('fk_lesson_assignments_lesson_id_lessons'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_lesson_assignments_group_id_groups')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_lesson_assignments')),
        sa.UniqueConstraint('lesson_id', 'group_id', name='unique_lesson_group_assignment')
    )
    op.create_index(op.f('ix_lesson_assignments_id'), 'lesson_assignments', ['id'], unique=False)
    op.create_index(op.f('ix_lesson_assignments_lesson_id'), 'lesson_assignments', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_lesson_assignments_group_id'), 'lesson_assignments', ['group_id'], unique=False)

    # 5. Create task_tests table
    op.create_table(
        'task_tests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('test_name', sa.String(length=255), nullable=False),
        sa.Column('test_input', sa.Text(), nullable=False),
        sa.Column('expected_output', sa.Text(), nullable=False),
        sa.Column('test_type', sa.Enum('UNIT', 'INTEGRATION', 'CUSTOM', name='testtype'), nullable=False, server_default='UNIT'),
        sa.Column('weight', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('timeout_seconds', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], name=op.f('fk_task_tests_task_id_tasks'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_task_tests'))
    )
    op.create_index(op.f('ix_task_tests_id'), 'task_tests', ['id'], unique=False)
    op.create_index(op.f('ix_task_tests_task_id'), 'task_tests', ['task_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""

    # Drop tables in reverse order (due to foreign key constraints)
    op.drop_index(op.f('ix_task_tests_task_id'), table_name='task_tests')
    op.drop_index(op.f('ix_task_tests_id'), table_name='task_tests')
    op.drop_table('task_tests')
    op.execute("DROP TYPE IF EXISTS testtype")

    op.drop_index(op.f('ix_lesson_assignments_group_id'), table_name='lesson_assignments')
    op.drop_index(op.f('ix_lesson_assignments_lesson_id'), table_name='lesson_assignments')
    op.drop_index(op.f('ix_lesson_assignments_id'), table_name='lesson_assignments')
    op.drop_table('lesson_assignments')

    op.drop_index(op.f('ix_teacher_subject_groups_group_id'), table_name='teacher_subject_groups')
    op.drop_index(op.f('ix_teacher_subject_groups_subject_id'), table_name='teacher_subject_groups')
    op.drop_index(op.f('ix_teacher_subject_groups_teacher_id'), table_name='teacher_subject_groups')
    op.drop_index(op.f('ix_teacher_subject_groups_id'), table_name='teacher_subject_groups')
    op.drop_table('teacher_subject_groups')

    # Remove columns from lesson_materials
    op.drop_column('lesson_materials', 'use_for_ai_generation')
    op.drop_column('lesson_materials', 'extracted_text')

    # Note: Cannot remove enum values in PostgreSQL without recreating the entire type
    # This is acceptable as the old system will simply ignore the new enum values
