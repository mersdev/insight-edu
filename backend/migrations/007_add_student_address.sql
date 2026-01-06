-- Migration 007: Add address field to students table
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE students ADD COLUMN address TEXT;

COMMIT;
PRAGMA foreign_keys = ON;
