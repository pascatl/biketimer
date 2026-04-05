// ── Application identity ──────────────────────────────────────────────────────
// VITE_APP_NAME must be set in .env – it is used everywhere in the UI.
if (!import.meta.env.VITE_APP_NAME) {
  console.warn("VITE_APP_NAME is not set in .env");
}
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "";
