-- Changelog entry: ICS calendar export feature
INSERT INTO changelog_entries (slug, title, body) VALUES (
    'ics-export-v1',
    'Neu: Kalender-Export',
    'Events können jetzt als .ics-Datei heruntergeladen und in jeden Kalender importiert werden – z.B. Apple Kalender, Google Kalender, Outlook, Thunderbird oder Nextcloud. Einfach auf das Kalender-Symbol in der Event-Ansicht klicken.'
) ON CONFLICT (slug) DO NOTHING;
