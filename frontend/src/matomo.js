/**
 * Matomo event tracking helper.
 *
 * Wraps window._paq.push(['trackEvent', ...]) so tracking calls are
 * safe even if the Matomo script hasn't loaded yet (it queues the call).
 *
 * Usage:
 *   trackEvent('Event', 'Erstellt', 'Freitagsrunde');
 *   trackEvent('Einladung', 'Angenommen');
 *
 * Matomo event structure:
 *   Category  – broad area (e.g. "Event", "Einladung", "Kommentar")
 *   Action    – what happened (e.g. "Erstellt", "Geöffnet", "Gelöscht")
 *   Name      – optional label (e.g. event title)
 *   Value     – optional numeric value
 */
export function trackEvent(category, action, name = undefined, value = undefined) {
  try {
    window._paq = window._paq || [];
    const payload = ["trackEvent", category, action];
    if (name !== undefined) payload.push(name);
    if (value !== undefined) payload.push(value);
    window._paq.push(payload);
  } catch (e) {
    // Never let analytics crash the app
  }
}
