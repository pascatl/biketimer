import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	Autocomplete,
	Avatar,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	Checkbox,
	Chip,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Menu,
	MenuItem,
	Snackbar,
	Alert,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import LandscapeIcon from "@mui/icons-material/Landscape";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import PersonIcon from "@mui/icons-material/Person";
import RouteWidget from "./RouteWidget";
import {
	updateEvent as apiUpdateEvent,
	deleteEvent as apiDeleteEvent,
	inviteUsersToEvent,
	fetchEventInvitations,
	respondInvitation,
	revokeInvitation,
	withdrawInvitation,
} from "../api";
import { useAuth } from "../auth/AuthContext";

const ICON_MAP = {
	DirectionsBike: <DirectionsBikeIcon />,
	Landscape: <LandscapeIcon />,
	SportsTennis: <SportsTennisIcon />,
};

const DEFAULT_TYPE_META = {
	label: "Event",
	icon: <DirectionsBikeIcon />,
	color: "#2D3C59",
};

export default function Event(props) {
	const event_data = props.data.event_data;
	const { authenticated, user } = useAuth();

	const [date, setDate] = useState(event_data.event_date);
	const [eventId] = useState(props.data.id);
	const [startTime, setStartTime] = useState(event_data.event_startTime);
	const [comment, setComment] = useState(event_data.event_comment);
	const [link, setLink] = useState(event_data.event_link);
	const [leader, setLeader] = useState(event_data.event_leader);
	const [jersey, setJersey] = useState(event_data.event_jersey);
	const [eventType, setEventType] = useState(
		event_data.event_type || "rennrad",
	);
	const [editMode, setEditMode] = useState(false);
	const [currentEvent, setCurrentEvent] = useState(props.data);
	const [leaderAnchor, setLeaderAnchor] = useState(null);
	const [jerseyAnchor, setJerseyAnchor] = useState(null);
	const [inviteOpen, setInviteOpen] = useState(false);
	const [inviteLoading, setInviteLoading] = useState(false);
	const [inviteError, setInviteError] = useState("");
	const [inviteSearch, setInviteSearch] = useState("");

	const [invitations, setInvitations] = useState([]);
	const [myInvitation, setMyInvitation] = useState(null);

	// Withdrawal dialog
	const [withdrawOpen, setWithdrawOpen] = useState(false);
	const [withdrawReason, setWithdrawReason] = useState("");
	const [withdrawLoading, setWithdrawLoading] = useState(false);

	// Toast notification
	const [toast, setToast] = useState(null); // { message, severity }

	const isMounted = useRef(false);

	const default_users = props.default_users || [];
	const default_types = props.default_types || {};
	const default_jerseys = props.default_jerseys || [];
	const allUsers = props.allUsers || [];
	const refreshToken = props.refreshToken;
	const onInvitationResponded = props.onInvitationResponded; // notify parent

	// Edit permission: creator or current organizer
	const canEdit =
		authenticated &&
		(user?.sub === props.data.creator_keycloak_id ||
			(leader && (user?.name === leader || user?.preferred_username === leader)));

	// Exclude logged-in user from invite list
	const invitableUsers = allUsers.filter((u) => {
		if (user?.sub && u.keycloak_id === user.sub) return false;
		if (user?.email && u.email === user.email) return false;
		return true;
	});

	// Build type meta from DB sport types
	const getTypeMeta = (key) => {
		const t = default_types[key];
		if (t) {
			return {
				label: t.label || t.alias || key,
				icon: ICON_MAP[t.icon] || <DirectionsBikeIcon />,
				color: t.color || "#2D3C59",
			};
		}
		return DEFAULT_TYPE_META;
	};

	const typeMeta = getTypeMeta(eventType);

	const convertDate = (input_date) => {
		const d = Date.parse(input_date);
		return [
			new Date(d).toLocaleDateString("de-DE", { weekday: "long" }),
			new Date(d).toLocaleDateString("de-DE", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}),
		];
	};

	const loadInvitations = useCallback(async () => {
		const list = await fetchEventInvitations(eventId);
		setInvitations(list);
		if (user?.email || user?.sub) {
			setMyInvitation(
				list.find(
					(i) =>
						(user.sub && i.invitee_keycloak_id === user.sub) ||
						(user.email && i.invitee_email === user.email),
				) ?? null,
			);
		}
	}, [eventId, user?.email, user?.sub]);

	useEffect(() => {
		loadInvitations();
	}, [loadInvitations, refreshToken]); // re-fetch whenever parent signals a refresh

	const handleRespond = async (action) => {
		if (!myInvitation) return;
		try {
			await respondInvitation(myInvitation.id, action);
			await loadInvitations();
			// Also notify App.jsx so global inbox + all other event cards refresh
			onInvitationResponded?.();
		} catch (err) {
			console.error(err);
		}
	};

	const handleRevoke = async (invId) => {
		try {
			await revokeInvitation(invId);
			await loadInvitations();
		} catch (err) {
			console.error(err);
		}
	};

	const handleWithdraw = async () => {
		if (!myInvitation) return;
		setWithdrawLoading(true);
		try {
			await withdrawInvitation(myInvitation.id, withdrawReason);
			setWithdrawOpen(false);
			setWithdrawReason("");
			await loadInvitations();
			onInvitationResponded?.();
		} catch (err) {
			console.error(err);
		} finally {
			setWithdrawLoading(false);
		}
	};

	const handleSave = () => {
		setCurrentEvent({
			id: eventId,
			event_data: {
				event_date: date,
				event_startTime: startTime,
				event_leader: leader,
				event_jersey: jersey,
				event_type: eventType,
				event_comment: comment,
				event_link: link,
			},
		});
	};

	useEffect(() => {
		if (isMounted.current) {
			setToast({ message: "Gespeichert ✓", severity: "success" });
			updateEvent();
			setEditMode(false);
		} else {
			isMounted.current = true;
		}
	}, [currentEvent]);

	const updateEvent = () => {
		apiUpdateEvent(eventId, currentEvent.event_data).catch(console.error);
	};

	const handleDelete = () => {
		apiDeleteEvent(eventId)
			.then(() => props.onDeleteEvent(eventId))
			.catch(console.error);
	};

	const [selectedInvitees, setSelectedInvitees] = useState([]);

	const handleInviteSubmit = async () => {
		if (selectedInvitees.length === 0) return;
		setInviteLoading(true);
		setInviteError("");
		try {
			const ids = selectedInvitees.map((u) => u.id);
			const res = await inviteUsersToEvent(eventId, ids);
			const sent = res?.sent ?? ids.length;
			handleInviteClose();
			setToast({
				message: `${sent} Einladung${sent !== 1 ? "en" : ""} gesendet!`,
				severity: "success",
			});
			await loadInvitations();
		} catch (err) {
			setInviteError(err.message);
		} finally {
			setInviteLoading(false);
		}
	};

	const handleInviteClose = () => {
		setInviteOpen(false);
		setInviteError("");
		setSelectedInvitees([]);
		setInviteSearch("");
	};

	const toggleInvitee = (user) => {
		setSelectedInvitees((prev) =>
			prev.find((u) => u.id === user.id)
				? prev.filter((u) => u.id !== user.id)
				: [...prev, user],
		);
	};

	const toggleAllInvitees = () => {
		if (selectedInvitees.length === invitableUsers.length) {
			setSelectedInvitees([]);
		} else {
			setSelectedInvitees([...invitableUsers]);
		}
	};

	// Build jersey names list for display
	const jerseyNames = default_jerseys.map((j) =>
		typeof j === "string" ? j : j.name,
	);

	const hasBody =
		invitations.length > 0 ||
		myInvitation !== null ||
		!!comment ||
		!!link ||
		editMode;

	return (
		<>
			<Card
				elevation={0}
				sx={{
					borderRadius: "10px",
					border: "1px solid rgba(45,60,89,0.1)",
					overflow: "hidden",
					transition: "box-shadow 0.2s",
					"&:hover": { boxShadow: "0 4px 20px rgba(45,60,89,0.12)" },
				}}
			>
				{/* ── Farbiger Akzentstreifen oben ── */}
				<Box sx={{ height: 4, bgcolor: typeMeta.color }} />

				{/* ── Header ── */}
				<CardHeader
					avatar={
						editMode ? (
							<>
								<Tooltip title="Typ ändern">
									<Avatar
										sx={{
											bgcolor: typeMeta.color,
											cursor: "pointer",
											width: 48,
											height: 48,
											boxShadow: `0 2px 8px ${typeMeta.color}55`,
										}}
										onClick={(e) => setTypeAnchor(e.currentTarget)}
									>
										{typeMeta.icon}
									</Avatar>
								</Tooltip>
								<Menu
									anchorEl={typeAnchor}
									open={Boolean(typeAnchor)}
									onClose={() => setTypeAnchor(null)}
									PaperProps={{
										sx: {
											borderRadius: 2,
											boxShadow: "0 4px 20px rgba(45,60,89,0.15)",
										},
									}}
								>
									{Object.entries(default_types).map(([key, val]) => (
										<MenuItem
											key={key}
											selected={key === eventType}
											onClick={() => {
												setEventType(key);
												setTypeAnchor(null);
											}}
											sx={{
												fontFamily: '"Josefin Sans", sans-serif',
												fontWeight: key === eventType ? 700 : 400,
											}}
										>
											{val.label || val.alias}
										</MenuItem>
									))}
								</Menu>
							</>
						) : (
							<Tooltip title={typeMeta.label}>
								<Avatar
									sx={{
										bgcolor: typeMeta.color,
										width: 48,
										height: 48,
										boxShadow: `0 2px 8px ${typeMeta.color}44`,
									}}
								>
									{typeMeta.icon}
								</Avatar>
							</Tooltip>
						)
					}
					title={
						editMode ? (
							<Box
								sx={{
									display: "flex",
									gap: 1.5,
									flexWrap: "wrap",
									alignItems: "center",
								}}
							>
								<TextField
									label="Datum"
									type="date"
									size="small"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									InputLabelProps={{ shrink: true }}
									sx={{ maxWidth: 160 }}
								/>
								<TextField
									label="Uhrzeit"
									type="time"
									size="small"
									value={startTime}
									onChange={(e) => setStartTime(e.target.value)}
									InputLabelProps={{ shrink: true }}
									sx={{ maxWidth: 130 }}
								/>
							</Box>
						) : (
							<Box>
								<Typography
									variant="overline"
									sx={{
										color: typeMeta.color,
										fontWeight: 700,
										letterSpacing: 1.5,
										lineHeight: 1,
										fontSize: "0.68rem",
									}}
								>
									{date ? convertDate(date)[0] : ""}
								</Typography>
								<Typography
									variant="h5"
									sx={{
										fontWeight: 700,
										lineHeight: 1.15,
										color: "text.primary",
										mt: 0.25,
									}}
								>
									{date ? convertDate(date)[1] : "Kein Datum"}
								</Typography>
								<Typography
									variant="body2"
									sx={{ color: "text.secondary", mt: 0.25 }}
								>
									{startTime || "Uhrzeit offen"}
								</Typography>
							</Box>
						)
					}
					action={
						<Box
							sx={{
								display: "flex",
								gap: 0.75,
								alignItems: "center",
								flexWrap: "wrap",
								mt: 1,
								mr: 0.5,
								maxWidth: 260,
								justifyContent: "flex-end",
							}}
						>
							{editMode ? (
								<>
									<Chip
										icon={
											<EmojiPeopleIcon
												sx={{ fontSize: "0.95rem !important" }}
											/>
										}
										label={leader || "Organisator"}
										onClick={(e) => setLeaderAnchor(e.currentTarget)}
										variant="outlined"
										size="small"
										clickable
										sx={{
											borderColor: "primary.main",
											color: "primary.main",
											fontWeight: 600,
										}}
									/>
									<Menu
										anchorEl={leaderAnchor}
										open={Boolean(leaderAnchor)}
										onClose={() => setLeaderAnchor(null)}
										PaperProps={{ sx: { borderRadius: 2 } }}
									>
										{default_users.map((user) => (
											<MenuItem
												key={user}
												selected={user === leader}
												onClick={() => {
													setLeader(user);
													setLeaderAnchor(null);
												}}
												sx={{ fontFamily: '"Josefin Sans", sans-serif' }}
											>
												{user}
											</MenuItem>
										))}
									</Menu>
									<Chip
										icon={
											<CheckroomIcon sx={{ fontSize: "0.95rem !important" }} />
										}
										label={jersey || "Trikot"}
										onClick={(e) => setJerseyAnchor(e.currentTarget)}
										variant="outlined"
										size="small"
										clickable
										sx={{
											borderColor: "text.secondary",
											color: "text.secondary",
											fontWeight: 600,
										}}
									/>
									<Menu
										anchorEl={jerseyAnchor}
										open={Boolean(jerseyAnchor)}
										onClose={() => setJerseyAnchor(null)}
										PaperProps={{ sx: { borderRadius: 2 } }}
									>
										{jerseyNames.map((j) => (
											<MenuItem
												key={j}
												selected={j === jersey}
												onClick={() => {
													setJersey(j);
													setJerseyAnchor(null);
												}}
												sx={{ fontFamily: '"Josefin Sans", sans-serif' }}
											>
												{j}
											</MenuItem>
										))}
									</Menu>
								</>
							) : (
								<>
									{leader && (
										<Chip
											icon={
												<EmojiPeopleIcon
													sx={{ fontSize: "1.5rem !important" }}
												/>
											}
											label={leader}
											variant="outlined"
											sx={{
												borderColor: "primary.main",
												color: "primary.main",
												fontWeight: 700,
												height: 44,
												px: 0.5,
												"& .MuiChip-label": { fontSize: "1.05rem", px: 1.5 },
												"& .MuiChip-icon": { fontSize: "1.5rem" },
											}}
										/>
									)}
									{jersey && (
										<Chip
											icon={
												<CheckroomIcon sx={{ fontSize: "1.5rem !important" }} />
											}
											label={jersey}
											sx={{
												bgcolor: "#E5BA41",
												color: "#2D3C59",
												fontWeight: 700,
												border: "none",
												height: 44,
												px: 0.5,
												"& .MuiChip-label": { fontSize: "1.05rem", px: 1.5 },
												"& .MuiChip-icon": {
													fontSize: "1.5rem",
													color: "#2D3C59",
												},
											}}
										/>
									)}
								</>
							)}
							{authenticated && (
								<Tooltip title="Person einladen">
									<IconButton
										size="small"
										onClick={() => setInviteOpen(true)}
										sx={{
											color: "text.secondary",
											"&:hover": {
												bgcolor: "rgba(45,60,89,0.08)",
												color: "primary.main",
											},
										}}
									>
										<PersonAddAltIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
							{canEdit && !editMode && (
								<Tooltip title="Bearbeiten">
									<IconButton
										size="small"
										onClick={() => setEditMode(true)}
										sx={{
											ml: 0.5,
											color: "text.secondary",
											"&:hover": {
												bgcolor: "rgba(45,60,89,0.08)",
												color: "primary.main",
											},
										}}
									>
										<EditIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
						</Box>
					}
					sx={{ pb: hasBody ? 0 : 2, pt: 2 }}
				/>

				{/* ── Body ── */}
				{hasBody && (
					<CardContent sx={{ pt: 1, pb: hasBody ? 2 : 0 }}>
						{/* Einladungen: Statusanzeige */}
						{invitations.length > 0 && (
							<Box
								sx={{
									display: "flex",
									flexWrap: "wrap",
									gap: 0.75,
									mt: 0.5,
									mb: 0.5,
								}}
							>
								{invitations.map((inv) => {
									const label =
										inv.invitee_name || inv.invitee_email.split("@")[0];
									// Only the inviter can revoke an invitation
									const canRevoke =
										authenticated && user?.sub === inv.inviter_keycloak_id;
									const reasonTip = inv.decline_reason
										? `Absage: ${inv.decline_reason}`
										: null;

									if (inv.status === "accepted") {
										return (
											<Chip
												key={inv.id}
												label={label}
												size="small"
												icon={
													<HowToRegIcon
														sx={{ fontSize: "0.95rem !important" }}
													/>
												}
												onDelete={
													canRevoke ? () => handleRevoke(inv.id) : undefined
												}
												deleteIcon={
													canRevoke ? (
														<CloseIcon
															sx={{ fontSize: "0.85rem !important" }}
														/>
													) : undefined
												}
												sx={{
													bgcolor: "#94A378",
													color: "#fff",
													fontWeight: 600,
													fontSize: "0.75rem",
													"& .MuiChip-deleteIcon": {
														color: "rgba(255,255,255,0.7)",
														"&:hover": { color: "#fff" },
													},
												}}
											/>
										);
									}
									if (inv.status === "declined" || inv.status === "withdrawn") {
										return (
											<Tooltip
												key={inv.id}
												title={reasonTip || (inv.status === "withdrawn" ? "Abgesagt" : "")}
											>
												<Chip
													label={label}
													size="small"
													variant="outlined"
													onDelete={
														canRevoke ? () => handleRevoke(inv.id) : undefined
													}
													deleteIcon={
														canRevoke ? (
															<CloseIcon
																sx={{ fontSize: "0.85rem !important" }}
															/>
														) : undefined
													}
													sx={{
														borderColor: "#D1855C",
														color: "#D1855C",
														fontWeight: 600,
														fontSize: "0.75rem",
														"& .MuiChip-deleteIcon": {
															color: "rgba(209,133,92,0.6)",
															"&:hover": { color: "#D1855C" },
														},
													}}
												/>
											</Tooltip>
										);
									}
									// pending
									return (
										<Chip
											key={inv.id}
											label={label}
											size="small"
											variant="outlined"
											onDelete={
												canRevoke ? () => handleRevoke(inv.id) : undefined
											}
											deleteIcon={
												canRevoke ? (
													<CloseIcon sx={{ fontSize: "0.85rem !important" }} />
												) : undefined
											}
											sx={{
												borderColor: "#E5BA41",
												color: "#E5BA41",
												fontWeight: 600,
												fontSize: "0.75rem",
												"& .MuiChip-deleteIcon": {
													color: "rgba(229,186,65,0.6)",
													"&:hover": { color: "#E5BA41" },
												},
											}}
										/>
									);
								})}
							</Box>
						)}

						{/* Inline-Antwort für eingeladene Nutzer */}
						{myInvitation?.status === "pending" && (
							<Box
								sx={{
									mt: 1,
									p: 1.5,
									borderRadius: 2,
									bgcolor: "rgba(229,186,65,0.1)",
									border: "1px solid rgba(229,186,65,0.4)",
									display: "flex",
									alignItems: "center",
									gap: 1.5,
									flexWrap: "wrap",
								}}
							>
								<Typography
									variant="body2"
									sx={{ fontWeight: 600, flex: 1, color: "text.primary" }}
								>
									Du wurdest eingeladen
								</Typography>
								<Button
									size="small"
									variant="contained"
									disableElevation
									onClick={() => handleRespond("accept")}
									sx={{
										bgcolor: "#94A378",
										color: "#fff",
										borderRadius: 2,
										"&:hover": { bgcolor: "#7a8f61" },
									}}
								>
									Teilnehmen
								</Button>
								<Button
									size="small"
									variant="outlined"
									onClick={() => handleRespond("decline")}
									sx={{
										borderColor: "#D1855C",
										color: "#D1855C",
										borderRadius: 2,
										"&:hover": { bgcolor: "rgba(209,133,92,0.08)" },
									}}
								>
									Ablehnen
								</Button>
							</Box>
						)}

						{/* Withdrawal option for accepted invitations */}
						{myInvitation?.status === "accepted" && (
							<Box
								sx={{
									mt: 1,
									p: 1.5,
									borderRadius: 2,
									bgcolor: "rgba(148,163,120,0.1)",
									border: "1px solid rgba(148,163,120,0.4)",
									display: "flex",
									alignItems: "center",
									gap: 1.5,
									flexWrap: "wrap",
								}}
							>
								<Typography
									variant="body2"
									sx={{ fontWeight: 600, flex: 1, color: "text.primary" }}
								>
									Du hast zugesagt
								</Typography>
								<Button
									size="small"
									variant="outlined"
									onClick={() => setWithdrawOpen(true)}
									sx={{
										borderColor: "#D1855C",
										color: "#D1855C",
										borderRadius: 2,
										"&:hover": { bgcolor: "rgba(209,133,92,0.08)" },
									}}
								>
									Absagen
								</Button>
							</Box>
						)}

						{/* Comment */}
						{editMode ? (
							<TextField
								label="Kommentar"
								multiline
								rows={2}
								fullWidth
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								size="small"
								sx={{ mt: 2 }}
							/>
						) : (
							comment && (
								<Typography
									variant="body2"
									sx={{
										mt: 1.5,
										color: "text.secondary",
										fontStyle: "italic",
										lineHeight: 1.6,
									}}
								>
									{comment}
								</Typography>
							)
						)}

						{/* Link / Route */}
						{editMode ? (
							<TextField
								label="Strava oder Komoot Link"
								fullWidth
								value={link}
								onChange={(e) => setLink(e.target.value)}
								size="small"
								sx={{ mt: 2 }}
								placeholder="https://www.komoot.com/tour/..."
							/>
						) : (
							link && <RouteWidget link={link} />
						)}
					</CardContent>
				)}

				{/* ── Actions (edit mode only) ── */}
				<Collapse in={editMode}>
					<Divider sx={{ borderColor: "rgba(45,60,89,0.08)" }} />
					<CardActions
						sx={{ justifyContent: "flex-end", px: 2.5, py: 1.5, gap: 1 }}
					>
						<Button
							size="small"
							color="inherit"
							startIcon={<CloseIcon />}
							onClick={() => setEditMode(false)}
							sx={{ color: "text.secondary" }}
						>
							Abbrechen
						</Button>
						<Button
							size="small"
							startIcon={<DeleteIcon />}
							onClick={handleDelete}
							sx={{
								color: "#D1855C",
								borderColor: "#D1855C",
								border: "1px solid",
								borderRadius: 2,
								"&:hover": { bgcolor: "rgba(209,133,92,0.08)" },
							}}
						>
							Löschen
						</Button>
						<Button
							size="small"
							variant="contained"
							disableElevation
							startIcon={<SaveIcon />}
							onClick={handleSave}
							sx={{ bgcolor: "primary.main", borderRadius: 2 }}
						>
							Speichern
						</Button>
					</CardActions>
				</Collapse>
			</Card>

			{/* Invite Dialog */}
			<Dialog
				open={inviteOpen}
				onClose={handleInviteClose}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: { borderRadius: 3 } }}
			>
				<DialogTitle sx={{ fontWeight: 700, color: "text.primary", pr: 6 }}>
					Personen einladen
					<IconButton
						onClick={handleInviteClose}
						size="small"
						sx={{
							position: "absolute",
							right: 12,
							top: 12,
							color: "text.secondary",
						}}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				</DialogTitle>
				<DialogContent sx={{ px: 0 }}>
					<Stack spacing={0}>
						<Box sx={{ px: 3, pb: 1 }}>
							<TextField
								size="small"
								fullWidth
								placeholder="Person suchen..."
								autoFocus
								value={inviteSearch}
								onChange={(e) => setInviteSearch(e.target.value)}
								InputProps={{ sx: { borderRadius: 2 } }}
							/>
							</Box>
							{inviteError && (
								<Typography
									variant="body2"
									color="error"
									sx={{ fontWeight: 600, px: 3 }}
								>
									{inviteError}
								</Typography>
							)}
							{/* Alle auswählen */}
							<ListItem
								disablePadding
								sx={{ borderBottom: "1px solid rgba(45,60,89,0.08)" }}
							>
								<ListItemButton
									onClick={toggleAllInvitees}
									dense
									sx={{ px: 3, py: 0.75 }}
								>
									<Checkbox
										checked={
											selectedInvitees.length === invitableUsers.length &&
											invitableUsers.length > 0
										}
										indeterminate={
											selectedInvitees.length > 0 &&
											selectedInvitees.length < invitableUsers.length
										}
										size="small"
										sx={{ mr: 1 }}
									/>
									<ListItemText
										primary="Alle auswählen"
										primaryTypographyProps={{
											fontWeight: 700,
											fontSize: "0.9rem",
										}}
									/>
								</ListItemButton>
							</ListItem>
							{/* Benutzerliste */}
							<List dense sx={{ maxHeight: 300, overflow: "auto", py: 0 }}>
								{invitableUsers
									.filter((u) =>
										u.name.toLowerCase().includes(inviteSearch.toLowerCase()),
									)
									.map((u) => {
										const isChecked = selectedInvitees.some(
											(s) => s.id === u.id,
										);
										return (
											<ListItem key={u.id} disablePadding>
												<ListItemButton
													onClick={() => toggleInvitee(u)}
													dense
													sx={{ px: 3, py: 0.5 }}
												>
													<Checkbox
														checked={isChecked}
														size="small"
														sx={{ mr: 1 }}
													/>
													<ListItemText primary={u.name} />
												</ListItemButton>
											</ListItem>
										);
									})}
							</List>
						</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
						<Chip
							label={`${selectedInvitees.length} ausgewählt`}
							size="small"
							sx={{ mr: "auto", fontWeight: 600 }}
						/>
						<Button
							onClick={handleInviteClose}
							color="inherit"
							sx={{ color: "text.secondary" }}
						>
							Abbrechen
						</Button>
						<Button
							variant="contained"
							disableElevation
							onClick={handleInviteSubmit}
							disabled={inviteLoading || selectedInvitees.length === 0}
							sx={{
								bgcolor: "#E5BA41",
								color: "#2D3C59",
								fontWeight: 700,
								borderRadius: 2,
								"&:hover": { bgcolor: "#d4a92e" },
							}}
						>
							{inviteLoading ? "Sende..." : "Einladen"}
						</Button>
					</DialogActions>
			</Dialog>

			{/* Withdrawal Dialog */}
			<Dialog
				open={withdrawOpen}
				onClose={() => { setWithdrawOpen(false); setWithdrawReason(""); }}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: { borderRadius: 3 } }}
			>
				<DialogTitle sx={{ fontWeight: 700, color: "text.primary" }}>
					Zusage zurückziehen
				</DialogTitle>
				<DialogContent>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Bitte gib einen kurzen Grund an, damit die anderen Bescheid wissen.
					</Typography>
					<TextField
						label="Begründung"
						placeholder="z.B. krank, Urlaub, anderweitig verhindert…"
						multiline
						rows={2}
						fullWidth
						autoFocus
						value={withdrawReason}
						onChange={(e) => setWithdrawReason(e.target.value)}
						InputProps={{ sx: { borderRadius: 2 } }}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button
						onClick={() => { setWithdrawOpen(false); setWithdrawReason(""); }}
						color="inherit"
						sx={{ color: "text.secondary" }}
					>
						Abbrechen
					</Button>
					<Button
						onClick={handleWithdraw}
						disabled={withdrawLoading || !withdrawReason.trim()}
						variant="contained"
						disableElevation
						sx={{
							bgcolor: "#D1855C",
							color: "#fff",
							fontWeight: 700,
							borderRadius: 2,
							"&:hover": { bgcolor: "#b8693f" },
						}}
					>
						{withdrawLoading ? "Wird gesendet…" : "Absagen"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Toast notification */}
			<Snackbar
				open={!!toast}
				autoHideDuration={4000}
				onClose={() => setToast(null)}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
			>
				<Alert
					onClose={() => setToast(null)}
					severity={toast?.severity || "success"}
					variant="filled"
					sx={{ borderRadius: 2, minWidth: 220 }}
				>
					{toast?.message}
				</Alert>
			</Snackbar>
		</>
	);
}
