-- ============================================================
-- 007_sport_type_icons.sql
-- Ensures correct icons for existing sport types and adds
-- Beachvolleyball with SportsVolleyball icon.
-- All statements are idempotent.
-- ============================================================

-- Ensure correct icons for existing sport types
UPDATE sport_types SET icon = 'DirectionsBike' WHERE key = 'rennrad' AND icon != 'DirectionsBike';
UPDATE sport_types SET icon = 'Landscape'      WHERE key = 'mtb'     AND icon != 'Landscape';
UPDATE sport_types SET icon = 'SportsTennis'   WHERE key = 'squash'  AND icon != 'SportsTennis';

-- Add Beachvolleyball sport type if not present
INSERT INTO sport_types (key, label, icon, color, is_active, sort_order)
VALUES ('beachvolleyball', 'Beachvolleyball', 'SportsVolleyball', '#E5BA41', true, 4)
ON CONFLICT (key) DO UPDATE SET icon = 'SportsVolleyball';
