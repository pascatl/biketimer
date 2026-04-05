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
TextField,
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
import { format } from "date-fns";
import MeetingPointPicker from "./MeetingPointPicker";

// Default event title per sport-type key
const TYPE_DEFAULT_TITLES = {
rennrad: "Rennradrunde",
mtb: "MTB",
beachen: "Beachen",
squash: "Squash"
};

function toIso(date) {
return format(date, "yyyy-MM-dd");
}

function getDefaultTitle(typeKey) {
return TYPE_DEFAULT_TITLES[typeKey] || "";
}

const DEFAULT_TIME = (() => { const d = new Date(); d.setHours(17, 0, 0, 0); return d; })();

export default function ControlButtons(props) {
const sportTypes = props.sportTypes || {};
const firstTypeKey = Object.keys(sportTypes)[0] || "rennrad";

const [addOpen, setAddOpen] = useState(false);
const [selectedDate, setSelectedDate] = useState(null);
const [selectedTime, setSelectedTime] = useState(DEFAULT_TIME);
const [selectedTitle, setSelectedTitle] = useState(getDefaultTitle(firstTypeKey));
const [selectedType, setSelectedType] = useState(firstTypeKey);
const [selectedMeetingText, setSelectedMeetingText] = useState("");
const [selectedMeetingLat, setSelectedMeetingLat] = useState(null);
const [selectedMeetingLon, setSelectedMeetingLon] = useState(null);

const handleTypeChange = (key) => {
// Auto-update title only if it's still a default or empty
const currentIsDefault =
selectedTitle === "" ||
Object.values(TYPE_DEFAULT_TITLES).includes(selectedTitle);
if (currentIsDefault) {
setSelectedTitle(getDefaultTitle(key));
}
setSelectedType(key);
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
event_title: selectedTitle.trim(),
event_type: selectedType || firstTypeKey,
...(isoTime && { event_startTime: isoTime }),
event_meeting_text: selectedMeetingText,
event_meeting_lat: selectedMeetingLat,
event_meeting_lon: selectedMeetingLon,
},
};
props.onAddEvent(new_event);
setAddOpen(false);
setSelectedDate(null);
setSelectedTime(DEFAULT_TIME);
setSelectedTitle(getDefaultTitle(firstTypeKey));
setSelectedType(firstTypeKey);
setSelectedMeetingText("");
setSelectedMeetingLat(null);
setSelectedMeetingLon(null);
};

const handleClose = () => {
setAddOpen(false);
setSelectedDate(null);
setSelectedTime(DEFAULT_TIME);
setSelectedTitle(getDefaultTitle(firstTypeKey));
setSelectedType(firstTypeKey);
setSelectedMeetingText("");
setSelectedMeetingLat(null);
setSelectedMeetingLon(null);
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

{/* Event-Typ */}
{Object.keys(sportTypes).length > 0 && (
<Box>
<Typography
variant="body2"
sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}
>
Event-Typ
</Typography>
<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
{Object.entries(sportTypes).map(([key, val]) => {
const isActive = selectedType === key;
return (
<Chip
key={key}
label={val.label || val.alias || key}
clickable
onClick={() => handleTypeChange(key)}
variant={isActive ? "filled" : "outlined"}
sx={{
fontWeight: isActive ? 700 : 500,
bgcolor: isActive ? (val.color || "#2D3C59") : undefined,
color: isActive ? "#fff" : undefined,
borderColor: isActive ? (val.color || "#2D3C59") : undefined,
}}
/>
);
})}
</Box>
</Box>
)}

{/* Titel */}
<TextField
label="Titel"
value={selectedTitle}
onChange={(e) => setSelectedTitle(e.target.value)}
size="small"
fullWidth
inputProps={{ maxLength: 80 }}
/>

<Divider />

{/* Datum */}
<Box>
<Typography
variant="body2"
sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}
>
Datum
</Typography>
<DatePicker
label="Datum wählen"
value={selectedDate}
onChange={(date) => setSelectedDate(date)}
slotProps={{ textField: { size: "small", fullWidth: true } }}
/>
</Box>

{/* Uhrzeit */}
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

<Divider />

{/* Treffpunkt */}
<Box>
<Typography variant="body2" sx={{ color: "text.secondary", mb: 1, fontWeight: 600 }}>
Treffpunkt
</Typography>
<MeetingPointPicker
lat={selectedMeetingLat}
lon={selectedMeetingLon}
text={selectedMeetingText}
onChangeLat={setSelectedMeetingLat}
onChangeLon={setSelectedMeetingLon}
onChangeText={setSelectedMeetingText}
/>
</Box>

{/* Bestätigen */}
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
month: "2-digit",
year: "2-digit",
})}
</Typography>
{selectedTime && (
<Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
{format(selectedTime, "HH:mm")} Uhr
</Typography>
)}
</Box>
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
