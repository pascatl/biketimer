import json
import os
import time
import urllib.error
import urllib.request

from .logger import get_logger

_log = get_logger("signal")

SIGNAL_NOTIFICATION_URL = os.getenv("SIGNAL_NOTIFICATION_URL", "")
SIGNAL_NOTIFICATION_API_KEY = os.getenv("SIGNAL_NOTIFICATION_API_KEY", "")
SIGNAL_NOTIFY_RECIPIENTS = [
    r.strip() for r in os.getenv("SIGNAL_NOTIFY_RECIPIENTS", "").split(",") if r.strip()
]

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0  # seconds


def send_signal_notification(recipients: list[str], message: str) -> None:
    """Send a text message via the central signal-notify gateway.

    Retries with limited exponential backoff on 502 or network errors,
    per the gateway's integration contract. Errors are logged but not raised.
    """
    if not SIGNAL_NOTIFICATION_URL or not SIGNAL_NOTIFICATION_API_KEY:
        return  # Signal notifications not configured
    if not recipients:
        return

    base_url = SIGNAL_NOTIFICATION_URL.rstrip("/")
    body = json.dumps({"recipients": recipients, "message": message}).encode()
    request = urllib.request.Request(
        f"{base_url}/v1/notify",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {SIGNAL_NOTIFICATION_API_KEY}",
            "Content-Type": "application/json",
        },
    )

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(request, timeout=35) as response:
                if response.status == 200:
                    _log.info(f"Signal notification sent to {recipients}")
                    return
                _log.error(f"Signal gateway returned HTTP {response.status}")
                return
        except urllib.error.HTTPError as exc:
            if exc.code in (400, 401):
                _log.error(f"Signal gateway config error: HTTP {exc.code}")
                return  # permanent error, do not retry
            _log.error(f"Signal gateway error (attempt {attempt}): HTTP {exc.code}")
        except (urllib.error.URLError, TimeoutError) as exc:
            _log.error(f"Signal gateway unreachable (attempt {attempt}): {exc}")

        if attempt < _MAX_RETRIES:
            time.sleep(_RETRY_BASE_DELAY * (2 ** (attempt - 1)))

    _log.error(f"Signal notification failed after {_MAX_RETRIES} attempts")
