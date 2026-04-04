import React, { useState } from "react";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogContent,
	Divider,
	FormControlLabel,
	IconButton,
	InputAdornment,
	Link,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../auth/AuthContext";
import { registerUser } from "../api";
import { KC_REALM } from "../auth/AuthService";

const RESET_URL = `/kc/realms/${KC_REALM}/login-actions/reset-credentials`;

export default function LoginDialog() {
	const { loginOpen, closeLogin, login, authenticated, restoring } = useAuth();

	// mode: "login" | "register"
	const [mode, setMode] = useState("login");

	// Login fields
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);

	// Register fields
	const [regUsername, setRegUsername] = useState("");
	const [regEmail, setRegEmail] = useState("");
	const [regDisplayName, setRegDisplayName] = useState("");
	const [regPassword, setRegPassword] = useState("");
	const [regPassword2, setRegPassword2] = useState("");
	const [showRegPw, setShowRegPw] = useState(false);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const reset = () => {
		setUsername(""); setPassword(""); setShowPw(false);
		setRegUsername(""); setRegEmail(""); setRegDisplayName("");
		setRegPassword(""); setRegPassword2(""); setShowRegPw(false);
		setError(""); setSuccess("");
	};

	const switchMode = (m) => {
		reset();
		setMode(m);
	};

	const handleLogin = async (e) => {
		e?.preventDefault();
		if (!username || !password) return;
		setLoading(true);
		setError("");
		try {
			await login(username, password, rememberMe);
			reset();
		} catch (err) {
			setError(err.message || "Anmeldung fehlgeschlagen");
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = async (e) => {
		e?.preventDefault();
		if (!regUsername || !regPassword) return;
		if (regPassword !== regPassword2) {
			setError("Passwörter stimmen nicht überein");
			return;
		}
		setLoading(true);
		setError("");
		try {
			await registerUser({
				username: regUsername,
				email: regEmail,
				password: regPassword,
				display_name: regDisplayName,
			});
			// Auto-login immediately after registration
			await login(regUsername, regPassword, rememberMe);
			reset();
		} catch (err) {
			setError(err.message || "Registrierung fehlgeschlagen");
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (loading) return;
		reset();
		closeLogin();
	};

	const isLogin = mode === "login";

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
						{isLogin ? "Anmelden" : "Registrieren"}
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
				{isLogin ? (
					<Box component="form" onSubmit={handleLogin}>
						<Stack spacing={2}>
							{error && (
								<Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
									{error}
								</Alert>
							)}
							{success && (
								<Alert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>
									{success}
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
											<IconButton onClick={() => setShowPw((v) => !v)} edge="end" size="small" tabIndex={-1}>
												{showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>

							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: -0.5 }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={rememberMe}
											onChange={(e) => setRememberMe(e.target.checked)}
											size="small"
											sx={{ color: "#E5BA41", "&.Mui-checked": { color: "#E5BA41" } }}
										/>
									}
									label={<Typography variant="body2" sx={{ fontSize: "0.8rem" }}>Angemeldet bleiben</Typography>}
								/>
								<Link
									href={RESET_URL}
									target="_blank"
									rel="noopener noreferrer"
									variant="body2"
									sx={{ fontSize: "0.8rem", color: "text.secondary", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
								>
									Passwort vergessen?
								</Link>
							</Box>

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
									"&.Mui-disabled": { bgcolor: "rgba(229,186,65,0.35)", color: "rgba(45,60,89,0.5)" },
								}}
							>
								{loading ? <CircularProgress size={20} sx={{ color: "#2D3C59" }} /> : "Anmelden"}
							</Button>

							<Button
								variant="text"
								size="small"
								onClick={() => switchMode("register")}
								sx={{ color: "text.secondary", textTransform: "none", mt: -0.5 }}
							>
								Noch kein Konto? Jetzt registrieren
							</Button>
						</Stack>
					</Box>
				) : (
					<Box component="form" onSubmit={handleRegister}>
						<Stack spacing={2}>
							{error && (
								<Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
									{error}
								</Alert>
							)}

							<TextField
								label="Benutzername *"
								value={regUsername}
								onChange={(e) => setRegUsername(e.target.value)}
								size="small"
								fullWidth
								autoFocus
								autoComplete="username"
								disabled={loading}
								helperText="Wird zum Einloggen verwendet"
								InputProps={{ sx: { borderRadius: 2 } }}
							/>

							<TextField
								label="Anzeigename"
								value={regDisplayName}
								onChange={(e) => setRegDisplayName(e.target.value)}
								size="small"
								fullWidth
								disabled={loading}
								helperText="Wie du in der App erscheinst (optional, Standard = Benutzername)"
								InputProps={{ sx: { borderRadius: 2 } }}
							/>

							<TextField
								label="E-Mail"
								type="email"
								value={regEmail}
								onChange={(e) => setRegEmail(e.target.value)}
								size="small"
								fullWidth
								autoComplete="email"
								disabled={loading}
								InputProps={{ sx: { borderRadius: 2 } }}
							/>

							<TextField
								label="Passwort *"
								type={showRegPw ? "text" : "password"}
								value={regPassword}
								onChange={(e) => setRegPassword(e.target.value)}
								size="small"
								fullWidth
								autoComplete="new-password"
								disabled={loading}
								InputProps={{
									sx: { borderRadius: 2 },
									endAdornment: (
										<InputAdornment position="end">
											<IconButton onClick={() => setShowRegPw((v) => !v)} edge="end" size="small" tabIndex={-1}>
												{showRegPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>

							<TextField
								label="Passwort bestätigen *"
								type={showRegPw ? "text" : "password"}
								value={regPassword2}
								onChange={(e) => setRegPassword2(e.target.value)}
								size="small"
								fullWidth
								autoComplete="new-password"
								disabled={loading}
								InputProps={{ sx: { borderRadius: 2 } }}
							/>

							<Button
								type="submit"
								variant="contained"
								disableElevation
								fullWidth
								disabled={loading || !regUsername || !regPassword || !regPassword2}
								sx={{
									bgcolor: "#E5BA41",
									color: "#2D3C59",
									fontWeight: 700,
									borderRadius: 2,
									py: 1,
									fontSize: "0.95rem",
									mt: 0.5,
									"&:hover": { bgcolor: "#d4a92e" },
									"&.Mui-disabled": { bgcolor: "rgba(229,186,65,0.35)", color: "rgba(45,60,89,0.5)" },
								}}
							>
								{loading ? <CircularProgress size={20} sx={{ color: "#2D3C59" }} /> : "Registrieren"}
							</Button>

							<Button
								variant="text"
								size="small"
								onClick={() => switchMode("login")}
								sx={{ color: "text.secondary", textTransform: "none", mt: -0.5 }}
							>
								Bereits registriert? Anmelden
							</Button>
						</Stack>
					</Box>
				)}
			</DialogContent>
		</Dialog>
	);
}
