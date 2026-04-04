import React, { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Box,
	Chip,
	Divider,
	Stack,
	Typography,
	IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { de } from "date-fns/locale";
import { nextDay, addWeeks, startOfDay, format } from "date-fns";

// Nächste N Freitage (Wochentag 5 = Freitag)
function getNextFridays(count = 6) {
	const today = startOfDay(new Date());
	const fridays = [];
	let f = nextDay(today, 5);
	// Falls heute Freitag ist, trotzdem den nächsten nehmen
	for (let i = 0; i < count; i++) {
		fridays.push(addWeeks(f, i));
	}
	return fridays;
}

function toIso(date) {
	return format(date, "yyyy-MM-dd");
}

function toDisplay(isoStr) {
	if (!isoStr) return "";
	const d = new Date(isoStr + "T00:00:00");
	return d.toLocaleDateString("de-DE", {
		weekday: "short",
		day: "2-digit",
		month: "2-digit",
	});
}

export default function ControlButtons(props) {
	const [addOpen, setAddOpen] = useState(false);
	const [selectedDate, setSelectedDate] = useState(null);
	const [selectedTime, setSelectedTime] = useState(null);
	const [activePreset, setActivePreset] = useState(null);

	const fridays = getNextFridays(6);

	const handlePreset = (date) => {
		setSelectedDate(date);
		setActivePreset(toIso(date));
	};

	const handlePickerChange = (date) => {
		setSelectedDate(date);
		setActivePreset(null);
	};

	const handleAddEvent = () => {
		if (!selectedDate) return;
		const isoDate = toIso(selectedDate);
		const isoTime = selectedTime ? format(selectedTime, "HH:mm") : null;
		const new_event = {
			id: props.defaultEvent.id,
			event_data: {
				...props.defaultEvent.event_data,
				event_date: isoDate,
				...(isoTime && { event_startTime: isoTime }),
			},
		};
		props.onAddEvent(new_event);
		setAddOpen(false);
		setSelectedDate(null);
		setSelectedTime(null);
		setActivePreset(null);
	};

	const handleClose = () => {
		setAddOpen(false);
		setSelectedDate(null);
		setSelectedTime(null);
		setActivePreset(null);
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
			<Button
				variant="contained"
				onClick={() => setAddOpen(true)}
				startIcon={<AddIcon />}
				disableElevation
				sx={{
					bgcolor: "#E5BA41",
					color: "#2D3C59",
					fontWeight: 700,
					borderRadius: 2,
					px: 2,
					py: 0.75,
					fontSize: "0.85rem",
					"&:hover": { bgcolor: "#d4a92e" },
				}}
			>
				Termin
			</Button>

			<Dialog
				open={addOpen}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				PaperProps={{
					sx: { borderRadius: 3, boxShadow: "0 8px 32px rgba(45,60,89,0.18)" },
				}}
			>
				<DialogTitle sx={{ fontWeight: 700, color: "text.primary", pr: 6 }}>
					Neuen Termin anlegen
					<IconButton
						onClick={handleClose}
						size="small"
						sx={{
							position: "absolute",
							right: 12,
							top: 12,
							color: "text.secondary",
						}}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				</DialogTitle>

				<DialogContent sx={{ pt: 0 }}>
					<Stack spacing={2.5}>
						{/* Schnellauswahl */}
						<Box>
							<Typography
								variant="body2"
								sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}
							>
								Nächste Freitage
							</Typography>
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
								{fridays.map((d) => {
									const iso = toIso(d);
									const isActive = activePreset === iso;
									return (
										<Chip
											key={iso}
											label={d.toLocaleDateString("de-DE", {
												day: "2-digit",
												month: "2-digit",
											})}
											onClick={() => handlePreset(d)}
											color={isActive ? "primary" : "default"}
											variant={isActive ? "filled" : "outlined"}
											size="small"
											sx={{ fontWeight: isActive ? 700 : 500 }}
										/>
									);
								})}
							</Box>
						</Box>

						<Divider />

{/* DatePicker + TimePicker */}
					<Box>
						<Typography
							variant="body2"
							sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}
						>
							Eigenes Datum
						</Typography>
						<DatePicker
							label="Datum wählen"
							value={selectedDate}
							onChange={handlePickerChange}
							slotProps={{ textField: { size: "small", fullWidth: true } }}
						/>
					</Box>

					{/* TimePicker */}
					<Box>
						<Typography
							variant="body2"
							sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}
						>
							Uhrzeit (optional)
						</Typography>
						<TimePicker
							label="Uhrzeit wählen"
							value={selectedTime}
							onChange={setSelectedTime}
							ampm={false}
							slotProps={{ textField: { size: "small", fullWidth: true } }}
						/>
						</Box>

						{/* Auswahl-Anzeige + Bestätigen */}
						{selectedDate && (
							<Box
								sx={{
									bgcolor: "rgba(45,60,89,0.05)",
									borderRadius: 2,
									px: 2,
									py: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
								}}
							>
								<Box>
									<Typography
										variant="caption"
										sx={{
											color: "text.secondary",
											fontWeight: 600,
											textTransform: "uppercase",
											letterSpacing: 0.8,
										}}
									>
										Gewählt
									</Typography>
									<Typography
										variant="body1"
										sx={{ fontWeight: 700, color: "primary.main" }}
									>
										{selectedDate.toLocaleDateString("de-DE", {
											weekday: "long",
											day: "2-digit",
											month: "long",
										})}
									</Typography>								{selectedTime && (
									<Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
										{format(selectedTime, "HH:mm")} Uhr
									</Typography>
								)}								</Box>
								<Button
									variant="contained"
									disableElevation
									onClick={handleAddEvent}
									sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
								>
									Anlegen
								</Button>
							</Box>
						)}
					</Stack>
				</DialogContent>
			</Dialog>
		</LocalizationProvider>
	);
}
