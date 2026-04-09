-- Migration 010: Add comment_reactions table for emoji reactions on comments
CREATE TABLE IF NOT EXISTS comment_reactions (
    id                  SERIAL PRIMARY KEY,
    comment_id          INTEGER      NOT NULL REFERENCES event_comments(id) ON DELETE CASCADE,
    user_keycloak_id    VARCHAR(255) NOT NULL,
    user_name           VARCHAR(255),
    emoji               VARCHAR(50)  NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (comment_id, user_keycloak_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
