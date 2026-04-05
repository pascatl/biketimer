import { createTheme } from "@mui/material/styles";

const theme = createTheme({
	palette: {
		primary: { main: "#2D3C59" }, // Navy – wie wobinich
		secondary: { main: "#94A378" }, // Sage-Grün
		warning: { main: "#E5BA41" }, // Gold
		error: { main: "#D1855C" }, // Terrakotta
		background: { default: "#F4F5F7", paper: "#FFFFFF" },
		text: {
			primary: "#2D3C59",
			secondary: "#6B7A99",
		},
	},
	typography: {
		fontSize: 16,
		fontFamily: '"Josefin Sans", sans-serif',
		h1: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 700 },
		h2: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 700 },
		h3: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 600 },
		h4: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 600 },
		h5: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 600 },
		h6: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 600 },
		body1: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 400 },
		body2: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 400 },
		button: {
			fontFamily: '"Josefin Sans", sans-serif',
			fontWeight: 600,
			textTransform: "none",
		},
		caption: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 400 },
	},
	shape: { borderRadius: 10 },
	components: {
		MuiCard: {
			styleOverrides: {
				root: {
					boxShadow: "0 2px 12px rgba(45,60,89,0.08)",
					border: "1px solid rgba(45,60,89,0.08)",
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					fontWeight: 600,
					"& .MuiButton-startIcon": { display: "flex", alignItems: "center" },
					"& .MuiButton-endIcon": { display: "flex", alignItems: "center" },
				},
				containedPrimary: {
					background: "#2D3C59",
					"&:hover": { background: "#1E2B42" },
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: { fontFamily: '"Josefin Sans", sans-serif', fontWeight: 600 },
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: { boxShadow: "0 2px 12px rgba(45,60,89,0.18)" },
			},
		},
	},
});

export default theme;
