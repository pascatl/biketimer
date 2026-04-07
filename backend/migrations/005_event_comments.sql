-- Migration 005: Add event_comments table
CREATE TABLE IF NOT EXISTS event_comments (
    id                  SERIAL PRIMARY KEY,
    event_id            INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    author_keycloak_id  VARCHAR(255) NOT NULL,
    author_name         VARCHAR(255),
    content             TEXT         NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);
