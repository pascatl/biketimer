-- ============================================================
-- 001_init.sql  –  Biketimer Auth & Invitations Migration
-- Run once against your existing PostgreSQL database.
-- All statements are idempotent (IF NOT EXISTS / IF NOT EXISTS).
-- ============================================================

-- ── Events table ─────────────────────────────────────────────
-- Creates the table if it does not exist yet.
-- If you already have an events table, only the new columns
-- are added via the ALTER statements below.

CREATE TABLE IF NOT EXISTS events (
    id               SERIAL PRIMARY KEY,
    event_data       JSONB        NOT NULL DEFAULT '{}',
    creator_keycloak_id VARCHAR(255),
    creator_email    VARCHAR(255),
    creator_name     VARCHAR(255),
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Add new auth columns if the table already existed
ALTER TABLE events
    ADD COLUMN IF NOT EXISTS creator_keycloak_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS creator_email        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS creator_name         VARCHAR(255),
    ADD COLUMN IF NOT EXISTS created_at           TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMP DEFAULT NOW();

-- ── Invitations table ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- needed for gen_random_uuid()

CREATE TABLE IF NOT EXISTS invitations (
    id                   SERIAL PRIMARY KEY,
    event_id             INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    inviter_keycloak_id  VARCHAR(255) NOT NULL,
    inviter_name         VARCHAR(255),
    invitee_email        VARCHAR(255) NOT NULL,
    invitee_keycloak_id  VARCHAR(255),
    status               VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- pending | accepted | declined
    token                UUID         NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    responded_at         TIMESTAMP,
    UNIQUE (event_id, invitee_email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_event_id      ON invitations(event_id);
