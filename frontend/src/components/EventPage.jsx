import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Container,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchEvent, fetchJerseys, fetchSportTypes, fetchUsers } from "../api";
import Event from "./Event";

export default function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [jerseys, setJerseys] = useState([]);
  const [sportTypes, setSportTypes] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchEvent(Number(id)),
      fetchJerseys(),
      fetchSportTypes(),
      fetchUsers(),
    ])
      .then(([ev, j, st, u]) => {
        setEvent(ev);
        setJerseys(j.map((x) => x.name));
        const typesMap = {};
        st.forEach((t) => {
          typesMap[t.key] = { label: t.label, icon: t.icon, color: t.color };
        });
        setSportTypes(typesMap);
        setAllUsers(u);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const userNames = allUsers.map((u) => u.name).sort();

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pt: 3, pb: 6 }}>
      <Container maxWidth="md">
        {/* Back button */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
          <Tooltip title="Zurück zur Liste">
            <IconButton onClick={() => navigate(-1)} size="small">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" color="text.secondary">
            Event-Details
          </Typography>
        </Box>

        <Event
          data={event}
          default_users={userNames}
          default_jerseys={jerseys}
          default_types={sportTypes}
          allUsers={allUsers}
          onDeleteEvent={() => navigate(-1)}
        />
      </Container>
    </Box>
  );
}
