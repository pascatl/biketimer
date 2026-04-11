import React, { useEffect, useState } from "react";
import {
	Drawer,
	Typography,
	Box,
	IconButton,
	CircularProgress,
	Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NewReleasesIcon from "@mui/icons-material/NewReleases";
import { fetchAllChangelog } from "../api";

export default function ChangelogDrawer({ open, onClose }) {
	const [entries, setEntries] = useState(null);

	useEffect(() => {
		if (!open) return;
		setEntries(null);
		fetchAllChangelog()
			.then((data) => setEntries(data || []))
			.catch(() => setEntries([]));
	}, [open]);

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
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<NewReleasesIcon sx={{ color: "#E5BA41" }} />
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						Was gibt's Neues?
					</Typography>
				</Box>
				<IconButton size="small" onClick={onClose}>
					<CloseIcon />
				</IconButton>
			</Box>

			{entries === null ? (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
					<CircularProgress size={28} />
				</Box>
			) : entries.length === 0 ? (
				<Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
					Keine Einträge vorhanden.
				</Typography>
			) : (
				entries.map((entry, idx) => (
					<Box key={entry.id}>
						{idx > 0 && <Divider sx={{ my: 2 }} />}
						<Typography
							variant="caption"
							sx={{ color: "text.disabled", display: "block", mb: 0.5 }}
						>
							{new Date(entry.created_at).toLocaleDateString("de-DE", {
								day: "2-digit",
								month: "long",
								year: "numeric",
							})}
						</Typography>
						<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
							{entry.title}
						</Typography>
						<Typography
							variant="body2"
							sx={{ color: "text.secondary", lineHeight: 1.6 }}
						>
							{entry.body}
						</Typography>
					</Box>
				))
			)}
		</Drawer>
	);
}
