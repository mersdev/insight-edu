-- Migration: Add insight_auto_update_hours to settings table
-- Date: 2024-12-19

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'insight_auto_update_hours'
    ) THEN
        ALTER TABLE settings 
        ADD COLUMN insight_auto_update_hours INTEGER DEFAULT 12;
        
        RAISE NOTICE 'Column insight_auto_update_hours added to settings table';
    ELSE
        RAISE NOTICE 'Column insight_auto_update_hours already exists';
    END IF;
END $$;

