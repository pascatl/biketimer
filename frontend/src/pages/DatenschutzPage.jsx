import React from "react";
import { Box, Button, Container, Divider, Link, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import MatomoOptOut from "../components/MatomoOptOut";

export default function DatenschutzPage() {
	const navigate = useNavigate();

	return (
		<Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 5 }}>
			<Container maxWidth="sm">
				<Button
					startIcon={<ArrowBackIcon />}
					size="small"
					onClick={() => navigate(-1)}
					sx={{
						mb: 3,
						color: "text.secondary",
						textTransform: "none",
						fontSize: "0.85rem",
						"&:hover": { bgcolor: "rgba(45,60,89,0.06)" },
					}}
				>
					Zurück
				</Button>

				<Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
					Datenschutzerklärung
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					Stand: April 2026
				</Typography>

				<Divider sx={{ my: 2 }} />

				{/* 1 */}
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
					1. Verantwortlicher
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Pascal Tomschi, ptom.de
					<br />
					Dieses Angebot ist ein privates, nicht-kommerzielles Hobby-Projekt.
				</Typography>

				<Divider sx={{ my: 2 }} />

				{/* 2 */}
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
					2. Hosting &amp; Infrastruktur
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Die Anwendung wird auf einem selbst betriebenen Server gehostet. Alle Daten
					verbleiben auf diesem Server und werden nicht an Dritte übertragen.
				</Typography>

				<Divider sx={{ my: 2 }} />

				{/* 3 */}
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
					3. Nutzerkonto &amp; Authentifizierung
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Die Anmeldung erfolgt über Keycloak (selbst gehostet unter auth.ptom.de).
					Dabei werden Name und E-Mail-Adresse gespeichert, ausschließlich um
					Fahrttermine zu verwalten und Einladungen zu versenden. Rechtsgrundlage:
					Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
				</Typography>

				<Divider sx={{ my: 2 }} />

				{/* 4 */}
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
					4. Nutzungsanalyse (Matomo)
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Diese Website nutzt Matomo, eine selbst gehostete Open-Source-Software zur
					Webanalyse (analytics.ptom.de). Es werden keine Cookies gesetzt. IP-Adressen
					werden vor der Speicherung anonymisiert (letztes Oktett entfernt). Die
					erhobenen Daten (aufgerufene Seiten, Interaktionen, gekürzte IP, Browser-Typ)
					verbleiben ausschließlich auf dem eigenen Server und werden nicht weitergegeben.
					Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der
					Verbesserung des Angebots).
				</Typography>
				<MatomoOptOut />

				<Divider sx={{ my: 2 }} />

				{/* 5 */}
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
					5. Push-Benachrichtigungen
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Auf Wunsch können Push-Benachrichtigungen aktiviert werden. Dabei wird ein
					gerätespezifisches Abonnement (Push-Subscription) auf dem Server gespeichert.
					Das Abonnement kann jederzeit in den Benachrichtigungseinstellungen oder in
					den Browser-Einstellungen widerrufen werden. Rechtsgrundlage: Art. 6 Abs. 1
					lit. a DSGVO (Einwilligung).
				</Typography>

				<Divider sx={{ my: 2 }} />

				{/* 6 */}
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
					6. E-Mail-Benachrichtigungen
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Einladungen zu Fahrtterminen werden per E-Mail versandt. Die E-Mail-Adresse
					wird ausschließlich für diesen Zweck genutzt. Der Versand erfolgt über einen
					selbst betriebenen SMTP-Server.
				</Typography>

				<Divider sx={{ my: 2 }} />

				{/* 7 */}
				<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
					7. Ihre Rechte
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
					Verarbeitung sowie Datenübertragbarkeit. Bei Fragen oder Anfragen wenden Sie
					sich an: <Link href="mailto:mail@ptom.de">mail@ptom.de</Link>.
				</Typography>
			</Container>
		</Box>
	);
}
