import React, { useEffect, useState } from "react";
import { Box, Tooltip, Typography, CircularProgress } from "@mui/material";
import { getAccessToken } from "../auth/AuthService";

/**
 * WeatherWidget – compact inline forecast badge.
 *
 * Props:
 *   date        – "YYYY-MM-DD"
 *   time        – "HH:MM"  (optional, defaults to "15:00")
 *   lat, lon    – coordinates for the forecast location
 *                 (fall back to a default location when not provided)
 *
 * Renders nothing when:
 *   - no API key is configured on the backend
 *   - the date is more than 5 days out (OWM forecast limit)
 *   - the date is in the past
 */

const DEFAULT_LAT = 49.583332;
const DEFAULT_LON = 11.016667;

function isWithinForecastWindow(dateStr) {
  if (!dateStr) return false;
  const eventDate = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffDays = (eventDate - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 5;
}

export default function WeatherWidget({ date, time = "15:00", lat, lon, iconSize = 44 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const useLat = lat ?? DEFAULT_LAT;
  const useLon = lon ?? DEFAULT_LON;

  useEffect(() => {
    if (!date || !isWithinForecastWindow(date)) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: useLat,
      lon: useLon,
      date,
      time: time || "15:00",
    });

    const token = getAccessToken();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/weather/forecast?${params}`, {
      headers: { "Content-Type": "application/json", ...authHeader },
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [date, time, useLat, useLon]);

  if (!date || !isWithinForecastWindow(date)) return null;
  if (loading) return <CircularProgress size={14} sx={{ ml: 1 }} />;
  if (error || !data) return null;

  return (
    <Tooltip
      title={`${data.description} · gefühlt ${data.feels_like}°C (${data.dt_txt.slice(11, 16)} Uhr)`}
      placement="bottom"
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.25,
          cursor: "default",
          userSelect: "none",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255,255,255,0.75)",
            borderRadius: "50%",
            width: iconSize,
            height: iconSize,
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        >
          <Box
            component="img"
            src={data.icon_url}
            alt={data.description}
            sx={{ width: iconSize * 0.85, height: iconSize * 0.85 }}
          />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary", fontSize: `${Math.round(iconSize * 0.38)}px` }}>
          {data.temp}°C
        </Typography>
      </Box>
    </Tooltip>
  );
}
