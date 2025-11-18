"""Initial schema setup

Revision ID: 001_initial_schema
Revises:
Create Date: 2025-11-18 22:30:00.000000

This migration creates all tables in the correct order to ensure
foreign key dependencies are satisfied.

Table creation order:
1. ENUMs (userrole, programminglanguage, aiprovider, materialtype)
2. groups (no dependencies)
3. users (depends on groups)
4. subjects (no dependencies)
5. lessons (depends on subjects, users)
6. lesson_materials (depends on lessons)
7. tasks (depends on lessons)
8. submissions (depends on tasks, users)
9. evaluations (depends on submissions)
10. ai_solutions (depends on tasks)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Create ENUM types
    # These must be created first as they are used by table columns
    # Using IF NOT EXISTS to avoid conflicts with existing types

    # UserRole enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # ProgrammingLanguage enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE programminglanguage AS ENUM (
                'PYTHON', 'JAVA', 'JAVASCRIPT', 'CPP', 'C', 'CSHARP', 'GO', 'RUST'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # AIProvider enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE aiprovider AS ENUM ('OPENAI', 'ANTHROPIC');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # MaterialType enum
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE materialtype AS ENUM ('TEXT', 'FILE', 'YOUTUBE');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Step 2: Create groups table (no dependencies)
    op.create_table(
        'groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_groups'))
    )
    op.create_index(op.f('ix_groups_id'), 'groups', ['id'], unique=False)
    op.create_index(op.f('ix_groups_name'), 'groups', ['name'], unique=True)

    # Step 3: Create users table (depends on groups)
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('ADMIN', 'TEACHER', 'STUDENT', name='userrole', create_type=False), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], name=op.f('fk_users_group_id_groups')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users'))
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_group_id'), 'users', ['group_id'], unique=False)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_name'), 'users', ['name'], unique=False)
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)

    # Step 4: Create subjects table (no dependencies)
    op.create_table(
        'subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_subjects'))
    )
    op.create_index(op.f('ix_subjects_id'), 'subjects', ['id'], unique=False)
    op.create_index(op.f('ix_subjects_name'), 'subjects', ['name'], unique=True)

    # Step 5: Create lessons table (depends on subjects and users)
    op.create_table(
        'lessons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('video_url', sa.String(length=1024), nullable=True),
        sa.Column('video_description', sa.Text(), nullable=True),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], name=op.f('fk_lessons_subject_id_subjects')),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], name=op.f('fk_lessons_teacher_id_users')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_lessons'))
    )
    op.create_index(op.f('ix_lessons_id'), 'lessons', ['id'], unique=False)
    op.create_index(op.f('ix_lessons_subject_id'), 'lessons', ['subject_id'], unique=False)
    op.create_index(op.f('ix_lessons_teacher_id'), 'lessons', ['teacher_id'], unique=False)
    op.create_index(op.f('ix_lessons_title'), 'lessons', ['title'], unique=False)

    # Step 6: Create lesson_materials table (depends on lessons)
    op.create_table(
        'lesson_materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('TEXT', 'FILE', 'YOUTUBE', name='materialtype', create_type=False), nullable=False),
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

    # Step 7: Create tasks table (depends on lessons)
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('language', sa.Enum('PYTHON', 'JAVA', 'JAVASCRIPT', 'CPP', 'C', 'CSHARP', 'GO', 'RUST', name='programminglanguage', create_type=False), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('deadline_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], name=op.f('fk_tasks_lesson_id_lessons')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_tasks'))
    )
    op.create_index(op.f('ix_tasks_deadline_at'), 'tasks', ['deadline_at'], unique=False)
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_index(op.f('ix_tasks_language'), 'tasks', ['language'], unique=False)
    op.create_index(op.f('ix_tasks_lesson_id'), 'tasks', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_tasks_title'), 'tasks', ['title'], unique=False)

    # Step 8: Create submissions table (depends on tasks and users)
    op.create_table(
        'submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], name=op.f('fk_submissions_student_id_users')),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], name=op.f('fk_submissions_task_id_tasks')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_submissions'))
    )
    op.create_index(op.f('ix_submissions_id'), 'submissions', ['id'], unique=False)
    op.create_index(op.f('ix_submissions_student_id'), 'submissions', ['student_id'], unique=False)
    op.create_index(op.f('ix_submissions_task_id'), 'submissions', ['task_id'], unique=False)

    # Step 9: Create evaluations table (depends on submissions)
    op.create_table(
        'evaluations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('ai_similarity', sa.Float(), nullable=False),
        sa.Column('intra_group_similarity', sa.Float(), nullable=False),
        sa.Column('final_score', sa.Integer(), nullable=False),
        sa.Column('rationale', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['submissions.id'], name=op.f('fk_evaluations_submission_id_submissions')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_evaluations'))
    )
    op.create_index(op.f('ix_evaluations_ai_similarity'), 'evaluations', ['ai_similarity'], unique=False)
    op.create_index(op.f('ix_evaluations_final_score'), 'evaluations', ['final_score'], unique=False)
    op.create_index(op.f('ix_evaluations_id'), 'evaluations', ['id'], unique=False)
    op.create_index(op.f('ix_evaluations_intra_group_similarity'), 'evaluations', ['intra_group_similarity'], unique=False)
    op.create_index(op.f('ix_evaluations_submission_id'), 'evaluations', ['submission_id'], unique=True)

    # Step 10: Create ai_solutions table (depends on tasks)
    op.create_table(
        'ai_solutions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.Enum('OPENAI', 'ANTHROPIC', name='aiprovider', create_type=False), nullable=False),
        sa.Column('variant_index', sa.Integer(), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('meta', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], name=op.f('fk_ai_solutions_task_id_tasks')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_ai_solutions'))
    )
    op.create_index(op.f('ix_ai_solutions_id'), 'ai_solutions', ['id'], unique=False)
    op.create_index(op.f('ix_ai_solutions_provider'), 'ai_solutions', ['provider'], unique=False)
    op.create_index(op.f('ix_ai_solutions_task_id'), 'ai_solutions', ['task_id'], unique=False)
    op.create_index(op.f('ix_ai_solutions_variant_index'), 'ai_solutions', ['variant_index'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order to avoid foreign key constraint violations
    op.drop_index(op.f('ix_ai_solutions_variant_index'), table_name='ai_solutions')
    op.drop_index(op.f('ix_ai_solutions_task_id'), table_name='ai_solutions')
    op.drop_index(op.f('ix_ai_solutions_provider'), table_name='ai_solutions')
    op.drop_index(op.f('ix_ai_solutions_id'), table_name='ai_solutions')
    op.drop_table('ai_solutions')

    op.drop_index(op.f('ix_evaluations_submission_id'), table_name='evaluations')
    op.drop_index(op.f('ix_evaluations_intra_group_similarity'), table_name='evaluations')
    op.drop_index(op.f('ix_evaluations_id'), table_name='evaluations')
    op.drop_index(op.f('ix_evaluations_final_score'), table_name='evaluations')
    op.drop_index(op.f('ix_evaluations_ai_similarity'), table_name='evaluations')
    op.drop_table('evaluations')

    op.drop_index(op.f('ix_submissions_task_id'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_student_id'), table_name='submissions')
    op.drop_index(op.f('ix_submissions_id'), table_name='submissions')
    op.drop_table('submissions')

    op.drop_index(op.f('ix_tasks_title'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_lesson_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_language'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_index(op.f('ix_tasks_deadline_at'), table_name='tasks')
    op.drop_table('tasks')

    op.drop_index(op.f('ix_lesson_materials_type'), table_name='lesson_materials')
    op.drop_index(op.f('ix_lesson_materials_lesson_id'), table_name='lesson_materials')
    op.drop_index(op.f('ix_lesson_materials_id'), table_name='lesson_materials')
    op.drop_table('lesson_materials')

    op.drop_index(op.f('ix_lessons_title'), table_name='lessons')
    op.drop_index(op.f('ix_lessons_teacher_id'), table_name='lessons')
    op.drop_index(op.f('ix_lessons_subject_id'), table_name='lessons')
    op.drop_index(op.f('ix_lessons_id'), table_name='lessons')
    op.drop_table('lessons')

    op.drop_index(op.f('ix_subjects_name'), table_name='subjects')
    op.drop_index(op.f('ix_subjects_id'), table_name='subjects')
    op.drop_table('subjects')

    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_index(op.f('ix_users_name'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_group_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_groups_name'), table_name='groups')
    op.drop_index(op.f('ix_groups_id'), table_name='groups')
    op.drop_table('groups')

    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS materialtype')
    op.execute('DROP TYPE IF EXISTS aiprovider')
    op.execute('DROP TYPE IF EXISTS programminglanguage')
    op.execute('DROP TYPE IF EXISTS userrole')
