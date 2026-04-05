import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchPushPrefs, updatePushPrefs } from "../api";

const USER_PREFS = [
  { key: "invite_received", label: "Event-Einladung erhalten" },
  { key: "event_updated", label: "Event (zugesagt) wurde geändert" },
  { key: "event_cancelled", label: "Event (zugesagt) wurde abgesagt" },
];

const ADMIN_PREFS = [
  { key: "admin_user_registered", label: "Neuer Benutzer registriert" },
  { key: "admin_event_created", label: "Neues Event angelegt" },
  { key: "admin_event_updated", label: "Event von jemandem geändert" },
  { key: "admin_event_deleted", label: "Event gelöscht" },
];

export default function NotifPrefsDrawer({ open, onClose, isAdmin }) {
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pushGranted, setPushGranted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPushGranted(Notification.permission === "granted");
    fetchPushPrefs()
      .then((p) => setPrefs(p))
      .catch(() => setError("Einstellungen konnten nicht geladen werden."));
  }, [open]);

  const handleToggle = async (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      await updatePushPrefs(newPrefs);
    } catch {
      setError("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 360 }, p: 3 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Benachrichtigungen
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {!pushGranted && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: "0.8rem" }}>
          Push-Benachrichtigungen sind nicht aktiviert. Erlaube sie im Browser, damit Einstellungen wirksam werden.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: "0.8rem" }}>
          {error}
        </Alert>
      )}

      {!prefs ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Für dich
          </Typography>
          <Box sx={{ mt: 1, mb: 2 }}>
            {USER_PREFS.map(({ key, label }) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    size="small"
                    checked={prefs[key] ?? true}
                    onChange={() => handleToggle(key)}
                    disabled={saving}
                  />
                }
                label={<Typography variant="body2">{label}</Typography>}
                sx={{ display: "flex", justifyContent: "space-between", ml: 0, mr: 0, mb: 0.5 }}
                labelPlacement="start"
              />
            ))}
          </Box>

          {isAdmin && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Admin
              </Typography>
              <Box sx={{ mt: 1 }}>
                {ADMIN_PREFS.map(({ key, label }) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size="small"
                        checked={prefs[key] ?? true}
                        onChange={() => handleToggle(key)}
                        disabled={saving}
                      />
                    }
                    label={<Typography variant="body2">{label}</Typography>}
                    sx={{ display: "flex", justifyContent: "space-between", ml: 0, mr: 0, mb: 0.5 }}
                    labelPlacement="start"
                  />
                ))}
              </Box>
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
