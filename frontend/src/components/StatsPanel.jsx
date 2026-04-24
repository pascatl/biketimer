import React, { useEffect, useState } from "react";
import {
	Box,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Tooltip as ChartTooltip,
	Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { fetchStats } from "../api";

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

const MEDAL_COLORS = ["#E5BA41", "#A0A0A0", "#CD7F32"];

export default function StatsPanel({ open, onClose }) {
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!open) return;
		setLoading(true);
		fetchStats()
			.then(setStats)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [open]);

	if (!open) return null;

	const ranking = stats?.ranking || [];
	const myStats = stats?.my_stats || {};
	const totalEvents = stats?.total_events || 0;

	const chartData = {
		labels: ranking.map((r) => r.name),
		datasets: [
			{
				label: "Teilnahmen",
				data: ranking.map((r) => r.participations),
				backgroundColor: ranking.map((_, i) =>
					i < 3 ? MEDAL_COLORS[i] : "rgba(45,60,89,0.6)",
				),
				borderRadius: 6,
				maxBarThickness: 40,
			},
		],
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					label: (ctx) => `${ctx.raw} Teilnahme${ctx.raw !== 1 ? "n" : ""}`,
				},
			},
		},
		scales: {
			x: {
				ticks: {
					font: { family: '"Josefin Sans", sans-serif', weight: 600, size: 12 },
					color: "#2D3C59",
				},
				grid: { display: false },
			},
			y: {
				beginAtZero: true,
				ticks: {
					stepSize: 1,
					font: { family: '"Josefin Sans", sans-serif', size: 11 },
					color: "#999",
				},
				grid: { color: "rgba(45,60,89,0.06)" },
			},
		},
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
		>
			{/* Header */}
			<Box
				sx={{
					bgcolor: "primary.main",
					px: 3,
					py: 2,
					display: "flex",
					alignItems: "center",
					gap: 1.5,
				}}
			>
				<EmojiEventsIcon sx={{ color: "#E5BA41", fontSize: 26 }} />
				<Typography
					variant="h6"
					sx={{ fontWeight: 700, color: "#fff", flex: 1, lineHeight: 1.2 }}
				>
					Statistiken
				</Typography>
				<IconButton
					onClick={onClose}
					size="small"
					sx={{
						color: "rgba(255,255,255,0.6)",
						"&:hover": { color: "#fff" },
					}}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
			</Box>
			<Divider sx={{ borderColor: "#E5BA41", borderBottomWidth: 3 }} />

			<DialogContent sx={{ px: 3, py: 3 }}>
				{loading ? (
					<Typography
						color="text.secondary"
						sx={{ textAlign: "center", py: 4 }}
					>
						Laden...
					</Typography>
				) : (
					<Stack spacing={3}>
						{/* Overview cards */}
						<Box
							sx={{
								display: "flex",
								gap: 2,
								flexWrap: "wrap",
							}}
						>
							<Paper
								elevation={0}
								sx={{
									flex: 1,
									minWidth: 120,
									p: 2,
									borderRadius: 2,
									border: "1px solid rgba(45,60,89,0.1)",
									textAlign: "center",
								}}
							>
								<Typography
									variant="h4"
									sx={{ fontWeight: 700, color: "primary.main" }}
								>
									{totalEvents}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Vergangene Events
								</Typography>
							</Paper>
							<Paper
								elevation={0}
								sx={{
									flex: 1,
									minWidth: 120,
									p: 2,
									borderRadius: 2,
									border: "1px solid rgba(148,163,120,0.3)",
									bgcolor: "rgba(148,163,120,0.05)",
									textAlign: "center",
								}}
							>
								<Typography
									variant="h4"
									sx={{ fontWeight: 700, color: "#94A378" }}
								>
									{myStats.accepted || 0}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Meine Teilnahmen
								</Typography>
							</Paper>
							<Paper
								elevation={0}
								sx={{
									flex: 1,
									minWidth: 120,
									p: 2,
									borderRadius: 2,
									border: "1px solid rgba(229,186,65,0.3)",
									bgcolor: "rgba(229,186,65,0.05)",
									textAlign: "center",
								}}
							>
								<Typography
									variant="h4"
									sx={{ fontWeight: 700, color: "#E5BA41" }}
								>
									{myStats.pending || 0}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Ausstehend
								</Typography>
							</Paper>
						</Box>

						{/* Ranking chart */}
						{ranking.length > 0 && (
							<Box>
								<Typography
									variant="subtitle1"
									sx={{
										fontWeight: 700,
										mb: 2,
										color: "text.primary",
										display: "flex",
										alignItems: "center",
										gap: 1,
									}}
								>
									<EmojiEventsIcon sx={{ fontSize: 20, color: "#E5BA41" }} />
									Rangliste
								</Typography>
								<Box sx={{ height: Math.max(200, ranking.length * 30 + 60) }}>
									<Bar data={chartData} options={chartOptions} />
								</Box>
							</Box>
						)}

						{/* Top 3 podium */}
						{ranking.length > 0 && (
							<Box>
								<Typography
									variant="subtitle2"
									sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}
								>
									Top-Teilnehmer
								</Typography>
								<Stack spacing={0.5}>
									{ranking.slice(0, 10).map((r, i) => (
										<Box
											key={r.user_id}
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1.5,
												py: 0.75,
												px: 1.5,
												borderRadius: 2,
												bgcolor: i < 3 ? `${MEDAL_COLORS[i]}18` : "transparent",
											}}
										>
											<Typography
												sx={{
													fontWeight: 700,
													minWidth: 24,
													color: i < 3 ? MEDAL_COLORS[i] : "text.secondary",
													fontSize: i < 3 ? "1.1rem" : "0.9rem",
												}}
											>
												{i + 1}.
											</Typography>
											<Typography
												sx={{
													flex: 1,
													fontWeight: i < 3 ? 700 : 400,
													color: "text.primary",
												}}
											>
												{r.name}
											</Typography>
											<Typography
												sx={{
													fontWeight: 700,
													color: i < 3 ? MEDAL_COLORS[i] : "text.secondary",
												}}
											>
												{r.participations}
											</Typography>
										</Box>
									))}
								</Stack>
							</Box>
						)}
					</Stack>
				)}
			</DialogContent>
		</Dialog>
	);
}
