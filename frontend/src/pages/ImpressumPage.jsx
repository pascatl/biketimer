import React from "react";
import { Box, Button, Container, Divider, Link, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

function Section({ title, children }) {
	return (
		<>
			<Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 3 }}>
				{title}
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
				{children}
			</Typography>
		</>
	);
}

export default function ImpressumPage() {
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
					Impressum
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					Angaben gemäß § 5 DDG
				</Typography>

				<Divider sx={{ my: 2 }} />

				<Typography variant="body2" color="text.secondary">
					Pascal Tomschi
					<br />
					Hänflingweg 5
					<br />
					91056 Erlangen
				</Typography>

				<Section title="Vertreten durch:">
					Pascal Tomschi
				</Section>

				<Section title="Kontakt:">
					E-Mail: <Link href="mailto:biketimer@ptom.de">biketimer@ptom.de</Link>
				</Section>

				<Divider sx={{ my: 2 }} />

				<Section title="Haftungsausschluss">
					{""}
				</Section>

				<Section title="Haftung für Inhalte">
					Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die
					Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine
					Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene
					Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8
					bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte
					oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
					forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur
					Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
					Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst
					ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
					Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte
					umgehend entfernen.
				</Section>

				<Section title="Haftung für Links">
					Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir
					keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
					Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
					Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden
					zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
					Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente
					inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte
					einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen
					werden wir derartige Links umgehend entfernen.
				</Section>

				<Section title="Urheberrecht">
					Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
					unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
					Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
					bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
					Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
					Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber
					erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden
					Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine
					Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden
					Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte
					umgehend entfernen.
				</Section>

			</Container>
		</Box>
	);
}
