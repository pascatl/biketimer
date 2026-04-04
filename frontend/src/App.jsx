import React, { useCallback, useEffect, useState } from "react";
import { Container, Box, Stack } from "@mui/material";
import Event from "./components/Event";
import TopBar from "./components/TopBar";
import InvitationsBanner from "./components/InvitationsBanner";
import AdminPanel from "./components/AdminPanel";
import StatsPanel from "./components/StatsPanel";
import {
	fetchEvents,
	createEvent,
	fetchMyInvitations,
	fetchUsers,
	fetchJerseys,
	fetchSportTypes,
	fetchVapidPublicKey,
	subscribePush,
} from "./api";
import { useAuth } from "./auth/AuthContext";

export default function App() {
	const { user, authenticated } = useAuth();
	const [currentEvents, setCurrentEvents] = useState([]);
	const [invitations, setInvitations] = useState([]);
	const [allUsers, setAllUsers] = useState([]);
	const [jerseys, setJerseys] = useState([]);
	const [sportTypes, setSportTypes] = useState({});
	const [adminOpen, setAdminOpen] = useState(false);
	const [statsOpen, setStatsOpen] = useState(false);

	const allowedDays = [5]; // Friday
	const default_startTime = "15:00";
	const defaultType = "rennrad";

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

	// ── Load users from DB ────────────────────────────────────
	const loadUsers = useCallback(async () => {
		try {
			const data = await fetchUsers();
			setAllUsers(data);
		} catch (err) {
			console.error("Fehler beim Laden der Benutzer:", err);
		}
	}, []);

	// ── Load jerseys from DB ──────────────────────────────────
	const loadJerseys = useCallback(async () => {
		try {
			const data = await fetchJerseys();
			setJerseys(data);
		} catch (err) {
			console.error("Fehler beim Laden der Trikots:", err);
		}
	}, []);

	// ── Load sport types from DB ──────────────────────────────
	const loadSportTypes = useCallback(async () => {
		try {
			const data = await fetchSportTypes();
			const typesMap = {};
			data.forEach((t) => {
				typesMap[t.key] = {
					label: t.label,
					icon: t.icon,
					color: t.color,
				};
			});
			setSportTypes(typesMap);
		} catch (err) {
			console.error("Fehler beim Laden der Sportarten:", err);
		}
	}, []);

	useEffect(() => {
		loadUsers();
		loadJerseys();
		loadSportTypes();
	}, [loadUsers, loadJerseys, loadSportTypes]);

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

	// ── Register for push notifications ───────────────────────
	useEffect(() => {
		if (!authenticated) return;
		const registerPush = async () => {
			try {
				if (!("serviceWorker" in navigator) || !("PushManager" in window))
					return;
				const vapidKey = await fetchVapidPublicKey();
				if (!vapidKey) return;

				const reg = await navigator.serviceWorker.ready;
				let sub = await reg.pushManager.getSubscription();
				if (!sub) {
					const urlBase64ToUint8Array = (base64String) => {
						const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
						const base64 = (base64String + padding)
							.replace(/-/g, "+")
							.replace(/_/g, "/");
						const rawData = window.atob(base64);
						return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
					};
					sub = await reg.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(vapidKey),
					});
				}
				await subscribePush(sub);
			} catch (err) {
				console.log("Push registration skipped:", err.message);
			}
		};
		registerPush();
	}, [authenticated]);

	// ── Derive simple lists for components ────────────────────
	const userNames = allUsers.map((u) => u.name).sort();
	const jerseyNames = jerseys.map((j) => j.name);

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

	const handleAdminClose = () => {
		setAdminOpen(false);
		// Reload data after admin changes
		loadUsers();
		loadJerseys();
		loadSportTypes();
	};

	const isAdmin = user?.is_admin || false;

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
				isAdmin={isAdmin}
				onAdminOpen={() => setAdminOpen(true)}
				onStatsOpen={() => setStatsOpen(true)}
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
							default_users={userNames}
							default_jerseys={jerseyNames}
							default_types={sportTypes}
							allUsers={allUsers}
							onDeleteEvent={handleDeleteEvent}
							data={event}
						/>
					))}
				</Stack>
			</Container>

			{isAdmin && <AdminPanel open={adminOpen} onClose={handleAdminClose} />}

			{authenticated && (
				<StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)} />
			)}
		</Box>
	);
}
