-- Migration 004: Backfill creator self-invitations for existing events
-- Adds an accepted self-invitation for every event creator who doesn't have one yet.

INSERT INTO invitations (
    event_id,
    inviter_keycloak_id,
    inviter_name,
    invitee_email,
    invitee_keycloak_id,
    status,
    responded_at,
    created_at
)
SELECT
    e.id,
    e.creator_keycloak_id,
    e.creator_name,
    COALESCE(
        e.creator_email,
        LOWER(REPLACE(COALESCE(e.creator_name, 'unknown'), ' ', '.')) || '@local'
    ),
    e.creator_keycloak_id,
    'accepted',
    NOW(),
    NOW()
FROM events e
WHERE
    e.creator_keycloak_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM invitations i
        WHERE i.event_id = e.id
          AND i.invitee_keycloak_id = e.creator_keycloak_id
    );
