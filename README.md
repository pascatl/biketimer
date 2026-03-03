# biketimer

## Docker

### Production (default)

```bash
docker compose up --build
```

### Development (Hot Reloading)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Der Dev-Server läuft auf Port `5173` (oder per `PORT`-Umgebungsvariable überschreibbar).  
Änderungen am Quellcode werden sofort durch Vite Hot Reloading übernommen.
