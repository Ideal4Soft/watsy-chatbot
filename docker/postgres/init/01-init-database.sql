-- PostgreSQL Initialization Script for Watsy-Chatbot
-- This script runs when the PostgreSQL container is first created

-- Create additional databases if needed
-- CREATE DATABASE watsy_chatbot_test;

-- Create extensions that will be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions to the ahmed user
GRANT ALL PRIVILEGES ON DATABASE watsy_chatbot TO ahmed;

-- Create a schema for the application (optional, Prisma will handle this)
-- CREATE SCHEMA IF NOT EXISTS watsy AUTHORIZATION ahmed;

-- Set default search path
-- ALTER USER ahmed SET search_path TO watsy, public;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Watsy-Chatbot database initialized successfully';
END $$;
