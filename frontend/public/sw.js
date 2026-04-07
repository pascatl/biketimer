/* eslint-disable no-restricted-globals */

// Service Worker for Biketimer PWA

const CACHE_NAME = "biketimer-v1";

// Install – cache shell assets
self.addEventListener("install", (event) => {
	self.skipWaiting();
});

// Activate – clean old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
				),
			),
	);
	self.clients.claim();
});

// Fetch – network first, fall back to cache
self.addEventListener("fetch", (event) => {
	// Don't cache API requests or auth requests
	if (
		event.request.url.includes("/api/") ||
		event.request.url.includes("/kc/")
	) {
		return;
	}

	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Cache successful GET responses
				if (event.request.method === "GET" && response.status === 200) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, clone);
					});
				}
				return response;
			})
			.catch(() => caches.match(event.request)),
	);
});

// Push notification handler
self.addEventListener("push", (event) => {
	let data = { title: "BikeTimer", body: "Neue Benachrichtigung" };

	if (event.data) {
		try {
			data = event.data.json();
		} catch {
			data.body = event.data.text();
		}
	}

	const options = {
		body: data.body,
		icon: "/icons/biketimer_logo.png",
		badge: "/icons/biketimer_logo.png",
		vibrate: [200, 100, 200],
		tag: "biketimer-notification",
		renotify: true,
		data: { url: "/" },
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});

// Click on notification – open app
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	event.waitUntil(
		self.clients.matchAll({ type: "window" }).then((clients) => {
			// Focus existing window if available
			for (const client of clients) {
				if (client.url.includes(self.location.origin) && "focus" in client) {
					return client.focus();
				}
			}
			// Otherwise open new window
			return self.clients.openWindow(event.notification.data?.url || "/");
		}),
	);
});
