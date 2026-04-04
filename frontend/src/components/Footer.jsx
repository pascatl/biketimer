import React, { useState } from "react";
import {
	Box,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Link,
	Tooltip,
	Typography,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import BugReportIcon from "@mui/icons-material/BugReport";
import CloseIcon from "@mui/icons-material/Close";

const GITHUB_REPO = "https://github.com/pascatl/biketimer";
const GITHUB_ISSUE = `${GITHUB_REPO}/issues/new`;

export default function Footer() {
	const [impOpen, setImpOpen] = useState(false);

	return (
		<>
			<Box
				component="footer"
				sx={{
					position: "fixed",
					bottom: 0,
					left: 0,
					right: 0,
					py: 1,
					px: 3,
					bgcolor: "background.default",
					borderTop: "1px solid rgba(45,60,89,0.1)",
					display: "flex",
					alignItems: "center",
				justifyContent: "center",
					flexWrap: "wrap",
					gap: 1,
					zIndex: 1100,
				}}
			>
				{/* Left: Impressum */}
				<Button
					variant="text"
					size="small"
					onClick={() => setImpOpen(true)}
					sx={{
						color: "text.secondary",
						textTransform: "none",
						fontSize: "0.75rem",
						p: 0,
						minWidth: 0,
						"&:hover": { color: "text.primary", background: "none" },
					}}
				>
					Impressum
				</Button>

				{/* Right: GitHub links */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
					<Tooltip title="GitHub-Repository">
						<IconButton
							component={Link}
							href={GITHUB_REPO}
							target="_blank"
							rel="noopener noreferrer"
							size="small"
							sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
						>
							<GitHubIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="Problem melden / Feature anfragen">
						<IconButton
							component={Link}
							href={GITHUB_ISSUE}
							target="_blank"
							rel="noopener noreferrer"
							size="small"
							sx={{ color: "text.secondary", "&:hover": { color: "#D1855C" } }}
						>
							<BugReportIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* Impressum Dialog */}
			<Dialog
				open={impOpen}
				onClose={() => setImpOpen(false)}
				maxWidth="sm"
				fullWidth
				PaperProps={{ sx: { borderRadius: 3 } }}
			>
				<DialogTitle
					sx={{
						fontWeight: 700,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					Impressum
					<IconButton size="small" onClick={() => setImpOpen(false)}>
						<CloseIcon fontSize="small" />
					</IconButton>
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ py: 3 }}>
					<Typography variant="body2" color="text.secondary" gutterBottom>
						Angaben gemäß § 5 TMG
					</Typography>
					<Typography variant="body1" sx={{ fontWeight: 600, mt: 1 }}>
						Pascal Tomschi
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						ptom.de
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
						Diese Website ist ein privates, nicht-kommerzielles Hobby-Projekt.
					</Typography>
					<Divider sx={{ my: 2 }} />
					<Typography variant="body2" color="text.secondary">
						Quellcode:{" "}
						<Link href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
							{GITHUB_REPO}
						</Link>
					</Typography>
				</DialogContent>
			</Dialog>
		</>
	);
}
