import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/600.css";
import "@fontsource/josefin-sans/700.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import App from "./App";
import "./index.css";
import keycloak from "./keycloak";

function renderApp(authenticated) {
	ReactDOM.createRoot(document.getElementById("root")).render(
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<App keycloak={keycloak} authenticated={authenticated} />
		</ThemeProvider>,
	);
}

keycloak
	.init({
		onLoad: "check-sso",
		silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
		pkceMethod: "S256",
	})
	.then((authenticated) => renderApp(authenticated))
	.catch(() => renderApp(false));
