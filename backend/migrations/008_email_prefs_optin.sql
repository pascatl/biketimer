-- Migration 008: set all email notifications to opt-in (disabled by default)
-- Only invite_received stays enabled; everything else is turned off for all users.
UPDATE users
SET email_prefs = jsonb_build_object(
    'invite_received',       COALESCE((email_prefs->>'invite_received')::boolean, true),
    'event_updated',         false,
    'event_cancelled',       false,
    'admin_user_registered', false,
    'admin_event_created',   false,
    'admin_event_updated',   false,
    'admin_event_deleted',   false
);
