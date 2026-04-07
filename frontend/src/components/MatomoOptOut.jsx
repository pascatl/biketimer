import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";

export default function MatomoOptOut() {
	const [optedOut, setOptedOut] = useState(false);

	useEffect(() => {
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
			const id = setInterval(() => {
				if (check()) clearInterval(id);
			}, 300);
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
				{optedOut ? "Sie werden derzeit nicht erfasst." : "Sie werden derzeit erfasst."}
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
