/**
 * AuthService – thin wrapper around Keycloak's token endpoint.
 * Uses the Direct Access Grant (Resource Owner Password) flow,
 * so the SPA never redirects to Keycloak.
 *
 * Prerequisite: In Keycloak admin → Client → "Direct Access Grants" = ON.
 */

// KC_URL is only used for fallback; all actual requests go through /kc proxy to avoid CORS.
const KC_REALM = import.meta.env.VITE_KEYCLOAK_REALM || "biketimer";
const KC_CLIENT =
	import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "biketimer-frontend";

// Relative path – proxied by Vite (dev) or nginx (prod) to the real Keycloak URL.
const TOKEN_URL = `/kc/realms/${KC_REALM}/protocol/openid-connect/token`;

// ─── in-memory token store ────────────────────────────────────────────────────
let _accessToken = null;
let _refreshToken = null;
let _refreshTimer = null;

// ─── helpers ─────────────────────────────────────────────────────────────────

function decodeJwt(token) {
	try {
		const payload = token.split(".")[1];
		const decoded = JSON.parse(
			atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
		);
		return decoded;
	} catch {
		return {};
	}
}

function scheduleRefresh(expiresIn, onRefreshed) {
	clearTimeout(_refreshTimer);
	// Refresh 30 s before expiry (minimum 5 s)
	const delay = Math.max((expiresIn - 30) * 1000, 5000);
	_refreshTimer = setTimeout(async () => {
		try {
			const tokens = await _doRefresh();
			onRefreshed?.(tokens);
		} catch {
			// refresh failed – caller should detect via getAccessToken returning null
		}
	}, delay);
}

async function _doRefresh() {
	const body = new URLSearchParams({
		grant_type: "refresh_token",
		client_id: KC_CLIENT,
		refresh_token: _refreshToken,
	});
	const res = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) throw new Error("Token-Refresh fehlgeschlagen");
	const data = await res.json();
	_accessToken = data.access_token;
	_refreshToken = data.refresh_token;
	return data;
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function login(username, password) {
	const body = new URLSearchParams({
		grant_type: "password",
		client_id: KC_CLIENT,
		username,
		password,
		scope: "openid email profile",
	});
	const res = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error_description || "Anmeldung fehlgeschlagen");
	}
	const data = await res.json();
	_accessToken = data.access_token;
	_refreshToken = data.refresh_token;
	return data;
}

export function logout() {
	clearTimeout(_refreshTimer);
	_accessToken = null;
	_refreshToken = null;
}

export function getAccessToken() {
	return _accessToken;
}

export function isAuthenticated() {
	if (!_accessToken) return false;
	const { exp } = decodeJwt(_accessToken);
	if (!exp) return false;
	return Date.now() / 1000 < exp - 5;
}

export function getUserInfo() {
	if (!_accessToken) return null;
	const payload = decodeJwt(_accessToken);
	return {
		sub: payload.sub,
		email: payload.email || "",
		name: payload.name || payload.preferred_username || "",
		preferred_username: payload.preferred_username || "",
	};
}

export function startAutoRefresh(expiresIn, onRefreshed) {
	scheduleRefresh(expiresIn, onRefreshed);
}

export function stopAutoRefresh() {
	clearTimeout(_refreshTimer);
}
