import React from "react";
import ReactDOM from "react-dom/client";

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { error: null };
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, info) {
		console.error("React error boundary caught:", error, info);
	}
	render() {
		if (this.state.error) {
			return (
				<div
					style={{ padding: "2rem", fontFamily: "sans-serif", color: "#333" }}
				>
					<h2>Etwas ist schiefgelaufen.</h2>
					<p style={{ color: "#666" }}>{this.state.error?.message}</p>
					<button onClick={() => window.location.reload()}>
						Seite neu laden
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/600.css";
import "@fontsource/josefin-sans/700.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import theme from "./theme";
import App from "./App";
import "./index.css";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginDialog from "./components/LoginDialog";
import ImpressumPage from "./pages/ImpressumPage";
import DatenschutzPage from "./pages/DatenschutzPage";

function AuthGate() {
	const { authenticated, restoring } = useAuth();
	if (restoring) return null; // wait for session restore before rendering anything
	return (
		<>
			<LoginDialog />
			<Routes>
				<Route path="/impressum" element={<ImpressumPage />} />
				<Route path="/datenschutz" element={<DatenschutzPage />} />
				{authenticated && (
					<>
						<Route path="/events/:id" element={<App />} />
						<Route path="/" element={<App />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</>
				)}
			</Routes>
		</>
	);
}

ReactDOM.createRoot(document.getElementById("root")).render(
	<ErrorBoundary>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<BrowserRouter>
				<AuthProvider>
					<AuthGate />
				</AuthProvider>
			</BrowserRouter>
		</ThemeProvider>
	</ErrorBoundary>,
);
