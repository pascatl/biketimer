import React from "react";
import { Box, Button, Container, Divider, Link, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const GITHUB_REPO = "https://github.com/pascatl/biketimer";

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
					Angaben gemäß § 5 TMG
				</Typography>

				<Divider sx={{ my: 2 }} />

				<Typography variant="body1" sx={{ fontWeight: 600 }}>
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
			</Container>
		</Box>
	);
}
