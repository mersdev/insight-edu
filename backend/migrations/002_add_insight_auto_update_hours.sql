-- Migration: Add insight_auto_update_hours to settings table
-- Date: 2024-12-19

-- Add the column (SQLite will error if it already exists, which is fine for migrations)
ALTER TABLE settings ADD COLUMN insight_auto_update_hours INTEGER DEFAULT 12;
