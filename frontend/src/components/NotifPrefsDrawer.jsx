import React, { useEffect, useState } from "react";
import {
	Box,
	Checkbox,
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
import NotificationsIcon from "@mui/icons-material/Notifications";
import EmailIcon from "@mui/icons-material/Email";
import GroupsIcon from "@mui/icons-material/Groups";
import {
	fetchPushPrefs,
	updatePushPrefs,
	fetchEmailPrefs,
	updateEmailPrefs,
	fetchMyGroups,
	updateMyGroups,
} from "../api";

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

export default function NotifPrefsDrawer({
	open,
	onClose,
	isAdmin,
	sportTypes,
	onGroupsChanged,
}) {
	const [pushPrefs, setPushPrefs] = useState(null);
	const [emailPrefs, setEmailPrefs] = useState(null);
	const [myGroups, setMyGroups] = useState(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [pushGranted, setPushGranted] = useState(false);

	useEffect(() => {
		if (!open) return;
		setPushGranted(Notification.permission === "granted");
		fetchPushPrefs()
			.then((p) => setPushPrefs(p))
			.catch(() =>
				setError("Push-Einstellungen konnten nicht geladen werden."),
			);
		fetchEmailPrefs()
			.then((p) => setEmailPrefs(p))
			.catch(() =>
				setError("E-Mail-Einstellungen konnten nicht geladen werden."),
			);
		fetchMyGroups()
			.then((data) => setMyGroups(data.groups || []))
			.catch(() => setError("Gruppen konnten nicht geladen werden."));
	}, [open]);

	const handleGroupToggle = async (key) => {
		const updated = myGroups.includes(key)
			? myGroups.filter((k) => k !== key)
			: [...myGroups, key];
		setMyGroups(updated);
		setSaving(true);
		try {
			await updateMyGroups(updated);
			onGroupsChanged?.(updated);
		} catch {
			setError("Speichern fehlgeschlagen.");
		} finally {
			setSaving(false);
		}
	};

	const handlePushToggle = async (key) => {
		const newPrefs = { ...pushPrefs, [key]: !pushPrefs[key] };
		setPushPrefs(newPrefs);
		setSaving(true);
		try {
			await updatePushPrefs(newPrefs);
		} catch {
			setError("Speichern fehlgeschlagen.");
		} finally {
			setSaving(false);
		}
	};

	const handleEmailToggle = async (key) => {
		const newPrefs = { ...emailPrefs, [key]: !emailPrefs[key] };
		setEmailPrefs(newPrefs);
		setSaving(true);
		try {
			await updateEmailPrefs(newPrefs);
		} catch {
			setError("Speichern fehlgeschlagen.");
		} finally {
			setSaving(false);
		}
	};

	const renderPrefRows = (prefList, prefs, onToggle) =>
		prefList.map(({ key, label }) => (
			<FormControlLabel
				key={key}
				control={
					<Switch
						size="small"
						checked={prefs[key] ?? false}
						onChange={() => onToggle(key)}
						disabled={saving}
					/>
				}
				label={<Typography variant="body2">{label}</Typography>}
				sx={{
					display: "flex",
					justifyContent: "space-between",
					ml: 0,
					mr: 0,
					mb: 0.5,
				}}
				labelPlacement="start"
			/>
		));

	const isLoading = !pushPrefs || !emailPrefs || myGroups === null;

	const sportTypeEntries = sportTypes ? Object.entries(sportTypes) : [];

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: { width: { xs: "100%", sm: 400 }, p: 3 },
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					mb: 2,
				}}
			>
				<Typography variant="h6" sx={{ fontWeight: 700 }}>
					Einstellungen
				</Typography>
				<IconButton size="small" onClick={onClose}>
					<CloseIcon />
				</IconButton>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 2, fontSize: "0.8rem" }}>
					{error}
				</Alert>
			)}

			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
					<CircularProgress size={28} />
				</Box>
			) : (
				<>
					{/* ── Groups ── */}
					{sportTypeEntries.length > 0 && (
						<>
							<Box
								sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
							>
								<GroupsIcon fontSize="small" sx={{ color: "text.secondary" }} />
								<Typography
									variant="subtitle2"
									sx={{
										fontWeight: 700,
										textTransform: "uppercase",
										letterSpacing: 0.8,
										color: "text.secondary",
									}}
								>
									Meine Gruppen
								</Typography>
							</Box>
							<Typography
								variant="caption"
								sx={{ color: "text.disabled", mb: 1, display: "block" }}
							>
								Nur Mitglieder deiner Gruppen werden beim Einladen
								vorgeschlagen.
							</Typography>
							<Box sx={{ mb: 2 }}>
								{sportTypeEntries.map(([key, t]) => (
									<FormControlLabel
										key={key}
										control={
											<Checkbox
												size="small"
												checked={myGroups?.includes(key) ?? false}
												onChange={() => handleGroupToggle(key)}
												disabled={saving}
												sx={{
													color: t.color || "#2D3C59",
													"&.Mui-checked": { color: t.color || "#2D3C59" },
												}}
											/>
										}
										label={
											<Typography variant="body2">{t.label || key}</Typography>
										}
										sx={{
											display: "flex",
											justifyContent: "space-between",
											ml: 0,
											mr: 0,
											mb: 0.5,
										}}
										labelPlacement="start"
									/>
								))}
							</Box>
							<Divider sx={{ mb: 2 }} />
						</>
					)}

					{/* ── Push Notifications ── */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
						<NotificationsIcon
							fontSize="small"
							sx={{ color: "text.secondary" }}
						/>
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: 0.8,
								color: "text.secondary",
							}}
						>
							Push
						</Typography>
					</Box>

					{!pushGranted && (
						<Alert severity="warning" sx={{ mb: 1.5, fontSize: "0.8rem" }}>
							Push-Benachrichtigungen sind nicht aktiviert. Erlaube sie im
							Browser, damit Einstellungen wirksam werden.
						</Alert>
					)}

					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 700,
							textTransform: "uppercase",
							letterSpacing: 0.8,
						}}
					>
						Für dich
					</Typography>
					<Box sx={{ mt: 1, mb: 2 }}>
						{renderPrefRows(USER_PREFS, pushPrefs, handlePushToggle)}
					</Box>

					{isAdmin && (
						<>
							<Divider sx={{ mb: 1.5 }} />
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: 0.8,
								}}
							>
								Admin
							</Typography>
							<Box sx={{ mt: 1, mb: 2 }}>
								{renderPrefRows(ADMIN_PREFS, pushPrefs, handlePushToggle)}
							</Box>
						</>
					)}

					<Divider sx={{ mb: 2 }} />

					{/* ── Email Notifications ── */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
						<EmailIcon fontSize="small" sx={{ color: "text.secondary" }} />
						<Typography
							variant="subtitle2"
							sx={{
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: 0.8,
								color: "text.secondary",
							}}
						>
							E-Mail
						</Typography>
					</Box>

					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							fontWeight: 700,
							textTransform: "uppercase",
							letterSpacing: 0.8,
						}}
					>
						Für dich
					</Typography>
					<Box sx={{ mt: 1, mb: 2 }}>
						{renderPrefRows(USER_PREFS, emailPrefs, handleEmailToggle)}
					</Box>

					{isAdmin && (
						<>
							<Divider sx={{ mb: 1.5 }} />
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: 0.8,
								}}
							>
								Admin
							</Typography>
							<Box sx={{ mt: 1 }}>
								{renderPrefRows(ADMIN_PREFS, emailPrefs, handleEmailToggle)}
							</Box>
						</>
					)}
				</>
			)}
		</Drawer>
	);
}
