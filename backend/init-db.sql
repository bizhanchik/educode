-- EduCode Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE educode_db TO educode_user;
