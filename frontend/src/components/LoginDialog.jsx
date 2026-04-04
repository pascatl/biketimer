import React, { useState } from "react";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../auth/AuthContext";

export default function LoginDialog() {
	const { loginOpen, closeLogin, login, authenticated, restoring } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e?.preventDefault();
		if (!username || !password) return;
		setLoading(true);
		setError("");
		try {
			await login(username, password);
			setUsername("");
			setPassword("");
		} catch (err) {
			setError(err.message || "Anmeldung fehlgeschlagen");
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (loading) return;
		setError("");
		setUsername("");
		setPassword("");
		closeLogin();
	};

	return (
		<Dialog
			open={loginOpen && !restoring}
			onClose={authenticated ? handleClose : undefined}
			disableEscapeKeyDown={!authenticated}
			maxWidth="xs"
			fullWidth
			slotProps={{
				backdrop: {
					sx: !authenticated
						? {
								bgcolor: "primary.main",
								backgroundImage:
									"radial-gradient(circle at 50% 30%, rgba(229,186,65,0.08) 0%, transparent 60%)",
							}
						: {},
				},
			}}
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: "hidden",
					boxShadow: "0 16px 48px rgba(45,60,89,0.22)",
				},
			}}
		>
			{/* ── Header strip ── */}
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
					<DirectionsBikeIcon sx={{ fontSize: 22, color: "#E5BA41" }} />
				</Box>
				<Box sx={{ flex: 1 }}>
					<Typography
						variant="h6"
						sx={{ fontWeight: 700, color: "#fff", lineHeight: 1.2 }}
					>
						Anmelden
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "rgba(255,255,255,0.65)", letterSpacing: 1.5 }}
					>
						BIKETIMER
					</Typography>
				</Box>
				{authenticated && (
					<IconButton
						onClick={handleClose}
						disabled={loading}
						size="small"
						sx={{
							color: "rgba(255,255,255,0.6)",
							"&:hover": { color: "#fff" },
						}}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				)}
			</Box>

			<Divider sx={{ borderColor: "#E5BA41", borderBottomWidth: 3 }} />

			{/* ── Form ── */}
			<DialogContent sx={{ px: 3, py: 3 }}>
				<Box component="form" onSubmit={handleSubmit}>
					<Stack spacing={2}>
						{error && (
							<Alert
								severity="error"
								onClose={() => setError("")}
								sx={{ borderRadius: 2 }}
							>
								{error}
							</Alert>
						)}

						<TextField
							label="Benutzername oder E-Mail"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							size="small"
							fullWidth
							autoFocus
							autoComplete="username"
							disabled={loading}
							InputProps={{ sx: { borderRadius: 2 } }}
						/>

						<TextField
							label="Passwort"
							type={showPw ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							size="small"
							fullWidth
							autoComplete="current-password"
							disabled={loading}
							InputProps={{
								sx: { borderRadius: 2 },
								endAdornment: (
									<InputAdornment position="end">
										<IconButton
											onClick={() => setShowPw((v) => !v)}
											edge="end"
											size="small"
											tabIndex={-1}
										>
											{showPw ? (
												<VisibilityOffIcon fontSize="small" />
											) : (
												<VisibilityIcon fontSize="small" />
											)}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>

						<Button
							type="submit"
							variant="contained"
							disableElevation
							fullWidth
							disabled={loading || !username || !password}
							sx={{
								bgcolor: "#E5BA41",
								color: "#2D3C59",
								fontWeight: 700,
								borderRadius: 2,
								py: 1,
								fontSize: "0.95rem",
								mt: 0.5,
								"&:hover": { bgcolor: "#d4a92e" },
								"&.Mui-disabled": {
									bgcolor: "rgba(229,186,65,0.35)",
									color: "rgba(45,60,89,0.5)",
								},
							}}
						>
							{loading ? (
								<CircularProgress size={20} sx={{ color: "#2D3C59" }} />
							) : (
								"Anmelden"
							)}
						</Button>
					</Stack>
				</Box>
			</DialogContent>
		</Dialog>
	);
}
