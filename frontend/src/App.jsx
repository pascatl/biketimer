import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Box, Stack, Button, IconButton, Tooltip, Typography, CircularProgress, Collapse, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import Event from "./components/Event";
import TopBar from "./components/TopBar";
import InboxDrawer from "./components/InboxDrawer";
import AdminPanel from "./components/AdminPanel";
import StatsPanel from "./components/StatsPanel";
import Footer from "./components/Footer";
import {
	fetchMyEvents,
	fetchEvent,
	createEvent,
	fetchMyInvitations,
	fetchUsers,
	fetchJerseys,
	fetchSportTypes,
	fetchVapidPublicKey,
	subscribePush,
	registerMe,
} from "./api";
import { useAuth } from "./auth/AuthContext";
import { trackEvent } from "./matomo";
import { useWebSocket } from "./useWebSocket";

export default function App() {
	const { user, authenticated } = useAuth();
	const navigate = useNavigate();
	const { id: urlEventId } = useParams();

	const [currentEvents, setCurrentEvents] = useState([]);
	const [pastExpanded, setPastExpanded] = useState(false);
	const [invitations, setInvitations] = useState([]);
	const [allUsers, setAllUsers] = useState([]);
	const [jerseys, setJerseys] = useState([]);
	const [sportTypes, setSportTypes] = useState({});
	const [adminOpen, setAdminOpen] = useState(false);
	const [statsOpen, setStatsOpen] = useState(false);
	const [inboxOpen, setInboxOpen] = useState(false);
	// Incremented whenever invitations are refreshed → tells Event cards to reload
	const [eventRefreshKey, setEventRefreshKey] = useState(0);
	// Detail view
	const [detailEvent, setDetailEvent] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailError, setDetailError] = useState(null);
	// Push permission dialog
	const [pushDialogOpen, setPushDialogOpen] = useState(false);

	// WebSocket toast
	const [wsToast, setWsToast] = useState(null); // { message: string }

	const allowedDays = [5]; // Friday
	const default_startTime = "15:00";
	const defaultType = "rennrad";

	const defaultEvent = {
		id: null,
		event_data: {
			event_date: "",
			event_title: "",
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
		if (!authenticated) return;
		try {
			const data = await fetchMyEvents();
			const sorted = [...data].sort(
				(a, b) =>
					new Date(a.event_data?.event_date) -
					new Date(b.event_data?.event_date),
			);
			setCurrentEvents(sorted);
		} catch (err) {
			console.error("Fehler beim Laden der Events:", err);
		}
	}, [authenticated]);

	useEffect(() => {
		loadEvents();
	}, [loadEvents]);

	// ── Link Keycloak account to DB on login ─────────────────
	useEffect(() => {
		if (!authenticated) return;
		registerMe().catch(console.error);
	}, [authenticated]);

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

	// ── WebSocket: real-time updates replacing the 30 s poll ──
	const handleWsMessage = useCallback((data) => {
		// Backend already routes messages to the right users server-side
		// and excludes the actor. Just show the toast if there's a message.
		if (data.message) {
			setWsToast({ message: data.message });
		}

		const isEventChange =
			data.type?.startsWith("event_") ||
			data.type?.startsWith("invitation_");

		if (isEventChange) {
			// Reload the flat event list (dates, titles, member counts)
			loadEvents();
			// Bump the refresh key so every Event card reloads its internal
			// invitations and comments lists too
			setEventRefreshKey((k) => k + 1);
			// Also refresh the user's own invitation inbox
			if (authenticated) loadInvitations();
		}
	}, [loadEvents, loadInvitations, authenticated]);

	useWebSocket("/api/ws", handleWsMessage, authenticated);

	// ── Register for push notifications ───────────────────────
	const doRegisterPush = useCallback(async () => {
		try {
			if (!("serviceWorker" in navigator) || !("PushManager" in window))
				return;
			const vapidKey = await fetchVapidPublicKey();
			if (!vapidKey) return;

			// Request notification permission if not yet decided
			let permission = Notification.permission;
			if (permission === "default") {
				permission = await Notification.requestPermission();
			}
			if (permission !== "granted") return;

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
			localStorage.setItem("push_opted_in", "1");
		} catch (err) {
			console.log("Push registration skipped:", err.message);
		}
	}, []);

	useEffect(() => {
		if (!authenticated) return;
		// Already opted in: try to re-register silently (e.g. after re-login)
		if (localStorage.getItem("push_opted_in") === "1") {
			doRegisterPush();
			return;
		}
		// Already denied → don't ask again (guard: Notification is undefined on most iOS Safari contexts)
		if (typeof Notification !== "undefined" && Notification.permission === "denied") return;
		// Already stored a 'no' decision
		if (localStorage.getItem("push_dismissed") === "1") return;
		// Show our custom dialog (only if push is available + VAPID configured)
		const checkAndShow = async () => {
			if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
			const vapidKey = await fetchVapidPublicKey();
			if (!vapidKey) return;
			setPushDialogOpen(true);
		};
		checkAndShow();
	}, [authenticated, doRegisterPush]);

	// ── Derive simple lists for components ────────────────────
	const userNames = allUsers.map((u) => u.name).sort();
	const jerseyNames = jerseys.map((j) => j.name);

	// ── Split events into upcoming and past ───────────────────
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayMs = today.getTime();
	const upcomingEvents = currentEvents.filter(
		(e) => new Date(e.event_data?.event_date + "T00:00:00").getTime() >= todayMs,
	);
	// Reversed so most-recent past event appears first
	const pastEvents = currentEvents
		.filter((e) => new Date(e.event_data?.event_date + "T00:00:00").getTime() < todayMs)
		.reverse();

	// ── Load event for detail view when URL has /events/:id ───
	useEffect(() => {
		if (!urlEventId) {
			setDetailEvent(null);
			setDetailError(null);
			return;
		}
		setDetailLoading(true);
		setDetailError(null);
		fetchEvent(Number(urlEventId))
			.then((ev) => {
				setDetailEvent(ev);
				setDetailLoading(false);
			})
			.catch((err) => {
				setDetailError(err.message);
				setDetailLoading(false);
			});
	}, [urlEventId]);

	// Keep detail view in sync when the event list refreshes (e.g. via WebSocket)
	useEffect(() => {
		if (!detailEvent) return;
		const updated = currentEvents.find((e) => e.id === detailEvent.id);
		if (updated) setDetailEvent(updated);
	}, [currentEvents]); // eslint-disable-line react-hooks/exhaustive-deps

	// When a user opens an event detail: update URL
	const handleOpenDetail = (eventId) => {
		trackEvent("Event", "Geöffnet", String(eventId));
		navigate(`/events/${eventId}`);
	};

	// Back to list
	const handleBackToList = () => {
		navigate("/");
	};

	// ── Handlers ──────────────────────────────────────────────
	const handleAddEvent = async (event) => {
		try {
			const newEvent = await createEvent(event.event_data);
			trackEvent("Event", "Erstellt", event.event_data?.event_title);
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
				pb: "56px", // leave room for fixed footer
			}}
		>
			<TopBar
				currentEvents={currentEvents}
				onAddEvent={handleAddEvent}
				defaultEvent={defaultEvent}
				sportTypes={sportTypes}
				invitationCount={invitations.length}
				isAdmin={isAdmin}
				onAdminOpen={() => setAdminOpen(true)}
				onStatsOpen={() => { trackEvent("Navigation", "Statistiken geöffnet"); setStatsOpen(true); }}
				onInboxOpen={() => { trackEvent("Navigation", "Postfach geöffnet"); setInboxOpen(true); }}
			/>
			<Container maxWidth="md">
				{urlEventId ? (
					/* ── Detail view ── */
					<Box sx={{ mt: 3 }}>
						<Button
							onClick={handleBackToList}
							startIcon={<ArrowBackIcon />}
							size="small"
							sx={{
								mb: 2,
								color: "text.secondary",
								textTransform: "none",
								fontWeight: 500,
								fontSize: "0.85rem",
								"&:hover": { bgcolor: "rgba(45,60,89,0.06)" },
							}}
						>
							Event-Details
						</Button>
						{detailLoading && (
							<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
								<CircularProgress />
							</Box>
						)}
						{detailError && (
							<Typography color="error" sx={{ mt: 4, textAlign: "center" }}>
								{detailError}
							</Typography>
						)}
						{detailEvent && !detailLoading && (
							<Event
								data={detailEvent}
								default_users={userNames}
								default_jerseys={jerseyNames}
								default_types={sportTypes}
								allUsers={allUsers}
								onDeleteEvent={() => handleBackToList()}
								refreshToken={eventRefreshKey}
								onInvitationResponded={loadInvitations}
								isPast={new Date(detailEvent.event_data?.event_date + "T00:00:00").getTime() < todayMs}
							/>
						)}
					</Box>
				) : (
					/* ── Event list ── */
					<Stack spacing={2} sx={{ mt: 3 }}>
						{upcomingEvents.length === 0 && (
							<Box
								sx={{
									textAlign: "center",
									py: 6,
									px: 2,
									color: "text.secondary",
								}}
							>
								<Typography variant="body1" sx={{ fontWeight: 500 }}>
									Keine Events in Aussicht.
								</Typography>
								<Typography variant="body2" sx={{ mt: 1 }}>
									Erstelle doch einfach eines und lade andere dazu ein!
								</Typography>
							</Box>
						)}
						{upcomingEvents.map((event) => (
							<Event
								key={event.id}
								default_users={userNames}
								default_jerseys={jerseyNames}
								default_types={sportTypes}
								allUsers={allUsers}
								onDeleteEvent={handleDeleteEvent}
								data={event}
								refreshToken={eventRefreshKey}
								onInvitationResponded={loadInvitations}
								onOpenDetail={handleOpenDetail}
							/>
						))}

						{/* ── Past events collapsible section ── */}
						{pastEvents.length > 0 && (
							<Box>
								<Box
									onClick={() => setPastExpanded((v) => !v)}
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										cursor: "pointer",
										px: 1,
										py: 1,
										borderRadius: 2,
										"&:hover": { bgcolor: "rgba(45,60,89,0.05)" },
									}}
								>
									<HistoryIcon sx={{ fontSize: "1.1rem", color: "text.disabled" }} />
									<Typography
										variant="body2"
										sx={{ fontWeight: 600, color: "text.secondary", flex: 1 }}
									>
										Vergangene Events
									</Typography>
									<Chip
										label={pastEvents.length}
										size="small"
										sx={{
											height: 20,
											fontSize: "0.7rem",
											fontWeight: 700,
											bgcolor: "rgba(45,60,89,0.1)",
											color: "text.secondary",
										}}
									/>
									<ExpandMoreIcon
										sx={{
											fontSize: "1.2rem",
											color: "text.disabled",
											transition: "transform 0.2s",
											transform: pastExpanded ? "rotate(180deg)" : "rotate(0deg)",
										}}
									/>
								</Box>
								<Collapse in={pastExpanded}>
									<Stack spacing={2} sx={{ mt: 1 }}>
										{pastEvents.map((event) => (
											<Event
												key={event.id}
												default_users={userNames}
												default_jerseys={jerseyNames}
												default_types={sportTypes}
												allUsers={allUsers}
												onDeleteEvent={handleDeleteEvent}
												data={event}
												isPast={true}
												refreshToken={eventRefreshKey}
												onInvitationResponded={loadInvitations}
												onOpenDetail={handleOpenDetail}
											/>
										))}
									</Stack>
								</Collapse>
							</Box>
						)}
					</Stack>
				)}
			</Container>

			{isAdmin && <AdminPanel open={adminOpen} onClose={handleAdminClose} />}

			{authenticated && (
				<StatsPanel open={statsOpen} onClose={() => setStatsOpen(false)} />
			)}

			{authenticated && (
				<InboxDrawer
					open={inboxOpen}
					onClose={() => setInboxOpen(false)}
					invitations={invitations}
					onRefresh={loadInvitations}
				/>
			)}

			<Footer />

			{/* WebSocket update toast */}
			<Snackbar
				open={!!wsToast}
				autoHideDuration={5000}
				onClose={() => setWsToast(null)}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
			>
				<Alert
					onClose={() => setWsToast(null)}
					severity="info"
					variant="filled"
					sx={{ width: "100%", borderRadius: 2 }}
				>
					{wsToast?.message}
				</Alert>
			</Snackbar>

			{/* Push permission dialog */}
			<Dialog
				open={pushDialogOpen}
				onClose={() => {
					localStorage.setItem("push_dismissed", "1");
					setPushDialogOpen(false);
				}}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: { borderRadius: 3 } }}
			>
				<DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<NotificationsIcon sx={{ color: "warning.main" }} />
					Benachrichtigungen
				</DialogTitle>
				<DialogContent>
					<Typography variant="body2" sx={{ color: "text.secondary" }}>
						Möchtest du Push-Benachrichtigungen erhalten, wenn du zu einem Event eingeladen wirst?
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						onClick={() => {
							localStorage.setItem("push_dismissed", "1");
							setPushDialogOpen(false);
						}}
						color="inherit"
						sx={{ color: "text.secondary" }}
					>
						Nein danke
					</Button>
					<Button
						variant="contained"
						disableElevation
						onClick={() => {
							setPushDialogOpen(false);
							doRegisterPush();
						}}
						sx={{ borderRadius: 2 }}
					>
						Aktivieren
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}