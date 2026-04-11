-- 011_user_groups.sql
-- User-to-group memberships (groups correspond 1:1 to sport_types).
-- A user who is a member of e.g. the "rennrad" group will see only
-- "rennrad" group members when inviting people to a Rennrad event.

CREATE TABLE IF NOT EXISTS user_groups (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_type_key  VARCHAR(100) NOT NULL REFERENCES sport_types(key) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, sport_type_key)
);

CREATE INDEX IF NOT EXISTS idx_user_groups_user    ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_sport   ON user_groups(sport_type_key);
