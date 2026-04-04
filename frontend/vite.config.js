import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		host: true,
		port: 5173,
		proxy: {
			"/api": {
				target: "http://backend:8000",
				changeOrigin: true,
			},
			"/kc": {
				target: process.env.KEYCLOAK_URL || "http://localhost:8080",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/kc/, ""),
			},
			"/tour": {
				target: "http://komoot.de/tour/",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/tour/, ""),
			},
		},
	},
});
