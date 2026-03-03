import { getAccessToken } from "./auth/AuthService";

// In dev: Vite proxies /api -> http://backend:8000
// In prod: nginx proxies /api -> http://backend:8000
const API_URL = import.meta.env.VITE_API_URL || "/api";

function authHeaders() {
	const token = getAccessToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

// Events

export async function fetchEvents() {
	const res = await fetch(`${API_URL}/events`);
	if (!res.ok) throw new Error("Fehler beim Laden der Events");
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

export async function inviteUser(eventId, email) {
	const headers = authHeaders();
	const res = await fetch(`${API_URL}/events/${eventId}/invite`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify({ invitee_email: email }),
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

// Invitations

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
