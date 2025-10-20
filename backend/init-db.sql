-- EduCode Database Initialization Script
-- This script ensures the database and user are properly configured

-- Create the database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- But we can add any additional setup here

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Log the initialization
DO $$
BEGIN
    RAISE NOTICE 'EduCode database initialized successfully at %', NOW();
END $$;