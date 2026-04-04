# Keycloak Setup für Biketimer

## 1. Realm anlegen

1. Keycloak Admin Console öffnen (z. B. http://localhost:8080/admin)
2. **Create Realm** → Name: `biketimer`

---

## 2. Client anlegen (Frontend)

1. Im Realm `biketimer` → **Clients** → **Create client**
2. Einstellungen:

| Feld                  | Wert                                    |
| --------------------- | --------------------------------------- |
| Client ID             | `biketimer-frontend`                    |
| Client type           | `OpenID Connect`                        |
| Authentication flow   | Standard flow ✓, Direct access grants ✓ |
| Client authentication | **OFF** (Public client)                 |

3. **Valid redirect URIs:**
   - `http://localhost:5173/*`

4. **Web origins:**
   - `http://localhost:5173`

---

## 3. Nutzer anlegen (optional für Tests)

1. **Users** → **Add user**
2. E-Mail-Adresse setzen und bestätigen
3. **Credentials** → temporäres Passwort setzen
4. E-Mail-Adresse muss im Token enthalten sein → **User profile** sicherstellen, dass `email` als Claim konfiguriert ist

---

## 4. E-Mail-Claim sicherstellen

Damit Einladungen per E-Mail matchen:

1. **Client Scopes** → `email` scope prüfen: sollte `email` und `email_verified` als Mapper enthalten
2. Im Client `biketimer-frontend` → **Client scopes** → `email` als Default Scope hinzufügen (falls nicht vorhanden)

---

## 5. .env befüllen

```
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=biketimer
KEYCLOAK_CLIENT_ID_FRONTEND=biketimer-frontend
KEYCLOAK_CLIENT_ID_BACKEND=biketimer-frontend
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USER=noreply@example.com
SMTP_PASSWORD=secret
SMTP_FROM=biketimer@example.com
```

---

## 6. SQL-Migration ausführen

```bash
psql "$DATABASE_URL" -f backend/migrations/001_init.sql
```

---

## 7. Starten

```bash
cp .env.example .env   # und ausfüllen
docker compose -f docker-compose.dev.yml up --build
```

Frontend: http://localhost:5173  
Backend API: http://localhost:8000/api  
Backend Docs: http://localhost:8000/docs
