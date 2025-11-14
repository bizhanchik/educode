"""add password_hash to users

Revision ID: add_password_hash
Revises: 04aa8bea4c49
Create Date: 2025-10-15 21:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_password_hash'
down_revision = '04aa8bea4c49'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add password_hash column to users table."""
    # Add password_hash column (nullable initially to handle existing rows)
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))

    # Set default password hash for existing users (hashed "changeme")
    # Password: "changeme" -> bcrypt hash
    op.execute(
        "UPDATE users SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewf.eW7MGc5yJMKa' WHERE password_hash IS NULL"
    )

    # Make password_hash non-nullable
    op.alter_column('users', 'password_hash', nullable=False)


def downgrade() -> None:
    """Remove password_hash column from users table."""
    op.drop_column('users', 'password_hash')
