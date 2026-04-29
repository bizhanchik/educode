"""Add testing and practice tables

Revision ID: 20251207_023544
Revises: d3e4f5g6h7i8
Create Date: 2025-12-07 02:35:44.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20251207_023544'
down_revision = 'd3e4f5g6h7i8'
branch_labels = None
depends_on = None


def upgrade():
    # Create test_questions table
    op.create_table(
        'test_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('options', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('correct_answer', sa.Integer(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('topic', sa.String(length=255), nullable=True),
        sa.Column('difficulty', sa.String(length=50), nullable=True),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_questions_lesson_id'), 'test_questions', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_test_questions_topic'), 'test_questions', ['topic'], unique=False)

    # Create test_results table
    op.create_table(
        'test_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=False),
        sa.Column('incorrect_question_ids', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('time_taken_seconds', sa.Integer(), nullable=True),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_results_lesson_id'), 'test_results', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_test_results_student_id'), 'test_results', ['student_id'], unique=False)

    # Create test_attempts table
    op.create_table(
        'test_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_answer', sa.Integer(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('test_result_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['test_questions.id']),
        sa.ForeignKeyConstraint(['test_result_id'], ['test_results.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_test_attempts_question_id'), 'test_attempts', ['question_id'], unique=False)
    op.create_index(op.f('ix_test_attempts_test_result_id'), 'test_attempts', ['test_result_id'], unique=False)

    # Create practice_results table
    op.create_table(
        'practice_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('execution_result', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('ai_feedback', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('similarity_score', sa.Float(), nullable=True),
        sa.Column('correctness_score', sa.Float(), nullable=True),
        sa.Column('practice_score', sa.Float(), nullable=False),
        sa.Column('is_plagiarized', sa.Boolean(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_practice_results_lesson_id'), 'practice_results', ['lesson_id'], unique=False)
    op.create_index(op.f('ix_practice_results_student_id'), 'practice_results', ['student_id'], unique=False)
    op.create_index(op.f('ix_practice_results_task_id'), 'practice_results', ['task_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_practice_results_task_id'), table_name='practice_results')
    op.drop_index(op.f('ix_practice_results_student_id'), table_name='practice_results')
    op.drop_index(op.f('ix_practice_results_lesson_id'), table_name='practice_results')
    op.drop_table('practice_results')
    op.drop_index(op.f('ix_test_attempts_test_result_id'), table_name='test_attempts')
    op.drop_index(op.f('ix_test_attempts_question_id'), table_name='test_attempts')
    op.drop_table('test_attempts')
    op.drop_index(op.f('ix_test_results_student_id'), table_name='test_results')
    op.drop_index(op.f('ix_test_results_lesson_id'), table_name='test_results')
    op.drop_table('test_results')
    op.drop_index(op.f('ix_test_questions_topic'), table_name='test_questions')
    op.drop_index(op.f('ix_test_questions_lesson_id'), table_name='test_questions')
    op.drop_table('test_questions')

