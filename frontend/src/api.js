import { getAccessToken } from "./auth/AuthService";

// In dev: Vite proxies /api -> http://backend:8000
// In prod: nginx proxies /api -> http://backend:8000
const API_URL = import.meta.env.VITE_API_URL || "/api";

function authHeaders() {
	const token = getAccessToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Events ───────────────────────────────────────────────────

export async function fetchEvents() {
	const res = await fetch(`${API_URL}/events`);
	if (!res.ok) throw new Error("Fehler beim Laden der Events");
	return res.json();
}

export async function fetchMyEvents() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/mine`, { headers });
	if (!res.ok) throw new Error("Fehler beim Laden der Events");
	return res.json();
}

export async function fetchEvent(id) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/${id}`, { headers });
	if (!res.ok) throw new Error(res.status === 403 ? "Kein Zugriff" : "Event nicht gefunden");
	return res.json();
}

export async function createEvent(eventData) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ event_data: eventData }),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail || "Fehler beim Erstellen des Events");
	}
	return res.json();
}

export async function updateEvent(id, eventData) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ event_data: eventData }),
	});
	if (!res.ok) throw new Error("Fehler beim Speichern");
	return res.json();
}

export async function deleteEvent(id) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/${id}`, {
		method: "DELETE",
		headers,
	});
	if (!res.ok) throw new Error("Fehler beim Loeschen");
	return res.json();
}

export async function inviteUsersToEvent(eventId, userIds) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/${eventId}/invite`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ invitee_user_ids: userIds }),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail || "Fehler beim Einladen");
	}
	return res.json();
}

export async function fetchEventInvitations(eventId) {
	const res = await fetch(`${API_URL}/events/${eventId}/invitations`);
	if (!res.ok) return [];
	return res.json();
}

// ── Invitations ──────────────────────────────────────────────

export async function fetchMyInvitations() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/invitations/mine`, { headers });
	if (!res.ok) return [];
	return res.json();
}

export async function respondInvitation(invitationId, action) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/invitations/${invitationId}/${action}`, {
		method: "POST",
		headers,
	});
	if (!res.ok) throw new Error("Fehler beim Antworten auf die Einladung");
	return res.json();
}

export async function revokeInvitation(invitationId) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/invitations/${invitationId}`, {
		method: "DELETE",
		headers,
	});
	if (!res.ok) throw new Error("Fehler beim Zurücknehmen der Einladung");
	return res.json();
}

export async function withdrawInvitation(invitationId, reason) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/invitations/${invitationId}/withdraw`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ reason }),
	});
	if (!res.ok) throw new Error("Fehler beim Absagen der Einladung");
	return res.json();
}

// ── Statistics ───────────────────────────────────────────────

export async function fetchStats() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/stats`, { headers });
	if (!res.ok) throw new Error("Fehler beim Laden der Statistiken");
	return res.json();
}

// ── Users ────────────────────────────────────────────────────

export async function fetchUsers() {
	const res = await fetch(`${API_URL}/users`);
	if (!res.ok) throw new Error("Fehler beim Laden der Benutzer");
	return res.json();
}

export async function registerMe() {
	/** Called on every login to link/create the Keycloak account in the DB. */
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/users/me`, {
		method: "POST",
		headers,
	});
	if (!res.ok) return null;
	return res.json();
}

// ── Data (jerseys, sport types) ──────────────────────────────

export async function fetchJerseys() {
	const res = await fetch(`${API_URL}/jerseys`);
	if (!res.ok) throw new Error("Fehler beim Laden der Trikots");
	return res.json();
}

export async function fetchSportTypes() {
	const res = await fetch(`${API_URL}/sport-types`);
	if (!res.ok) throw new Error("Fehler beim Laden der Sportarten");
	return res.json();
}

export async function fetchVapidPublicKey() {
	const res = await fetch(`${API_URL}/vapid-public-key`);
	if (!res.ok) return null;
	const data = await res.json();
	return data.publicKey || null;
}

// ── Push Subscriptions ───────────────────────────────────────

export async function subscribePush(subscription) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/push/subscribe`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({
			endpoint: subscription.endpoint,
			keys: {
				p256dh: subscription.toJSON().keys.p256dh,
				auth: subscription.toJSON().keys.auth,
			},
		}),
	});
	if (!res.ok) throw new Error("Fehler beim Registrieren für Push");
	return res.json();
}

// ── Admin ────────────────────────────────────────────────────

export async function adminFetchUsers() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/users`, { headers });
	if (!res.ok) throw new Error("Fehler beim Laden der Benutzer");
	return res.json();
}

export async function adminCreateUser(data) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/users`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Fehler beim Erstellen");
	return res.json();
}

export async function adminUpdateUser(id, data) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/users/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Fehler beim Aktualisieren");
	return res.json();
}

export async function adminDeleteUser(id) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/users/${id}`, {
		method: "DELETE",
		headers,
	});
	if (!res.ok) throw new Error("Fehler beim Löschen");
	return res.json();
}

export async function adminFetchJerseys() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/jerseys`, { headers });
	if (!res.ok) throw new Error("Fehler beim Laden der Trikots");
	return res.json();
}

export async function adminCreateJersey(data) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/jerseys`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Fehler beim Erstellen");
	return res.json();
}

export async function adminUpdateJersey(id, data) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/jerseys/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Fehler beim Aktualisieren");
	return res.json();
}

export async function adminDeleteJersey(id) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/jerseys/${id}`, {
		method: "DELETE",
		headers,
	});
	if (!res.ok) throw new Error("Fehler beim Löschen");
	return res.json();
}

export async function adminFetchSportTypes() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/sport-types`, { headers });
	if (!res.ok) throw new Error("Fehler beim Laden der Sportarten");
	return res.json();
}

export async function adminCreateSportType(data) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/sport-types`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Fehler beim Erstellen");
	return res.json();
}

export async function adminUpdateSportType(id, data) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/sport-types/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Fehler beim Aktualisieren");
	return res.json();
}

export async function adminDeleteSportType(id) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/sport-types/${id}`, {
		method: "DELETE",
		headers,
	});
	if (!res.ok) throw new Error("Fehler beim Löschen");
	return res.json();
}
