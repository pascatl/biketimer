-- ============================================================
-- 003_invitation_decline_reason.sql
-- Adds: decline_reason column to invitations table
-- ============================================================

ALTER TABLE invitations
    ADD COLUMN IF NOT EXISTS decline_reason TEXT;
