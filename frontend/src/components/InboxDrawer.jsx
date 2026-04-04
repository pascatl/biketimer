import React, { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { respondInvitation } from "../api";

function formatDate(isoDate) {
  if (!isoDate) return "Kein Datum";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Small trigger button shown in the TopBar. */
export function InboxButton({ count, onClick }) {
  return (
    <Tooltip
      title={
        count > 0
          ? `${count} offene Einladung${count > 1 ? "en" : ""}`
          : "Postfach"
      }
    >
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          color: "rgba(255,255,255,0.85)",
          "&:hover": { color: "#E5BA41", bgcolor: "rgba(255,255,255,0.08)" },
        }}
      >
        <Badge
          badgeContent={count || 0}
          color="warning"
          invisible={count === 0}
          sx={{ "& .MuiBadge-badge": { fontSize: "0.65rem", minWidth: 16, height: 16 } }}
        >
          <MailOutlineIcon sx={{ fontSize: 22 }} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

/** Side drawer showing pending invitations. */
export default function InboxDrawer({ open, onClose, invitations, onRefresh }) {
  const [loading, setLoading] = useState({});
  const [feedback, setFeedback] = useState(null);

  const handle = async (invId, action) => {
    setLoading((l) => ({ ...l, [invId]: true }));
    try {
      await respondInvitation(invId, action);
      setFeedback({
        type: "success",
        message:
          action === "accept" ? "Einladung angenommen!" : "Einladung abgelehnt.",
      });
      onRefresh();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading((l) => ({ ...l, [invId]: false }));
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100vw", sm: 380 },
          bgcolor: "background.default",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: "primary.main",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <MailOutlineIcon sx={{ color: "#E5BA41", fontSize: 22 }} />
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, flex: 1, fontSize: "1rem" }}>
          Postfach
        </Typography>
        {invitations.length > 0 && (
          <Chip
            label={invitations.length}
            size="small"
            sx={{ bgcolor: "#E5BA41", color: "#2D3C59", fontWeight: 700, height: 20 }}
          />
        )}
        <IconButton size="small" onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Feedback ── */}
      <Collapse in={!!feedback} unmountOnExit>
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Alert
            severity={feedback?.type}
            onClose={() => setFeedback(null)}
            sx={{ borderRadius: 2 }}
          >
            {feedback?.message}
          </Alert>
        </Box>
      </Collapse>

      {/* ── Body ── */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {invitations.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 220,
              gap: 1.5,
              color: "text.disabled",
            }}
          >
            <MailOutlineIcon sx={{ fontSize: 48, opacity: 0.3 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Keine offenen Einladungen
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider sx={{ borderColor: "rgba(45,60,89,0.07)" }} />}>
            {invitations.map((inv) => {
              const isLoading = loading[inv.id];
              const date = inv.event_data?.event_date;
              const type = inv.event_data?.event_type || "Event";

              return (
                <Box key={inv.id} sx={{ px: 2.5, py: 2 }}>
                  {/* Date */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                    <EventIcon
                      sx={{ fontSize: 15, color: "#E5BA41", flexShrink: 0 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {formatDate(date)}
                    </Typography>
                  </Box>

                  {/* Type + inviter */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
                    <PersonOutlineIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)} · eingeladen von{" "}
                      <strong>{inv.inviter_name || "Unbekannt"}</strong>
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      disableElevation
                      disabled={isLoading}
                      startIcon={
                        <CheckCircleOutlineIcon sx={{ fontSize: "0.95rem !important" }} />
                      }
                      onClick={() => handle(inv.id, "accept")}
                      sx={{
                        bgcolor: "#94A378",
                        color: "#fff",
                        fontWeight: 700,
                        borderRadius: 1.5,
                        fontSize: "0.78rem",
                        flex: 1,
                        "&:hover": { bgcolor: "#7a8f61" },
                      }}
                    >
                      Annehmen
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={isLoading}
                      startIcon={
                        <CancelOutlinedIcon sx={{ fontSize: "0.95rem !important" }} />
                      }
                      onClick={() => handle(inv.id, "decline")}
                      sx={{
                        borderColor: "#D1855C",
                        color: "#D1855C",
                        fontWeight: 600,
                        borderRadius: 1.5,
                        fontSize: "0.78rem",
                        flex: 1,
                        "&:hover": { bgcolor: "rgba(209,133,92,0.08)" },
                      }}
                    >
                      Ablehnen
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
