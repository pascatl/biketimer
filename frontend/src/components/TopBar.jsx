import React, { useState } from "react";
import {
	AppBar,
	Box,
	Button,
	Slide,
	Toolbar,
	Tooltip,
	Typography,
	useScrollTrigger,
} from "@mui/material";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import SettingsIcon from "@mui/icons-material/Settings";
import BarChartIcon from "@mui/icons-material/BarChart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ControlButtons from "./ControlButtons";
import { InboxButton } from "./InboxDrawer";
import NotifPrefsDrawer from "./NotifPrefsDrawer";
import { useAuth } from "../auth/AuthContext";

function HideOnScroll({ children }) {
	const trigger = useScrollTrigger();
	return (
		<Slide appear={false} direction="down" in={!trigger}>
			{children}
		</Slide>
	);
}

const TopBar = ({
	currentEvents,
	onAddEvent,
	defaultEvent,
	sportTypes,
	invitationCount,
	isAdmin,
	onAdminOpen,
	onStatsOpen,
	onInboxOpen,
}) => {
	const { authenticated, openLogin, logout } = useAuth();
	const [notifOpen, setNotifOpen] = useState(false);

	const handleLogin = () => openLogin();
	const handleLogout = () => logout();

	return (
		<>
		<HideOnScroll>
			<AppBar
				position="fixed"
				elevation={0}
				sx={{
					bgcolor: "primary.main",
					borderBottom: "1px solid rgba(255,255,255,0.08)",
				}}
			>
				<Toolbar
					sx={{
						justifyContent: "space-between",
						px: { xs: 2, sm: 3 },
						minHeight: 64,
						gap: 1,
					}}
				>
					{/* ── Left: logo + title ── */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<Box
							sx={{
								bgcolor: "rgba(255,255,255,0.12)",
								borderRadius: 2,
								p: 0.75,
								display: "flex",
								alignItems: "center",
							}}
						>
							<DirectionsBikeIcon sx={{ fontSize: 24, color: "#E5BA41" }} />
						</Box>
						<Typography
							variant="h6"
							component="div"
							sx={{
								fontWeight: 700,
								letterSpacing: 0.3,
								lineHeight: 1.2,
								color: "#fff",
								display: { xs: "none", sm: "block" },
							}}
						>
							Terminplaner
						</Typography>
					</Box>

					{/* ── Right: auth + add ── */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
{/* Inbox button */}
					{authenticated && (
						<InboxButton count={invitationCount} onClick={onInboxOpen} />
						)}
					{/* Notifications prefs button */}
					{authenticated && (
						<Tooltip title="Benachrichtigungseinstellungen">
							<Button
								size="small"
								onClick={() => setNotifOpen(true)}
								startIcon={<NotificationsIcon sx={{ fontSize: "1rem" }} />}
								sx={{
									color: "rgba(255,255,255,0.75)",
									fontWeight: 600,
									fontSize: "0.78rem",
									textTransform: "none",
									minWidth: 0,
									px: 1,
								}}
							/>
						</Tooltip>
					)}

						{authenticated ? (
							<>
								{isAdmin && (
									<Tooltip title="Admin-Bereich">
										<Button
											size="small"
											onClick={onAdminOpen}
											sx={{
												color: "rgba(255,255,255,0.75)",
												minWidth: 0,
												px: 0.75,
												"&:hover": { color: "#E5BA41" },
											}}
										>
											<SettingsIcon sx={{ fontSize: "1.2rem" }} />
										</Button>
									</Tooltip>
								)}
								<Tooltip title="Statistiken">
									<Button
										size="small"
										onClick={onStatsOpen}
										sx={{
											color: "rgba(255,255,255,0.75)",
											minWidth: 0,
											px: 0.75,
											"&:hover": { color: "#E5BA41" },
										}}
									>
										<BarChartIcon sx={{ fontSize: "1.2rem" }} />
									</Button>
								</Tooltip>
								<Tooltip title="Abmelden">
									<Button
										size="small"
										onClick={handleLogout}
										startIcon={
											<LogoutIcon sx={{ fontSize: "1rem " }} />
										}
										sx={{
											color: "rgba(255,255,255,0.75)",
											fontWeight: 600,
											fontSize: "0.78rem",
											textTransform: "none",
											minWidth: 0,
											px: 1,
										}}
									>
										<Box
											component="span"
											sx={{ display: { xs: "none", sm: "inline" } }}
										>
											Abmelden
										</Box>
									</Button>
								</Tooltip>
							</>
						) : (
							<Button
								size="small"
								variant="outlined"
								onClick={handleLogin}
								startIcon={<LoginIcon sx={{ fontSize: "1rem " }} />}
								sx={{
									color: "#fff",
									borderColor: "rgba(255,255,255,0.4)",
									fontWeight: 700,
									fontSize: "0.82rem",
									textTransform: "none",
									borderRadius: 2,
									px: 1.5,
									"&:hover": { borderColor: "#E5BA41", color: "#E5BA41" },
								}}
							>
								Anmelden
							</Button>
						)}

						{authenticated && (
							<ControlButtons
								currentEvents={currentEvents}
								onAddEvent={onAddEvent}
								defaultEvent={defaultEvent}							sportTypes={sportTypes}							/>
						)}
					</Box>
				</Toolbar>
			</AppBar>
		</HideOnScroll>
        <NotifPrefsDrawer
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                isAdmin={isAdmin}
        />
        </>
    );
};

export default TopBar;
