-- Changelog entry: Komoot desktop share link fix
INSERT INTO changelog_entries (slug, title, body) VALUES (
    'signal-event-notification',
    'Neu: Signal Benachrichtigung',
    'Beim Anlegen eines Events wird das Event inkl. Rahmeninfos automatisch in die Signal Fahrradgruppe gepostet'
) ON CONFLICT (slug) DO NOTHING;
