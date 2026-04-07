import { useEffect, useRef } from "react";
import { getAccessToken } from "./auth/AuthService";

const INITIAL_RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

/**
 * useWebSocket – opens a WebSocket connection and calls `onMessage` for each
 * incoming JSON message.  Reconnects automatically with exponential backoff.
 *
 * @param {string}   path      – server-relative path, e.g. "/api/ws"
 * @param {function} onMessage – callback(data: object)
 * @param {boolean}  enabled   – set false to skip connecting (e.g. while restoring auth)
 */
export function useWebSocket(path, onMessage, enabled = true) {
	const wsRef = useRef(null);
	const timerRef = useRef(null);
	const reAuthTimerRef = useRef(null);
	const delayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
	const mountedRef = useRef(false);
	// Always point to the latest callback without re-triggering the effect
	const onMessageRef = useRef(onMessage);
	const enabledRef = useRef(enabled);

	useEffect(() => {
		onMessageRef.current = onMessage;
	});

	useEffect(() => {
		enabledRef.current = enabled;
	});

	useEffect(() => {
		if (!enabled) return;

		mountedRef.current = true;

		function connect() {
			if (!mountedRef.current || !enabledRef.current) return;

			const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
			// No token in URL – avoids it appearing in server logs.
			// The token is sent as the first encrypted WebSocket frame instead.
			const ws = new WebSocket(`${protocol}//${window.location.host}${path}`);
			wsRef.current = ws;

			ws.onopen = () => {
				// Reset backoff on a successful connection
				delayRef.current = INITIAL_RECONNECT_DELAY_MS;

				// Send auth frame – and re-send it every 4 min so the server always
				// has a valid sub even after the Keycloak token is silently refreshed.
				const sendAuth = () => {
					const token = getAccessToken();
					if (token && ws.readyState === WebSocket.OPEN) {
						ws.send(JSON.stringify({ type: "auth", token }));
					}
				};
				sendAuth();
				reAuthTimerRef.current = setInterval(sendAuth, 4 * 60 * 1000);
			};

			ws.onmessage = (event) => {
				try {
					onMessageRef.current?.(JSON.parse(event.data));
				} catch {
					// ignore non-JSON frames
				}
			};

			ws.onclose = () => {
				clearInterval(reAuthTimerRef.current);
				reAuthTimerRef.current = null;
				wsRef.current = null;
				if (mountedRef.current && enabledRef.current) {
					timerRef.current = setTimeout(() => {
						delayRef.current = Math.min(
							delayRef.current * 2,
							MAX_RECONNECT_DELAY_MS,
						);
						connect();
					}, delayRef.current);
				}
			};

			ws.onerror = () => {
				// onclose fires right after onerror, so reconnect logic lives there
				ws.close();
			};
		}

		connect();

		return () => {
			mountedRef.current = false;
			clearTimeout(timerRef.current);
			clearInterval(reAuthTimerRef.current);
			reAuthTimerRef.current = null;
			if (wsRef.current) {
				// Prevent the onclose handler from scheduling another reconnect
				wsRef.current.onclose = null;
				wsRef.current.close();
				wsRef.current = null;
			}
		};
		// Re-run only when the path or enabled flag changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [path, enabled]);
}
