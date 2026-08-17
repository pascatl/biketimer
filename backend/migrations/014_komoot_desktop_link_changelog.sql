-- Changelog entry: Komoot desktop share link fix
INSERT INTO changelog_entries (slug, title, body) VALUES (
    'komoot-desktop-link-v1',
    'Verbesserung: Komoot-Freigabe-Links',
    'Komoot-Links funktionieren jetzt zuverlässig – egal ob vom Handy oder vom Desktop geteilt. Bisher konnten Desktop-Links (komoot.com/de-de/tour/…) nicht korrekt importiert werden. Das ist jetzt behoben.'
) ON CONFLICT (slug) DO NOTHING;
