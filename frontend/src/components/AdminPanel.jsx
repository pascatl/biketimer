import React, { useCallback, useEffect, useState } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	IconButton,
	InputLabel,
	List,
	ListItem,
	ListItemSecondaryAction,
	ListItemText,
	MenuItem,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import PeopleIcon from "@mui/icons-material/People";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import SportsVolleyballIcon from "@mui/icons-material/SportsVolleyball";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import LandscapeIcon from "@mui/icons-material/Landscape";
import SettingsIcon from "@mui/icons-material/Settings";
import {
	adminFetchUsers,
	adminUpdateUser,
	adminDeleteUser,
	adminFetchJerseys,
	adminCreateJersey,
	adminUpdateJersey,
	adminDeleteJersey,
	adminFetchSportTypes,
	adminCreateSportType,
	adminUpdateSportType,
	adminDeleteSportType,
	adminFetchUserGroups,
	adminUpdateUserGroups,
} from "../api";

function TabPanel({ children, value, index }) {
	return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ── Shared confirmation dialog ────────────────────────────────
function ConfirmDeleteDialog({ open, message, onConfirm, onCancel }) {
	return (
		<Dialog
			open={open}
			onClose={onCancel}
			maxWidth="xs"
			fullWidth
			PaperProps={{ sx: { borderRadius: 3 } }}
		>
			<DialogTitle sx={{ fontWeight: 700, color: "text.primary", pr: 6 }}>
				Löschen bestätigen
				<IconButton
					onClick={onCancel}
					size="small"
					aria-label="Dialog schließen"
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
			<DialogContent>
				<Typography variant="body2" color="text.secondary">
					{message}
				</Typography>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
				<Button
					onClick={onCancel}
					color="inherit"
					sx={{ color: "text.secondary" }}
				>
					Abbrechen
				</Button>
				<Button
					onClick={onConfirm}
					variant="contained"
					disableElevation
					startIcon={<DeleteIcon />}
					sx={{
						bgcolor: "#D1855C",
						color: "#fff",
						fontWeight: 700,
						borderRadius: 2,
						"&:hover": { bgcolor: "#b8693f" },
					}}
				>
					Löschen
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// ── User Management ──────────────────────────────────────────
function UserManager({ sportTypes }) {
	const [users, setUsers] = useState([]);
	const [editId, setEditId] = useState(null);
	const [editData, setEditData] = useState({});
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState(null);
	// Group management per user
	const [userGroups, setUserGroups] = useState({}); // { userId: [keys] }

	const load = useCallback(async () => {
		try {
			const uList = await adminFetchUsers();
			setUsers(uList);
			// Load groups for all users in parallel
			const groupResults = await Promise.all(
				uList.map((u) =>
					adminFetchUserGroups(u.id).then((res) => [u.id, res.groups || []]),
				),
			);
			const map = {};
			for (const [uid, groups] of groupResults) map[uid] = groups;
			setUserGroups(map);
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleSave = async (id) => {
		try {
			await adminUpdateUser(id, editData);
			setEditId(null);
			load();
		} catch (e) {
			alert(e.message);
		}
	};

	const handleDelete = (id) => {
		setDeleteTargetId(id);
		setDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		setDeleteConfirmOpen(false);
		try {
			await adminDeleteUser(deleteTargetId);
			load();
		} catch (e) {
			alert(e.message);
		}
	};

	const startEdit = (u) => {
		setEditId(u.id);
		setEditData({ name: u.name, email: u.email || "", is_active: u.is_active });
	};

	const handleToggleGroup = async (userId, key) => {
		const current = userGroups[userId] || [];
		const updated = current.includes(key)
			? current.filter((k) => k !== key)
			: [...current, key];
		setUserGroups((prev) => ({ ...prev, [userId]: updated }));
		try {
			await adminUpdateUserGroups(userId, updated);
		} catch (e) {
			// Revert on error
			setUserGroups((prev) => ({ ...prev, [userId]: current }));
			console.error(e);
		}
	};

	const sportTypeEntries = sportTypes ? Object.entries(sportTypes) : [];

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography variant="h6" sx={{ fontWeight: 700 }}>
					Personen
				</Typography>
			</Box>
			<List dense>
				{users.map((u) => (
					<ListItem
						key={u.id}
						sx={{
							bgcolor: !u.is_active ? "rgba(0,0,0,0.04)" : "transparent",
							borderRadius: 1,
							mb: 0.5,
						}}
					>
						{editId === u.id ? (
							<Box
								sx={{ display: "flex", gap: 1, flex: 1, alignItems: "center" }}
							>
								<TextField
									size="small"
									label="Name"
									value={editData.name}
									onChange={(e) =>
										setEditData({ ...editData, name: e.target.value })
									}
									sx={{ flex: 1 }}
								/>
								<TextField
									size="small"
									label="E-Mail"
									value={editData.email}
									onChange={(e) =>
										setEditData({ ...editData, email: e.target.value })
									}
									sx={{ flex: 1 }}
								/>
								<Tooltip title={editData.is_active ? "Aktiv" : "Inaktiv"}>
									<Chip
										label={editData.is_active ? "Aktiv" : "Inaktiv"}
										size="small"
										onClick={() =>
											setEditData({
												...editData,
												is_active: !editData.is_active,
											})
										}
										sx={{
											cursor: "pointer",
											bgcolor: editData.is_active ? "#94A378" : "#D1855C",
											color: "#fff",
											fontWeight: 600,
										}}
									/>
								</Tooltip>
								<IconButton size="small" onClick={() => handleSave(u.id)}>
									<SaveIcon fontSize="small" />
								</IconButton>
								<IconButton size="small" onClick={() => setEditId(null)}>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Box>
						) : (
							<>
								<ListItemText
									primary={u.name}
									secondary={
										<Box component="span">
											<Box component="span" sx={{ display: "block" }}>
												{u.email || "–"}
											</Box>
											{sportTypeEntries.length > 0 && (
												<Box
													component="span"
													sx={{
														display: "flex",
														gap: 0.5,
														flexWrap: "wrap",
														mt: 0.5,
													}}
												>
													{sportTypeEntries.map(([key, t]) => {
														const isMember = (userGroups[u.id] || []).includes(
															key,
														);
														return (
															<Chip
																key={key}
																label={t.label || key}
																size="small"
																clickable
																onClick={() => handleToggleGroup(u.id, key)}
																variant={isMember ? "filled" : "outlined"}
																sx={{
																	fontSize: "0.65rem",
																	height: 22,
																	bgcolor: isMember
																		? t.color || "#2D3C59"
																		: "transparent",
																	color: isMember
																		? "#fff"
																		: t.color || "#2D3C59",
																	borderColor: t.color || "#2D3C59",
																	fontWeight: isMember ? 700 : 500,
																	"&:hover": {
																		bgcolor: isMember
																			? t.color || "#2D3C59"
																			: `${t.color || "#2D3C59"}22`,
																	},
																}}
															/>
														);
													})}
												</Box>
											)}
										</Box>
									}
									sx={{ opacity: u.is_active ? 1 : 0.5 }}
								/>
								<ListItemSecondaryAction>
									{!u.is_active && (
										<Chip
											label="Inaktiv"
											size="small"
											sx={{ mr: 1, fontSize: "0.7rem" }}
										/>
									)}
									<IconButton size="small" onClick={() => startEdit(u)}>
										<EditIcon fontSize="small" />
									</IconButton>
									<IconButton size="small" onClick={() => handleDelete(u.id)}>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</ListItemSecondaryAction>
							</>
						)}
					</ListItem>
				))}
			</List>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				message="Möchtest du diesen Benutzer wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
				onConfirm={handleConfirmDelete}
				onCancel={() => setDeleteConfirmOpen(false)}
			/>
		</Box>
	);
}

// ── Jersey Management ────────────────────────────────────────
function JerseyManager() {
	const [jerseys, setJerseys] = useState([]);
	const [editId, setEditId] = useState(null);
	const [editData, setEditData] = useState({});
	const [addOpen, setAddOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState(null);

	const load = useCallback(async () => {
		try {
			setJerseys(await adminFetchJerseys());
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleAdd = async () => {
		if (!newName.trim()) return;
		try {
			await adminCreateJersey({
				name: newName.trim(),
				sort_order: jerseys.length,
			});
			setNewName("");
			setAddOpen(false);
			load();
		} catch (e) {
			alert(e.message);
		}
	};

	const handleSave = async (id) => {
		try {
			await adminUpdateJersey(id, editData);
			setEditId(null);
			load();
		} catch (e) {
			alert(e.message);
		}
	};

	const handleDelete = (id) => {
		setDeleteTargetId(id);
		setDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		setDeleteConfirmOpen(false);
		try {
			await adminDeleteJersey(deleteTargetId);
			load();
		} catch (e) {
			alert(e.message);
		}
	};

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography variant="h6" sx={{ fontWeight: 700 }}>
					Trikots
				</Typography>
				<Button
					startIcon={<AddIcon />}
					variant="contained"
					size="small"
					disableElevation
					onClick={() => setAddOpen(true)}
					sx={{
						bgcolor: "#E5BA41",
						color: "#2D3C59",
						fontWeight: 700,
						"&:hover": { bgcolor: "#d4a92e" },
					}}
				>
					Hinzufügen
				</Button>
			</Box>
			<List dense>
				{jerseys.map((j) => (
					<ListItem
						key={j.id}
						sx={{
							bgcolor: !j.is_active ? "rgba(0,0,0,0.04)" : "transparent",
							borderRadius: 1,
							mb: 0.5,
						}}
					>
						{editId === j.id ? (
							<Box
								sx={{ display: "flex", gap: 1, flex: 1, alignItems: "center" }}
							>
								<TextField
									size="small"
									label="Name"
									value={editData.name}
									onChange={(e) =>
										setEditData({ ...editData, name: e.target.value })
									}
									sx={{ flex: 1 }}
								/>
								<Chip
									label={editData.is_active ? "Aktiv" : "Inaktiv"}
									size="small"
									onClick={() =>
										setEditData({ ...editData, is_active: !editData.is_active })
									}
									sx={{
										cursor: "pointer",
										bgcolor: editData.is_active ? "#94A378" : "#D1855C",
										color: "#fff",
										fontWeight: 600,
									}}
								/>
								<IconButton size="small" onClick={() => handleSave(j.id)}>
									<SaveIcon fontSize="small" />
								</IconButton>
								<IconButton size="small" onClick={() => setEditId(null)}>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Box>
						) : (
							<>
								<ListItemText
									primary={j.name}
									sx={{ opacity: j.is_active ? 1 : 0.5 }}
								/>
								<ListItemSecondaryAction>
									{!j.is_active && (
										<Chip
											label="Inaktiv"
											size="small"
											sx={{ mr: 1, fontSize: "0.7rem" }}
										/>
									)}
									<IconButton
										size="small"
										onClick={() => {
											setEditId(j.id);
											setEditData({ name: j.name, is_active: j.is_active });
										}}
									>
										<EditIcon fontSize="small" />
									</IconButton>
									<IconButton size="small" onClick={() => handleDelete(j.id)}>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</ListItemSecondaryAction>
							</>
						)}
					</ListItem>
				))}
			</List>
			<Dialog
				open={addOpen}
				onClose={() => setAddOpen(false)}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: { borderRadius: 3 } }}
			>
				<DialogTitle sx={{ fontWeight: 700 }}>Trikot hinzufügen</DialogTitle>
				<DialogContent>
					<TextField
						label="Name"
						size="small"
						fullWidth
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						autoFocus
						sx={{ mt: 1 }}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setAddOpen(false)} color="inherit">
						Abbrechen
					</Button>
					<Button
						onClick={handleAdd}
						variant="contained"
						disableElevation
						disabled={!newName.trim()}
						sx={{
							bgcolor: "#E5BA41",
							color: "#2D3C59",
							fontWeight: 700,
							"&:hover": { bgcolor: "#d4a92e" },
						}}
					>
						Hinzufügen
					</Button>
				</DialogActions>
			</Dialog>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				message="Möchtest du dieses Trikot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
				onConfirm={handleConfirmDelete}
				onCancel={() => setDeleteConfirmOpen(false)}
			/>
		</Box>
	);
}

// ── Sport Type Management ────────────────────────────────────
const SPORT_ICON_MAP = {
	DirectionsBike: <DirectionsBikeIcon />,
	Landscape: <LandscapeIcon />,
	SportsTennis: <SportsTennisIcon />,
	SportsVolleyball: <SportsVolleyballIcon />,
};

function SportTypeManager() {
	const [types, setTypes] = useState([]);
	const [editId, setEditId] = useState(null);
	const [editData, setEditData] = useState({});
	const [addOpen, setAddOpen] = useState(false);
	const [newData, setNewData] = useState({
		key: "",
		label: "",
		icon: "DirectionsBike",
		color: "#2D3C59",
	});
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState(null);

	const load = useCallback(async () => {
		try {
			setTypes(await adminFetchSportTypes());
		} catch (e) {
			console.error(e);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const iconOptions = [
		"DirectionsBike",
		"Landscape",
		"SportsTennis",
		"SportsVolleyball",
	];

	const handleAdd = async () => {
		if (!newData.key.trim() || !newData.label.trim()) return;
		try {
			await adminCreateSportType({ ...newData, sort_order: types.length });
			setNewData({
				key: "",
				label: "",
				icon: "DirectionsBike",
				color: "#2D3C59",
			});
			setAddOpen(false);
			load();
		} catch (e) {
			alert(e.message);
		}
	};

	const handleSave = async (id) => {
		try {
			await adminUpdateSportType(id, editData);
			setEditId(null);
			load();
		} catch (e) {
			alert(e.message);
		}
	};

	const handleDelete = (id) => {
		setDeleteTargetId(id);
		setDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		setDeleteConfirmOpen(false);
		try {
			await adminDeleteSportType(deleteTargetId);
			load();
		} catch (e) {
			alert(e.message);
		}
	};

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography variant="h6" sx={{ fontWeight: 700 }}>
					Sportarten
				</Typography>
				<Button
					startIcon={<AddIcon />}
					variant="contained"
					size="small"
					disableElevation
					onClick={() => setAddOpen(true)}
					sx={{
						bgcolor: "#E5BA41",
						color: "#2D3C59",
						fontWeight: 700,
						"&:hover": { bgcolor: "#d4a92e" },
					}}
				>
					Hinzufügen
				</Button>
			</Box>
			<List dense>
				{types.map((t) => (
					<ListItem
						key={t.id}
						sx={{
							bgcolor: !t.is_active ? "rgba(0,0,0,0.04)" : "transparent",
							borderRadius: 1,
							mb: 0.5,
						}}
					>
						{editId === t.id ? (
							<Box
								sx={{
									display: "flex",
									gap: 1,
									flex: 1,
									flexWrap: "wrap",
									alignItems: "center",
								}}
							>
								<TextField
									size="small"
									label="Key"
									value={editData.key}
									onChange={(e) =>
										setEditData({ ...editData, key: e.target.value })
									}
									sx={{ width: 100 }}
								/>
								<TextField
									size="small"
									label="Label"
									value={editData.label}
									onChange={(e) =>
										setEditData({ ...editData, label: e.target.value })
									}
									sx={{ flex: 1 }}
								/>
								<FormControl size="small" sx={{ minWidth: 160 }}>
									<InputLabel>Icon</InputLabel>
									<Select
										label="Icon"
										value={editData.icon}
										onChange={(e) =>
											setEditData({ ...editData, icon: e.target.value })
										}
									>
										{iconOptions.map((opt) => (
											<MenuItem key={opt} value={opt}>
												<Box
													sx={{ display: "flex", alignItems: "center", gap: 1 }}
												>
													{SPORT_ICON_MAP[opt]}
													{opt}
												</Box>
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<TextField
									size="small"
									label="Farbe"
									type="color"
									value={editData.color}
									onChange={(e) =>
										setEditData({ ...editData, color: e.target.value })
									}
									sx={{ width: 80 }}
								/>
								<Chip
									label={editData.is_active ? "Aktiv" : "Inaktiv"}
									size="small"
									onClick={() =>
										setEditData({ ...editData, is_active: !editData.is_active })
									}
									sx={{
										cursor: "pointer",
										bgcolor: editData.is_active ? "#94A378" : "#D1855C",
										color: "#fff",
										fontWeight: 600,
									}}
								/>
								<IconButton size="small" onClick={() => handleSave(t.id)}>
									<SaveIcon fontSize="small" />
								</IconButton>
								<IconButton size="small" onClick={() => setEditId(null)}>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Box>
						) : (
							<>
								<Box
									sx={{
										color: t.color,
										mr: 1.5,
										flexShrink: 0,
										display: "flex",
										alignItems: "center",
									}}
								>
									{SPORT_ICON_MAP[t.icon] ?? <DirectionsBikeIcon />}
								</Box>
								<ListItemText
									primary={t.label}
									secondary={t.key}
									sx={{ opacity: t.is_active ? 1 : 0.5 }}
								/>
								<ListItemSecondaryAction>
									{!t.is_active && (
										<Chip
											label="Inaktiv"
											size="small"
											sx={{ mr: 1, fontSize: "0.7rem" }}
										/>
									)}
									<IconButton
										size="small"
										onClick={() => {
											setEditId(t.id);
											setEditData({
												key: t.key,
												label: t.label,
												icon: t.icon,
												color: t.color,
												is_active: t.is_active,
											});
										}}
									>
										<EditIcon fontSize="small" />
									</IconButton>
									<IconButton size="small" onClick={() => handleDelete(t.id)}>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</ListItemSecondaryAction>
							</>
						)}
					</ListItem>
				))}
			</List>
			<Dialog
				open={addOpen}
				onClose={() => setAddOpen(false)}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: { borderRadius: 3 } }}
			>
				<DialogTitle sx={{ fontWeight: 700 }}>Sportart hinzufügen</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ pt: 1 }}>
						<TextField
							label="Key (z.B. rennrad)"
							size="small"
							fullWidth
							value={newData.key}
							onChange={(e) => setNewData({ ...newData, key: e.target.value })}
							autoFocus
						/>
						<TextField
							label="Anzeigename"
							size="small"
							fullWidth
							value={newData.label}
							onChange={(e) =>
								setNewData({ ...newData, label: e.target.value })
							}
						/>
						<FormControl size="small" fullWidth>
							<InputLabel>Icon</InputLabel>
							<Select
								label="Icon"
								value={newData.icon}
								onChange={(e) =>
									setNewData({ ...newData, icon: e.target.value })
								}
							>
								{iconOptions.map((opt) => (
									<MenuItem key={opt} value={opt}>
										<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
											{SPORT_ICON_MAP[opt]}
											{opt}
										</Box>
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<TextField
							label="Farbe"
							type="color"
							size="small"
							value={newData.color}
							onChange={(e) =>
								setNewData({ ...newData, color: e.target.value })
							}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setAddOpen(false)} color="inherit">
						Abbrechen
					</Button>
					<Button
						onClick={handleAdd}
						variant="contained"
						disableElevation
						disabled={!newData.key.trim() || !newData.label.trim()}
						sx={{
							bgcolor: "#E5BA41",
							color: "#2D3C59",
							fontWeight: 700,
							"&:hover": { bgcolor: "#d4a92e" },
						}}
					>
						Hinzufügen
					</Button>
				</DialogActions>
			</Dialog>
			<ConfirmDeleteDialog
				open={deleteConfirmOpen}
				message="Möchtest du diese Sportart wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
				onConfirm={handleConfirmDelete}
				onCancel={() => setDeleteConfirmOpen(false)}
			/>
		</Box>
	);
}

// ── Main Admin Panel ─────────────────────────────────────────
export default function AdminPanel({ open, onClose }) {
	const [tab, setTab] = useState(0);
	const [sportTypesMap, setSportTypesMap] = useState({});

	// Load sport types for the user-group chips
	useEffect(() => {
		if (!open) return;
		adminFetchSportTypes()
			.then((list) => {
				const map = {};
				list.forEach((t) => {
					map[t.key] = { label: t.label, icon: t.icon, color: t.color };
				});
				setSportTypesMap(map);
			})
			.catch(console.error);
	}, [open]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					minHeight: 500,
					boxShadow: "0 8px 32px rgba(45,60,89,0.18)",
				},
			}}
		>
			{/* Header */}
			<Box
				sx={{
					bgcolor: "primary.main",
					px: 3,
					py: 2,
					display: "flex",
					alignItems: "center",
					gap: 1.5,
				}}
			>
				<SettingsIcon sx={{ color: "#E5BA41", fontSize: 22 }} />
				<Typography
					variant="h6"
					sx={{ fontWeight: 700, color: "#fff", flex: 1 }}
				>
					Admin-Bereich
				</Typography>
				<IconButton
					onClick={onClose}
					size="small"
					sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#fff" } }}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</Box>

			<Divider sx={{ borderColor: "#E5BA41", borderBottomWidth: 3 }} />

			<DialogContent sx={{ px: 3, py: 0 }}>
				<Tabs
					value={tab}
					onChange={(_, v) => setTab(v)}
					sx={{
						borderBottom: "1px solid rgba(45,60,89,0.1)",
						"& .MuiTab-root": { fontWeight: 600, textTransform: "none" },
					}}
				>
					<Tab
						icon={<PeopleIcon sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Personen"
					/>
					<Tab
						icon={<CheckroomIcon sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Trikots"
					/>
					<Tab
						icon={<SportsTennisIcon sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Sportarten"
					/>
				</Tabs>

				<TabPanel value={tab} index={0}>
					<UserManager sportTypes={sportTypesMap} />
				</TabPanel>
				<TabPanel value={tab} index={1}>
					<JerseyManager />
				</TabPanel>
				<TabPanel value={tab} index={2}>
					<SportTypeManager />
				</TabPanel>
			</DialogContent>
		</Dialog>
	);
}
