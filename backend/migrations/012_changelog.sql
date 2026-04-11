-- Changelog / "Was gibt's Neues" entries
CREATE TABLE IF NOT EXISTS changelog_entries (
    id          SERIAL PRIMARY KEY,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracks which user has seen which changelog entry
CREATE TABLE IF NOT EXISTS changelog_seen (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changelog_id    INTEGER NOT NULL REFERENCES changelog_entries(id) ON DELETE CASCADE,
    seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, changelog_id)
);

-- First entry: groups feature
INSERT INTO changelog_entries (slug, title, body) VALUES (
    'groups-v1',
    'Neu: Gruppen',
    'Ab sofort kannst du dich Gruppen zuordnen (z.B. Rennrad, MTB, Beachen, Squash). Gruppen steuern, wer dir beim Einladen vorgeschlagen wird – so erreichst du gezielt die richtigen Leute. Du kannst deine Gruppen jederzeit in den Einstellungen ändern.'
) ON CONFLICT (slug) DO NOTHING;
