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
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events`, { headers });
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
	if (!res.ok)
		throw new Error(
			res.status === 403 ? "Kein Zugriff" : "Event nicht gefunden",
		);
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
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/${eventId}/invitations`, {
		headers,
	});
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

export async function fetchUsers(group) {
	const headers = authHeaders();
	const url = group
		? `${API_URL}/users?group=${encodeURIComponent(group)}`
		: `${API_URL}/users`;
	const res = await fetch(url, { headers });
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

// ── User Groups ──────────────────────────────────────────────

export async function fetchMyGroups() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/users/me/groups`, { headers });
	if (!res.ok) return { groups: [] };
	return res.json();
}

export async function updateMyGroups(groups) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/users/me/groups`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ groups }),
	});
	if (!res.ok) throw new Error("Fehler beim Speichern der Gruppen");
	return res.json();
}

export async function registerUser({
	username,
	email,
	password,
	display_name,
}) {
	/** In-app registration: creates a new Keycloak + DB user. */
	const res = await fetch(`${API_URL}/auth/register`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, email, password, display_name }),
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.detail || "Registrierung fehlgeschlagen");
	return data;
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

export async function fetchPushPrefs() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/push/prefs`, { headers });
	if (!res.ok) return null;
	const data = await res.json();
	return data.prefs;
}

export async function updatePushPrefs(prefs) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/push/prefs`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ prefs }),
	});
	if (!res.ok) throw new Error("Fehler beim Speichern der Einstellungen");
	return res.json();
}

export async function fetchEmailPrefs() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/push/email-prefs`, { headers });
	if (!res.ok) return null;
	const data = await res.json();
	return data.prefs;
}

export async function updateEmailPrefs(prefs) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/push/email-prefs`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ prefs }),
	});
	if (!res.ok)
		throw new Error("Fehler beim Speichern der E-Mail-Einstellungen");
	return res.json();
}

// ── Event Comments ───────────────────────────────────────────

export async function fetchEventComments(eventId) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/${eventId}/comments`, { headers });
	if (!res.ok) return [];
	return res.json();
}

export async function createEventComment(eventId, content) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/${eventId}/comments`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ content }),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail || "Fehler beim Erstellen des Kommentars");
	}
	return res.json();
}

export async function deleteEventComment(eventId, commentId) {
	const headers = authHeaders();
	const res = await fetch(
		`${API_URL}/events/${eventId}/comments/${commentId}`,
		{
			method: "DELETE",
			headers,
		},
	);
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail || "Fehler beim Löschen des Kommentars");
	}
	return res.json();
}

export async function toggleCommentReaction(eventId, commentId, emoji) {
	const headers = authHeaders();
	const res = await fetch(
		`${API_URL}/events/${eventId}/comments/${commentId}/reactions`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json", ...headers },
			body: JSON.stringify({ emoji }),
		},
	);
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail || "Fehler beim Reagieren");
	}
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

// ── Admin: User Groups ───────────────────────────────────────

export async function adminFetchUserGroups(userId) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/users/${userId}/groups`, {
		headers,
	});
	if (!res.ok) return { groups: [] };
	return res.json();
}

export async function adminUpdateUserGroups(userId, groups) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/admin/users/${userId}/groups`, {
		method: "PUT",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ groups }),
	});
	if (!res.ok) throw new Error("Fehler beim Speichern der Gruppen");
	return res.json();
}

// ── Changelog / "Was gibt's Neues" ──────────────────────────

export async function fetchUnseenChangelog() {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/changelog/unseen`, { headers });
	if (!res.ok) return [];
	return res.json();
}

export async function markChangelogSeen(entryIds) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/changelog/seen`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(entryIds),
	});
	if (!res.ok) throw new Error("Fehler beim Markieren als gelesen");
	return res.json();
}
