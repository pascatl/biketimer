-- Migration 004: Add notification_prefs JSON column to push_subscriptions
ALTER TABLE push_subscriptions
    ADD COLUMN IF NOT EXISTS notification_prefs JSONB;
