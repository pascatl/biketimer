/**
 * AuthService – thin wrapper around Keycloak's token endpoint.
 * Uses the Direct Access Grant (Resource Owner Password) flow,
 * so the SPA never redirects to Keycloak.
 *
 * Prerequisite: In Keycloak admin → Client → "Direct Access Grants" = ON.
 */

// KC_URL is only used for fallback; all actual requests go through /kc proxy to avoid CORS.
export const KC_REALM = import.meta.env.VITE_KEYCLOAK_REALM || "biketimer";
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

const STORAGE_KEY = "bt_refresh";
// If false, use sessionStorage (cleared when tab/browser closes)
let _persistMode = "local"; // "local" | "session"

function _saveToken(token) {
	try {
		if (_persistMode === "session") {
			sessionStorage.setItem(STORAGE_KEY, token);
			localStorage.removeItem(STORAGE_KEY);
		} else {
			localStorage.setItem(STORAGE_KEY, token);
			sessionStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		// iOS Safari private mode throws QuotaExceededError – keep token in memory only
	}
}

function _loadToken() {
	return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || null;
}

function _clearToken() {
	localStorage.removeItem(STORAGE_KEY);
	sessionStorage.removeItem(STORAGE_KEY);
}

async function _doRefresh() {
	if (!_refreshToken) {
		// Try reading from storage (e.g. after page reload)
		_refreshToken = _loadToken();
	}
	if (!_refreshToken) throw new Error("No refresh token");
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
	if (!res.ok) {
		_clearToken();
		throw new Error("Token-Refresh fehlgeschlagen");
	}
	const data = await res.json();
	_accessToken = data.access_token;
	_refreshToken = data.refresh_token;
	_saveToken(_refreshToken);
	return data;
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function login(username, password, rememberMe = true) {
	_persistMode = rememberMe ? "local" : "session";
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
	_saveToken(_refreshToken);
	return data;
}

export function logout() {
	clearTimeout(_refreshTimer);
	_accessToken = null;
	_refreshToken = null;
	_clearToken();
}

/**
 * Try to restore a session from the stored refresh token.
 * Returns user info on success, null if no stored token or refresh fails.
 */
export async function restoreSession(onRefreshed) {
	const stored = _loadToken();
	if (!stored) return null;
	_refreshToken = stored;
	try {
		const data = await _doRefresh();
		scheduleRefresh(data.expires_in, onRefreshed);
		return getUserInfo();
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		_refreshToken = null;
		return null;
	}
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
	const realmRoles = payload.realm_access?.roles || [];
	return {
		sub: payload.sub,
		email: payload.email || "",
		name: payload.name || payload.preferred_username || "",
		preferred_username: payload.preferred_username || "",
		roles: realmRoles,
		is_admin: realmRoles.includes("admin"),
	};
}

export function startAutoRefresh(expiresIn, onRefreshed) {
	scheduleRefresh(expiresIn, onRefreshed);
}

export function stopAutoRefresh() {
	clearTimeout(_refreshTimer);
}
