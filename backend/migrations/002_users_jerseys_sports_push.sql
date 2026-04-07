-- ============================================================
-- 002_users_jerseys_sports_push.sql
-- Adds: users, jerseys, sport_types, push_subscriptions tables
-- All statements are idempotent.
-- ============================================================

-- ── Users table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    keycloak_id      VARCHAR(255) UNIQUE,
    name             VARCHAR(255) NOT NULL,
    email            VARCHAR(255),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- ── Jerseys table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jerseys (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL UNIQUE,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Sport types table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sport_types (
    id               SERIAL PRIMARY KEY,
    key              VARCHAR(100) NOT NULL UNIQUE,
    label            VARCHAR(255) NOT NULL,
    icon             VARCHAR(100) NOT NULL DEFAULT 'DirectionsBike',
    color            VARCHAR(20)  NOT NULL DEFAULT '#2D3C59',
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Push subscriptions table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id               SERIAL PRIMARY KEY,
    keycloak_id      VARCHAR(255) NOT NULL,
    endpoint         TEXT NOT NULL UNIQUE,
    p256dh           TEXT NOT NULL,
    auth             TEXT NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_keycloak_id ON push_subscriptions(keycloak_id);

-- ── Seed default data ────────────────────────────────────────

-- Default users
INSERT INTO users (name, is_active) VALUES
    ('Pascal', true), ('Flo', true), ('Jan', true), ('Max B.', true), ('Jonas', true),
    ('Samuel', true), ('Tom', true), ('Alex', true), ('David', true), ('Max H.', true),
    ('Gil', true), ('Tim', true), ('Miri', true)
ON CONFLICT DO NOTHING;

-- Default jerseys
INSERT INTO jerseys (name, is_active, sort_order) VALUES
    ('McDonalds', true, 1), ('FDJ', true, 2), ('Deutschlandtour', true, 3),
    ('Dr. Kamm', true, 4), ('Cofidis', true, 5), ('HTC', true, 6), ('freie Auswahl', true, 7)
ON CONFLICT (name) DO NOTHING;

-- Default sport types
INSERT INTO sport_types (key, label, icon, color, is_active, sort_order) VALUES
    ('rennrad', 'Rennrad', 'DirectionsBike', '#2D3C59', true, 1),
    ('mtb', 'MTB', 'Landscape', '#94A378', true, 2),
    ('squash', 'Squash', 'SportsTennis', '#D1855C', true, 3),
    ('beachvolleyball', 'Beachvolleyball', 'SportsVolleyball', '#E5BA41', true, 4)
ON CONFLICT (key) DO NOTHING;
