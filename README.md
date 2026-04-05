# biketimer

A self-hosted app for organizing group bike rides. Members get invited to events, confirm or decline attendance, see who's coming, and coordinate meeting points.

## Stack

- **Backend:** FastAPI (Python 3.12), SQLAlchemy, PostgreSQL 16
- **Frontend:** React 18, MUI v7, Vite, MapLibre GL
- **Auth:** Keycloak (Direct Access Grants, RS256 JWT)
- **Infrastructure:** Docker Compose, Nginx

## Features

- Create events with type (Rennrad, MTB, Beachen), title, date/time, organizer, jersey, comment, link, and meeting point (text + map pin via MapLibre)
- Invite users per event; they receive email invitations with accept/decline links
- RSVP directly in the app or via email link
- Meeting point picker with free-text field and interactive map (CARTO Positron basemap); map link opens OpenStreetMap
- Event cards show invitee status (accepted / pending / declined) with avatar chips
- Event organizer and jersey assignment per ride
- Admin role: sees and can edit/delete all events regardless of invitation status; displayed in header as `Name (Admin)`
- Past events are read-only
- Push notifications (Web Push)
- Mobile-responsive layout
- Stats panel

## Running

### Production

```bash
cp .env.example .env  # fill in your values
docker compose up --build -d
```

Frontend is served on port 80 (Nginx). Backend and DB are internal only.

### Development (hot reload)

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Service  | Port |
|----------|------|
| Frontend | 5173 (Vite) |
| Backend  | 8000 (FastAPI + Swagger at /docs) |

Changes to frontend or backend source files are picked up without rebuilding the image.

## Configuration

All config lives in `.env`:

| Variable | Description |
|---|---|
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL credentials |
| `KEYCLOAK_URL` | Keycloak server base URL |
| `KEYCLOAK_REALM` | Realm name |
| `KEYCLOAK_CLIENT_ID_FRONTEND` | Public client for the frontend |
| `KEYCLOAK_CLIENT_ID_BACKEND` | Confidential client for token verification |
| `FRONTEND_URL` | Public URL (used for email RSVP links) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | Mail settings |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push VAPID keys |

## Database migrations

Migrations in `backend/migrations/` are applied automatically on startup. The app checks column types / table existence and runs the relevant SQL only when needed.

To add a migration, create a new numbered `.sql` file and register it in `backend/app/main.py`.



## Development notes

- Backend auto-reloads in dev mode (mounted volume). No rebuild needed for Python changes.
- Frontend uses Vite's dev server; `/api` and `/kc` are proxied to backend and Keycloak respectively (see `vite.config.js`).
- The `admin` realm role in Keycloak grants full access to all events and shows `(Admin)` next to the username in the header.
- MapLibre map tiles use the free CARTO Positron style — no API key required.
