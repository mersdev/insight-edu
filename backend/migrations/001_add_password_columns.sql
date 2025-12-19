-- Migration: Add password hashing columns to users table
-- This migration adds password_hash, must_change_password, and last_password_change columns

-- Add password_hash column (will replace password column eventually)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add must_change_password column (default true for security)
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- Add last_password_change timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- Create index on email for faster login queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Note: We keep the old 'password' column temporarily for backward compatibility
-- It will be removed after all passwords are migrated to password_hash

