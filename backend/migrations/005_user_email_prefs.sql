-- Migration 005: Add email_prefs JSON column to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_prefs JSONB;
