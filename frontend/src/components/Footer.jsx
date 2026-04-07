import React, { useEffect, useState } from "react";
import {
	Avatar,
	Box,
	Button,
	Chip,
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
import { useAuth } from "../auth/AuthContext";

const GITHUB_REPO = "https://github.com/pascatl/biketimer";
const GITHUB_ISSUE = `${GITHUB_REPO}/issues/new`;

function MatomoOptOut() {
	const [optedOut, setOptedOut] = useState(false);

	useEffect(() => {
		// Matomo may load asynchronously; poll briefly until available
		const check = () => {
			try {
				const tracker = window.Matomo?.getAsyncTracker();
				if (tracker) {
					setOptedOut(tracker.isUserOptedOut());
					return true;
				}
			} catch (_) {}
			return false;
		};
		if (!check()) {
			const id = setInterval(() => { if (check()) clearInterval(id); }, 300);
			return () => clearInterval(id);
		}
	}, []);

	const toggle = () => {
		try {
			window._paq = window._paq || [];
			if (optedOut) {
				window._paq.push(["forgetUserOptOut"]);
			} else {
				window._paq.push(["optUserOut"]);
			}
			setOptedOut(!optedOut);
		} catch (_) {}
	};

	return (
		<Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
			<Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
				{optedOut
					? "Sie werden derzeit nicht erfasst."
					: "Sie werden derzeit erfasst."}
			</Typography>
			<Button
				size="small"
				variant="outlined"
				onClick={toggle}
				sx={{
					fontSize: "0.72rem",
					textTransform: "none",
					borderColor: "rgba(0,0,0,0.2)",
					color: "text.secondary",
					"&:hover": { borderColor: "text.primary", color: "text.primary" },
					whiteSpace: "nowrap",
				}}
			>
				{optedOut ? "Erfassung erlauben" : "Erfassung deaktivieren"}
			</Button>
		</Box>
	);
}

export default function Footer() {
	const [impOpen, setImpOpen] = useState(false);
	const [dseOpen, setDseOpen] = useState(false);
	const { user, authenticated } = useAuth();
	const userName = user?.name || user?.preferred_username || "";
	const isAdmin = user?.is_admin || false;

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
					justifyContent: "space-between",
					zIndex: 1100,
				}}
			>
				{/* Left: Impressum + Datenschutz */}
				<Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start", gap: 1.5 }}>
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
					<Button
						variant="text"
						size="small"
						onClick={() => setDseOpen(true)}
						sx={{
							color: "text.secondary",
							textTransform: "none",
							fontSize: "0.75rem",
							p: 0,
							minWidth: 0,
							"&:hover": { color: "text.primary", background: "none" },
						}}
					>
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
			{/* Datenschutzerklärung Dialog */}
			<Dialog
				open={dseOpen}
				onClose={() => setDseOpen(false)}
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
					Datenschutzerklärung
					<IconButton size="small" onClick={() => setDseOpen(false)}>
						<CloseIcon fontSize="small" />
					</IconButton>
				</DialogTitle>
				<Divider />
				<DialogContent sx={{ py: 3 }}>

					<Typography variant="body2" color="text.secondary" gutterBottom>
						Stand: April 2026
					</Typography>

					{/* Verantwortlicher */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2 }}>1. Verantwortlicher</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Pascal Tomschi, ptom.de<br />
						Dieses Angebot ist ein privates, nicht-kommerzielles Hobby-Projekt.
					</Typography>

					<Divider sx={{ my: 2 }} />

					{/* Hosting & Infrastruktur */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>2. Hosting &amp; Infrastruktur</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Die Anwendung wird auf einem von Strato betriebenen Server in Deutschland gehostet. Alle Daten
						verbleiben auf diesem Server und werden nicht an Dritte übertragen.
					</Typography>

					<Divider sx={{ my: 2 }} />

					{/* Nutzerkonto & Authentifizierung */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>3. Nutzerkonto &amp; Authentifizierung</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Die Anmeldung erfolgt über Keycloak (selbst gehostet unter auth.ptom.de).
						Dabei werden Name und E-Mail-Adresse gespeichert, ausschließlich um
						Fahrttermine zu verwalten und Einladungen zu versenden.
						Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
					</Typography>

					<Divider sx={{ my: 2 }} />

					{/* Analyse */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>4. Nutzungsanalyse (Matomo)</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Diese Website nutzt Matomo, eine selbst gehostete Open-Source-Software zur
						Webanalyse (analytics.ptom.de). Es werden keine Cookies gesetzt. IP-Adressen
						werden vor der Speicherung anonymisiert (letztes Oktett entfernt). Die
						erhobenen Daten (aufgerufene Seiten, Interaktionen, gekürzte IP, Browser-Typ)
						verbleiben ausschließlich auf dem eigenen Server und werden nicht
						weitergegeben. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
						Interesse an der Verbesserung des Angebots).
					</Typography>
					<MatomoOptOut />

					<Divider sx={{ my: 2 }} />

					{/* Push-Benachrichtigungen */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>5. Push-Benachrichtigungen</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Auf Wunsch können Push-Benachrichtigungen aktiviert werden. Dabei wird ein
						gerätespezifisches Abonnement (Push-Subscription) auf dem Server gespeichert.
						Das Abonnement kann jederzeit in den Benachrichtigungseinstellungen oder in
						den Browser-Einstellungen widerrufen werden.
						Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
					</Typography>

					<Divider sx={{ my: 2 }} />

					{/* E-Mail */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>6. E-Mail-Benachrichtigungen</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Einladungen zu Fahrtterminen werden per E-Mail versandt. Die E-Mail-Adresse
						wird ausschließlich für diesen Zweck genutzt. Der Versand erfolgt über einen
						selbst betriebenen SMTP-Server.
					</Typography>

					<Divider sx={{ my: 2 }} />

					{/* Betroffenenrechte */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>7. Ihre Rechte</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
						Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
						der Verarbeitung sowie Datenübertragbarkeit. Bei Fragen oder Anfragen
						wenden Sie sich an:{" "}
						<Link href="mailto:mail@ptom.de">mail@ptom.de</Link>.
					</Typography>

				</DialogContent>
			</Dialog>
		</>
	);
}
