import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import MapIcon from "@mui/icons-material/Map";
import CloseIcon from "@mui/icons-material/Close";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const BASEMAP_URL =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/**
 * MeetingPointPicker
 * Props:
 *   lat, lon       – current coordinates (number or null)
 *   text           – current free-text meeting point
 *   onChangeLat    – (lat) => void
 *   onChangeLon    – (lon) => void
 *   onChangeText   – (text) => void
 *   readOnly       – show mode only (no edit)
 */
export default function MeetingPointPicker({
  lat,
  lon,
  text,
  onChangeLat,
  onChangeLon,
  onChangeText,
  readOnly = false,
}) {
  const [open, setOpen] = useState(false);
  const [pendingLat, setPendingLat] = useState(lat);
  const [pendingLon, setPendingLon] = useState(lon);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Init map when dialog opens
  useEffect(() => {
    if (!open) return;
    // Short delay to let dialog render
    const tid = setTimeout(() => {
      if (!mapContainerRef.current) return;
      const centerLat = pendingLat ?? 49.596773;
      const centerLon = pendingLon ?? 10.992142;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: BASEMAP_URL,
        center: [centerLon, centerLat],
        zoom: pendingLat ? 13 : 10,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      // Place initial marker if coords exist
      if (pendingLat != null && pendingLon != null) {
        const el = createMarkerEl();
        markerRef.current = new maplibregl.Marker({ element: el, draggable: !readOnly })
          .setLngLat([pendingLon, pendingLat])
          .addTo(map);
        if (!readOnly) bindMarkerEvents();
      }

      if (!readOnly) {
        map.on("click", (e) => {
          const { lng, lat: lt } = e.lngLat;
          setPendingLat(lt);
          setPendingLon(lng);
          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lt]);
          } else {
            const el = createMarkerEl();
            markerRef.current = new maplibregl.Marker({ element: el, draggable: true })
              .setLngLat([lng, lt])
              .addTo(map);
            bindMarkerEvents();
          }
        });
      }

      function bindMarkerEvents() {
        markerRef.current.on("dragend", () => {
          const lngLat = markerRef.current.getLngLat();
          setPendingLat(lngLat.lat);
          setPendingLon(lngLat.lng);
        });
      }
    }, 100);

    return () => {
      clearTimeout(tid);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open]);

  function createMarkerEl() {
    const el = document.createElement("div");
    el.style.cssText =
      "width:28px;height:28px;background:#E5BA41;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #2D3C59;cursor:pointer";
    return el;
  }

  const handleGeolocate = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setPendingLat(latitude);
      setPendingLon(longitude);
      mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
      if (markerRef.current) {
        markerRef.current.setLngLat([longitude, latitude]);
      } else {
        const el = createMarkerEl();
        markerRef.current = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
        markerRef.current.on("dragend", () => {
          const lngLat = markerRef.current.getLngLat();
          setPendingLat(lngLat.lat);
          setPendingLon(lngLat.lng);
        });
      }
    });
  };

  const handleConfirm = () => {
    onChangeLat?.(pendingLat);
    onChangeLon?.(pendingLon);
    setOpen(false);
  };

  const handleClear = () => {
    setPendingLat(null);
    setPendingLon(null);
    onChangeLat?.(null);
    onChangeLon?.(null);
  };

  const handleOpen = () => {
    setPendingLat(lat);
    setPendingLon(lon);
    setOpen(true);
  };

  const hasCoords = lat != null && lon != null;
  const mapsUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=14`
    : null;

  return (
    <>
      {readOnly ? (
        /* View mode – subtle inline display */
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.75,
            mb: 1,
          }}
        >
          <PlaceIcon sx={{ fontSize: "0.95rem", color: "text.secondary" }} />
          {text && (
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              {text}
            </Typography>
          )}
          {hasCoords && (
            <Button
              component="a"
              size="small"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<MapIcon sx={{ fontSize: "0.8rem" }} />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontSize: "0.72rem",
                fontWeight: 600,
                px: 1,
                py: 0.2,
                color: "text.secondary",
                border: "1px solid rgba(45,60,89,0.18)",
                "&:hover": { borderColor: "#E5BA41", color: "#E5BA41" },
              }}
            >
              Karte
            </Button>
          )}
        </Box>
      ) : (
        /* Edit mode */
        <Box>
          <TextField
            label="Treffpunkt"
            value={text || ""}
            onChange={(e) => onChangeText?.(e.target.value)}
            size="small"
            fullWidth
            placeholder="z. B. in der Kurve"
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PlaceIcon />}
              onClick={handleOpen}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {hasCoords
                ? `📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`
                : "Pin auf Karte setzen"}
            </Button>
            {hasCoords && (
              <Tooltip title="Koordinaten entfernen">
                <IconButton size="small" onClick={handleClear} sx={{ color: "#D1855C" }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}

      {/* Map dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, height: "80vh" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
          Treffpunkt auf Karte setzen
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{ position: "absolute", right: 12, top: 12, color: "text.secondary" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, position: "relative", overflow: "hidden" }}>
          <Box
            ref={mapContainerRef}
            sx={{ width: "100%", height: "100%", minHeight: 400 }}
          />
          {!readOnly && (
            <Tooltip title="Meinen Standort verwenden">
              <IconButton
                onClick={handleGeolocate}
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  bgcolor: "white",
                  boxShadow: 2,
                  "&:hover": { bgcolor: "#f5f5f5" },
                }}
              >
                <MyLocationIcon />
              </IconButton>
            </Tooltip>
          )}
          {pendingLat == null && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                bgcolor: "rgba(255,255,255,0.85)",
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <PlaceIcon sx={{ color: "#E5BA41", fontSize: 32, mb: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
                Klick auf die Karte um einen Treffpunkt zu setzen
              </Typography>
            </Box>
          )}
        </DialogContent>
        {!readOnly && (
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            {pendingLat != null && (
              <Button
                onClick={() => { setPendingLat(null); setPendingLon(null); if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; } }}
                sx={{ color: "#D1855C", mr: "auto" }}
              >
                Pin entfernen
              </Button>
            )}
            <Button onClick={() => setOpen(false)} color="inherit" sx={{ color: "text.secondary" }}>
              Abbrechen
            </Button>
            <Button
              variant="contained"
              disableElevation
              onClick={handleConfirm}
              sx={{ borderRadius: 2, bgcolor: "primary.main" }}
            >
              Übernehmen
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}
