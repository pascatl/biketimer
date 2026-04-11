import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	IconButton,
	Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

export default function WhatsNewDialog({ open, entries, onClose }) {
	if (!entries || entries.length === 0) return null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(45,60,89,0.18)" },
			}}
		>
			<DialogTitle
				sx={{
					fontWeight: 700,
					color: "text.primary",
					pr: 6,
					display: "flex",
					alignItems: "center",
					gap: 1,
				}}
			>
				<NewReleasesIcon sx={{ color: "#E5BA41" }} />
				Was gibt's Neues?
				<IconButton
					onClick={onClose}
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

			<DialogContent sx={{ pt: 0 }}>
				{entries.map((entry, idx) => (
					<Box key={entry.id}>
						{idx > 0 && <Divider sx={{ my: 2 }} />}
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
				))}
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button
					onClick={onClose}
					variant="contained"
					disableElevation
					fullWidth
					sx={{
						bgcolor: "#E5BA41",
						color: "#2D3C59",
						fontWeight: 700,
						borderRadius: 2,
						"&:hover": { bgcolor: "#d4a92e" },
					}}
				>
					Verstanden
				</Button>
			</DialogActions>
		</Dialog>
	);
}
