import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { respondInvitation } from "../api";

function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default function InvitationsBanner({ invitations, onRefresh }) {
  const [loading, setLoading] = useState({});
  const [feedback, setFeedback] = useState(null); // { type, message }

  if (!invitations || invitations.length === 0) return null;

  const handle = async (invId, action) => {
    setLoading((l) => ({ ...l, [invId]: true }));
    try {
      await respondInvitation(invId, action);
      setFeedback({
        type: "success",
        message: action === "accept" ? "Einladung angenommen!" : "Einladung abgelehnt.",
      });
      onRefresh();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setLoading((l) => ({ ...l, [invId]: false }));
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Collapse in={!!feedback} unmountOnExit>
        <Alert
          severity={feedback?.type}
          onClose={() => setFeedback(null)}
          sx={{ mb: 1.5, borderRadius: 2 }}
        >
          {feedback?.message}
        </Alert>
      </Collapse>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(229,186,65,0.5)",
          bgcolor: "rgba(229,186,65,0.07)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.25,
            display: "flex",
            alignItems: "center",
            gap: 1,
            borderBottom: "1px solid rgba(229,186,65,0.25)",
          }}
        >
          <MailOutlineIcon sx={{ color: "#E5BA41", fontSize: 20 }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: "primary.main", letterSpacing: 0.5 }}
          >
            Offene Einladungen
          </Typography>
          <Chip
            label={invitations.length}
            size="small"
            sx={{ bgcolor: "#E5BA41", color: "#2D3C59", fontWeight: 700, height: 20, ml: 0.5 }}
          />
        </Box>

        <Stack divider={<Divider />}>
          {invitations.map((inv) => {
            const eventDate = inv.event_data?.event_date;
            const eventType = inv.event_data?.event_type || "Event";
            const isLoading = loading[inv.id];
            return (
              <Box
                key={inv.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {formatDate(eventDate)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {eventType.charAt(0).toUpperCase() + eventType.slice(1)} · eingeladen von{" "}
                    <strong>{inv.inviter_name || "Unbekannt"}</strong>
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 0.75 }}>
                  <Button
                    size="small"
                    variant="contained"
                    disableElevation
                    disabled={isLoading}
                    startIcon={<CheckCircleOutlineIcon sx={{ fontSize: "1rem !important" }} />}
                    onClick={() => handle(inv.id, "accept")}
                    sx={{
                      bgcolor: "#E5BA41",
                      color: "#2D3C59",
                      fontWeight: 700,
                      borderRadius: 1.5,
                      fontSize: "0.78rem",
                      "&:hover": { bgcolor: "#d4a92e" },
                    }}
                  >
                    Annehmen
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={isLoading}
                    startIcon={<CancelOutlinedIcon sx={{ fontSize: "1rem !important" }} />}
                    onClick={() => handle(inv.id, "decline")}
                    sx={{
                      borderColor: "rgba(45,60,89,0.3)",
                      color: "text.secondary",
                      fontWeight: 600,
                      borderRadius: 1.5,
                      fontSize: "0.78rem",
                    }}
                  >
                    Ablehnen
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
}
