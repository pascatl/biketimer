import React, { useCallback, useEffect, useState } from "react";
import { Container, Box, Stack } from "@mui/material";
import Event from "./components/Event";
import TopBar from "./components/TopBar";
import InvitationsBanner from "./components/InvitationsBanner";
import { fetchEvents, createEvent, fetchMyInvitations } from "./api";
import {
	faMountain,
	faRoad,
	faBaseball,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "./auth/AuthContext";

export default function App() {
	const { user, authenticated } = useAuth();
	const [currentEvents, setCurrentEvents] = useState([]);
	const [invitations, setInvitations] = useState([]);

	const allowedDays = [5]; // Friday
	const default_startTime = "15:00";
	const defaultType = "rennrad";

	const default_users = [
		"Pascal",
		"Flo",
		"Jan",
		"Max B.",
		"Jonas",
		"Samuel",
		"Tom",
		"Alex",
		"David",
		"Max H.",
		"Gil",
		"Tim",
		"Miri",
	].sort();

	const default_types = {
		rennrad: { alias: "Rennrad", icon: faRoad },
		mtb: { alias: "MTB", icon: faMountain },
		squash: { alias: "Squash", icon: faBaseball },
	};

	const jerseys = [
		"McDonalds",
		"FDJ",
		"Deutschlandtour",
		"Dr. Kamm",
		"Cofidis",
		"HTC",
		"freie Auswahl",
	];

	const defaultEvent = {
		id: null,
		event_data: {
			event_date: "",
			event_startTime: default_startTime,
			event_members: [],
			event_no_members: [],
			event_leader: "",
			event_jersey: "",
			event_type: defaultType,
			event_comment: "",
			event_link: "",
		},
	};

	// ── Load events ───────────────────────────────────────────
	const loadEvents = useCallback(async () => {
		try {
			const data = await fetchEvents();
			const sorted = [...data].sort(
				(a, b) =>
					new Date(a.event_data?.event_date) -
					new Date(b.event_data?.event_date),
			);
			setCurrentEvents(sorted);
		} catch (err) {
			console.error("Fehler beim Laden der Events:", err);
		}
	}, []);

	useEffect(() => {
		loadEvents();
	}, [loadEvents]);

	// ── Load invitations (only when logged in) ────────────────
	const loadInvitations = useCallback(async () => {
		if (!authenticated) return;
		try {
			const data = await fetchMyInvitations();
			setInvitations(data);
		} catch (err) {
			console.error("Fehler beim Laden der Einladungen:", err);
		}
	}, [authenticated]);

	useEffect(() => {
		loadInvitations();
	}, [loadInvitations]);

	// ── Handlers ──────────────────────────────────────────────
	const handleAddEvent = async (event) => {
		try {
			const newEvent = await createEvent(event.event_data);
			setCurrentEvents((prev) =>
				[...prev, newEvent].sort(
					(a, b) =>
						new Date(a.event_data?.event_date) -
						new Date(b.event_data?.event_date),
				),
			);
		} catch (err) {
			console.error("Fehler beim Hinzufügen:", err);
			alert(err.message);
		}
	};

	const handleDeleteEvent = (eventId) => {
		setCurrentEvents((prev) => prev.filter((e) => e.id !== eventId));
	};

	return (
		<Box
			sx={{
				bgcolor: "background.default",
				minHeight: "100vh",
				pt: "72px",
				pb: 5,
			}}
		>
			<TopBar
				currentEvents={currentEvents}
				onAddEvent={handleAddEvent}
				defaultEvent={defaultEvent}
				invitationCount={invitations.length}
			/>
			<Container maxWidth="md">
				<Stack spacing={2} sx={{ mt: 3 }}>
					{authenticated && invitations.length > 0 && (
						<InvitationsBanner
							invitations={invitations}
							onRefresh={loadInvitations}
						/>
					)}
					{currentEvents.map((event) => (
						<Event
							key={event.id}
							default_users={default_users}
							default_jerseys={jerseys}
							default_types={default_types}
							onDeleteEvent={handleDeleteEvent}
							data={event}
						/>
					))}
				</Stack>
			</Container>
		</Box>
	);
}
