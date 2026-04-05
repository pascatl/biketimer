import React, { useEffect, useState } from "react";
import komootLogo from "../assets/Komoot_Sign_Primary_RGB.svg";
import stravaLogo from "../assets/strava.png";
import {
Box,
Button,
Chip,
CircularProgress,
Divider,
Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StraightenIcon from "@mui/icons-material/Straighten";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import axios from "axios";
import polyline from "@mapbox/polyline";

const API_URL_KOMOOT = "https://ptom.de/api/biketimer/komoot";
const API_URL_STRAVA = "https://ptom.de/api/biketimer/strava";

export default function RouteWidget({ link }) {
const [routeData, setRouteData] = useState(null);
const [routeConfig, setRouteConfig] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
if (!link) return;
setLoading(true);
setError(null);
setRouteData(null);

if (!URL.canParse(link)) { setRouteConfig(null); setLoading(false); return; }
const url = new URL(link);
const path = url.pathname.split("/");
const parts = url.hostname.split(".");
const host = parts[parts.length - 2];

if (host === "komoot") {
const share_token = url.searchParams.get("share_token");
const tour_id = path[path.length - 1];
if (tour_id && share_token) {
setRouteConfig({ service: "komoot", tour_id, share_token });
} else { setRouteConfig(null); setLoading(false); }
} else if (host === "strava") {
const route_id = path[path.length - 1];
if (route_id && path[path.length - 2] === "routes") {
setRouteConfig({ service: "strava", route_id });
} else { setRouteConfig(null); setLoading(false); }
} else { setRouteConfig(null); setLoading(false); }
}, [link]);

useEffect(() => {
if (!routeConfig?.service) return;
const fetchData = async () => {
try {
if (routeConfig.service === "komoot") {
const res = await axios.get(
`${API_URL_KOMOOT}?tour_id=${routeConfig.tour_id}&share_token=${routeConfig.share_token}`
);
const tour = res.data.page._embedded.tour;
const coords = tour._embedded?.coordinates?.items || [];
setRouteData({
service: "komoot",
name: tour.name,
distance: tour.distance,
elevation_up: tour.elevation_up,
elevation_down: tour.elevation_down,
coordinates: coords,
});
} else if (routeConfig.service === "strava") {
const res = await axios.get(`${API_URL_STRAVA}?route_id=${routeConfig.route_id}`);
const d = res.data;
setRouteData({
service: "strava",
name: d.name,
distance: d.distance,
elevation_up: d.elevation_gain,
elevation_down: null,
map_img: d.map_urls?.url || null,
});
}
} catch {
setError(true);
} finally {
setLoading(false);
}
};
fetchData();
}, [routeConfig]);

const chartData = routeData?.coordinates?.length
? {
labels: routeData.coordinates.map((c) => c.t),
datasets: [{
data: routeData.coordinates.map((c) => c.alt),
fill: true,
borderColor: "#94A378",
backgroundColor: "rgba(148,163,120,0.15)",
tension: 0.3,
pointRadius: 0,
borderWidth: 1.5,
}],
  }
: null;

const chartOptions = {
plugins: { legend: { display: false }, tooltip: { enabled: false } },
scales: { x: { display: false }, y: { display: false } },
animation: false,
responsive: true,
maintainAspectRatio: false,
};

const serviceMeta = {
komoot: { logo: komootLogo, label: "Komoot", color: "#6DB33F" },
strava: { logo: stravaLogo, label: "Strava", color: "#FC4C02" },
};
const meta = serviceMeta[routeData?.service || routeConfig?.service] || serviceMeta.komoot;

if (loading) {
return (
<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5 }}>
<CircularProgress size={18} />
<Typography variant="caption" color="text.secondary">Route wird geladen\u2026</Typography>
</Box>
);
}

if (error || !routeData) {
return (
<Button component="a" href={link} target="_blank" rel="noopener noreferrer"
variant="outlined" size="small" endIcon={<OpenInNewIcon fontSize="small" />}
sx={{ mt: 1, borderRadius: 2, textTransform: "none", fontSize: "0.8rem" }}>
Route \u00f6ffnen
</Button>
);
}

return (
<Box sx={{ mt: 2, borderRadius: 2, border: "1px solid rgba(45,60,89,0.1)", overflow: "hidden" }}>
<Box sx={{ height: 3, bgcolor: meta.color }} />

<Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2, pt: 1.5, pb: 1 }}>
<img src={meta.logo} alt={meta.label} style={{ height: 22, objectFit: "contain" }} />
<Typography variant="body2" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>
{routeData.name}
</Typography>
</Box>

<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, px: 2, pb: 1 }}>
{routeData.distance != null && (
<Chip icon={<StraightenIcon sx={{ fontSize: "0.9rem !important" }} />}
label={`${Math.round(routeData.distance / 1000)} km`}
size="small" sx={{ fontSize: "0.75rem", fontWeight: 700, bgcolor: "rgba(45,60,89,0.06)" }} />
)}
{routeData.elevation_up != null && (
<Chip icon={<TrendingUpIcon sx={{ fontSize: "0.9rem !important" }} />}
label={`${Math.round(routeData.elevation_up)} m`}
size="small" sx={{ fontSize: "0.75rem", fontWeight: 700, bgcolor: "rgba(148,163,120,0.15)", color: "#5a7040" }} />
)}
{routeData.elevation_down != null && (
<Chip icon={<TrendingDownIcon sx={{ fontSize: "0.9rem !important" }} />}
label={`${Math.round(routeData.elevation_down)} m`}
size="small" sx={{ fontSize: "0.75rem", fontWeight: 700, bgcolor: "rgba(209,133,92,0.12)", color: "#a0522d" }} />
)}
</Box>

{chartData ? (
<Box sx={{ height: 80, px: 2, pb: 1 }}>
<Line data={chartData} options={chartOptions} />
</Box>
) : routeData.map_img ? (
<Box sx={{ px: 2, pb: 1 }}>
<img src={routeData.map_img} alt="Karte"
style={{ width: "100%", borderRadius: 6, display: "block" }} />
</Box>
) : null}

<Divider sx={{ borderColor: "rgba(45,60,89,0.07)" }} />
<Box sx={{ px: 2, py: 1 }}>
<Button
component="a" href={link} target="_blank" rel="noopener noreferrer"
variant="contained" size="small" disableElevation
endIcon={<OpenInNewIcon sx={{ fontSize: "0.85rem !important" }} />}
sx={{
bgcolor: meta.color, color: "#fff", borderRadius: 2,
textTransform: "none", fontWeight: 700, fontSize: "0.8rem", px: 2,
"&:hover": { opacity: 0.88, bgcolor: meta.color },
}}>
In {meta.label} \u00f6ffnen
</Button>
</Box>
</Box>
);
}
