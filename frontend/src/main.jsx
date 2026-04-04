import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/600.css";
import "@fontsource/josefin-sans/700.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import theme from "./theme";
import App from "./App";
import "./index.css";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginDialog from "./components/LoginDialog";

function AuthGate() {
	const { authenticated, restoring } = useAuth();
	if (restoring) return null; // wait for session restore before rendering anything
	return (
		<>
			<LoginDialog />
			{authenticated && (
				<Routes>
					<Route path="/events/:id" element={<App />} />
					<Route path="*" element={<App />} />
				</Routes>
			)}
		</>
	);
}

ReactDOM.createRoot(document.getElementById("root")).render(
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<BrowserRouter>
			<AuthProvider>
				<AuthGate />
			</AuthProvider>
		</BrowserRouter>
	</ThemeProvider>,
);
