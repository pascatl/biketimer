-- Changelog entry: Komoot desktop share link fix
INSERT INTO changelog_entries (slug, title, body) VALUES (
    'recurring-events-v1',
    'Neu: Serientermine',
    'Beim Anlegen eines Events kann dieses direkt als wöchentlicher Serientermin erstellt werden. Einfach eine Anzahl eingeben und der Termin wird entsprechend oft wiederholt.'
) ON CONFLICT (slug) DO NOTHING;
