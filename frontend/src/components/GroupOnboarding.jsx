import React, { useState } from "react";
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControlLabel,
	Typography,
} from "@mui/material";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import GroupsIcon from "@mui/icons-material/Groups";

/**
 * Shown once after first login when the user has no group memberships.
 * Lets the user pick which sport-type groups they belong to.
 *
 * Props:
 *   open        – boolean
 *   sportTypes  – { [key]: { label, icon, color } }
 *   onSave      – (selectedKeys: string[]) => Promise<void>
 *   onClose     – () => void   (only available after saving at least once)
 */
export default function GroupOnboarding({ open, sportTypes, onSave, onClose }) {
	const [selected, setSelected] = useState([]);
	const [saving, setSaving] = useState(false);

	const keys = Object.keys(sportTypes);

	const toggle = (key) => {
		setSelected((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
		);
	};

	const handleSave = async () => {
		if (selected.length === 0) return;
		setSaving(true);
		try {
			await onSave(selected);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			maxWidth="xs"
			fullWidth
			disableEscapeKeyDown
			PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
		>
			{/* Header strip */}
			<Box
				sx={{
					bgcolor: "primary.main",
					px: 3,
					py: 2.5,
					display: "flex",
					alignItems: "center",
					gap: 1.5,
				}}
			>
				<Box
					sx={{
						bgcolor: "rgba(255,255,255,0.12)",
						borderRadius: 2,
						p: 0.75,
						display: "flex",
					}}
				>
					<GroupsIcon sx={{ fontSize: 22, color: "#E5BA41" }} />
				</Box>
				<Box>
					<Typography
						variant="h6"
						sx={{ fontWeight: 700, color: "#fff", lineHeight: 1.2 }}
					>
						Willkommen!
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.65)", letterSpacing: 1.5 }}
					>
						GRUPPEN AUSWÄHLEN
					</Typography>
				</Box>
			</Box>

			<Divider sx={{ borderColor: "#E5BA41", borderBottomWidth: 3 }} />

			<DialogTitle sx={{ pt: 2.5, pb: 0 }}>
				<Typography variant="body2" sx={{ color: "text.secondary" }}>
					Wähle die Gruppen, in denen du aktiv bist. Du siehst beim Einladen nur
					Mitglieder deiner Gruppen. Du kannst das jederzeit in den
					Einstellungen ändern.
				</Typography>
			</DialogTitle>

			<DialogContent sx={{ pt: 2 }}>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
					{keys.map((key) => {
						const t = sportTypes[key];
						return (
							<FormControlLabel
								key={key}
								control={
									<Checkbox
										checked={selected.includes(key)}
										onChange={() => toggle(key)}
										sx={{
											color: t.color || "#2D3C59",
											"&.Mui-checked": { color: t.color || "#2D3C59" },
										}}
									/>
								}
								label={
									<Typography
										variant="body1"
										sx={{ fontWeight: 600, color: "text.primary" }}
									>
										{t.label || key}
									</Typography>
								}
							/>
						);
					})}
				</Box>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
				{onClose && (
					<Button
						onClick={onClose}
						color="inherit"
						sx={{ color: "text.secondary" }}
					>
						Überspringen
					</Button>
				)}
				<Button
					variant="contained"
					disableElevation
					disabled={saving || selected.length === 0}
					onClick={handleSave}
					sx={{
						bgcolor: "#E5BA41",
						color: "#2D3C59",
						fontWeight: 700,
						borderRadius: 2,
						px: 3,
						"&:hover": { bgcolor: "#d4a92e" },
						"&.Mui-disabled": {
							bgcolor: "rgba(229,186,65,0.35)",
							color: "rgba(45,60,89,0.5)",
						},
					}}
				>
					{saving ? (
						<CircularProgress size={20} sx={{ color: "#2D3C59" }} />
					) : (
						"Speichern"
					)}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
