import React from "react";
import {
	AppBar,
	Toolbar,
	Typography,
	Box,
	Slide,
	useScrollTrigger,
} from "@mui/material";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import ControlButtons from "./ControlButtons";

function HideOnScroll({ children }) {
	const trigger = useScrollTrigger();
	return (
		<Slide appear={false} direction="down" in={!trigger}>
			{children}
		</Slide>
	);
}

const TopBar = (props) => {
	return (
		<HideOnScroll>
			<AppBar
				position="fixed"
				elevation={0}
				sx={{
					bgcolor: "primary.main",
					borderBottom: "1px solid rgba(255,255,255,0.08)",
				}}
			>
				<Toolbar
					sx={{
						justifyContent: "space-between",
						px: { xs: 2, sm: 3 },
						minHeight: 64,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
						<Box
							sx={{
								bgcolor: "rgba(255,255,255,0.12)",
								borderRadius: 2,
								p: 0.75,
								display: "flex",
								alignItems: "center",
							}}
						>
							<DirectionsBikeIcon sx={{ fontSize: 24, color: "#E5BA41" }} />
						</Box>
						<Box>
							<Typography
								variant="h6"
								component="div"
								sx={{
									fontWeight: 700,
									letterSpacing: 0.3,
									lineHeight: 1.2,
									color: "#fff",
								}}
							>
								Terminplaner
							</Typography>
						</Box>
					</Box>
					<ControlButtons
						currentEvents={props.currentEvents}
						onAddEvent={props.onAddEvent}
						defaultEvent={props.defaultEvent}
					/>
				</Toolbar>
			</AppBar>
		</HideOnScroll>
	);
};

export default TopBar;
