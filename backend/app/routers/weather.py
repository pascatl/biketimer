import os
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from ..auth import get_current_user

router = APIRouter(prefix="/weather", tags=["weather"])

OWM_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY", "")
OWM_BASE = "https://api.openweathermap.org/data/2.5/forecast"


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(...),
    lon: float = Query(...),
    date: str = Query(..., description="YYYY-MM-DD"),
    time: Optional[str] = Query("15:00", description="HH:MM"),
    _user: dict = Depends(get_current_user),
):
    """Proxy to OpenWeatherMap 5-day/3h forecast.

    Returns a single forecast slot closest to the requested date+time.
    The API key is kept server-side and never exposed to the browser.
    """
    if not OWM_API_KEY:
        raise HTTPException(status_code=503, detail="Wetter-API nicht konfiguriert")

    url = (
        f"{OWM_BASE}?appid={OWM_API_KEY}&units=metric&lang=de"
        f"&lat={lat}&lon={lon}"
    )

    async with httpx.AsyncClient(timeout=8) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"OWM Fehler: {e.response.status_code}")
        except Exception as e:
            raise HTTPException(status_code=502, detail="Wetterdaten nicht verfügbar")

    data = resp.json()
    slots = data.get("list", [])
    if not slots:
        raise HTTPException(status_code=404, detail="Keine Vorhersage verfügbar")

    # Parse requested datetime and find closest slot
    from datetime import datetime

    target_str = f"{date} {time}:00"
    try:
        target_dt = datetime.strptime(target_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        raise HTTPException(status_code=400, detail="Ungültiges Datumsformat")

    def slot_dt(slot):
        return datetime.strptime(slot["dt_txt"], "%Y-%m-%d %H:%M:%S")

    closest = min(slots, key=lambda s: abs((slot_dt(s) - target_dt).total_seconds()))

    w = closest["weather"][0]
    return {
        "dt_txt": closest["dt_txt"],
        "temp": round(closest["main"]["temp"]),
        "feels_like": round(closest["main"]["feels_like"]),
        "description": w["description"],
        "icon": w["icon"],
        "icon_url": f"https://openweathermap.org/img/wn/{w['icon']}@2x.png",
    }
