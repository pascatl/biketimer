import React from "react";
import {
	Avatar,
	Box,
	Button,
	Chip,
	IconButton,
	Link,
	Tooltip,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import BugReportIcon from "@mui/icons-material/BugReport";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const GITHUB_REPO = "https://github.com/pascatl/biketimer";
const GITHUB_ISSUE = `${GITHUB_REPO}/issues/new`;

export default function Footer() {
	const navigate = useNavigate();
	const { user, authenticated } = useAuth();
	const userName = user?.name || user?.preferred_username || "";
	const isAdmin = user?.is_admin || false;

	const linkSx = {
		color: "text.secondary",
		textTransform: "none",
		fontSize: "0.75rem",
		p: 0,
		minWidth: 0,
		"&:hover": { color: "text.primary", background: "none" },
	};

	return (
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
				justifyContent: "space-between",
				zIndex: 1100,
			}}
		>
			{/* Left: Impressum + Datenschutz */}
			<Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start", gap: 1.5 }}>
				<Button variant="text" size="small" onClick={() => navigate("/impressum")} sx={linkSx}>
					Impressum
				</Button>
				<Button variant="text" size="small" onClick={() => navigate("/datenschutz")} sx={linkSx}>
					Datenschutz
				</Button>
			</Box>

			{/* Center: GitHub links */}
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

			{/* Right: user chip */}
			<Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
				{authenticated && userName && (
					<Chip
						avatar={
							<Avatar sx={{ fontSize: "0.7rem !important" }}>
								{userName.charAt(0).toUpperCase()}
							</Avatar>
						}
						label={isAdmin ? `${userName} (Admin)` : userName}
						size="small"
						sx={{
							ml: 0.5,
							fontWeight: 600,
							fontSize: "0.75rem",
							color: "text.secondary",
						}}
					/>
				)}
			</Box>
		</Box>
	);
}
