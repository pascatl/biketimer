import json
import os

from pywebpush import webpush, WebPushException

from .logger import get_logger

_log = get_logger("push")

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS_EMAIL = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@biketimer.local")


def send_push_notification(
    endpoint: str,
    p256dh: str,
    auth: str,
    title: str = "Biketimer",
    body: str = "",
) -> None:
    """Send a web push notification. Errors are logged but not raised."""
    if not VAPID_PRIVATE_KEY:
        return  # Push not configured

    subscription_info = {
        "endpoint": endpoint,
        "keys": {
            "p256dh": p256dh,
            "auth": auth,
        },
    }

    payload = json.dumps({"title": title, "body": body})

    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CLAIMS_EMAIL},
        )
        _log.info(f"Push sent: \"{title}\" → {endpoint[:50]}...")
    except WebPushException as ex:
        _log.error(f"Push failed (WebPushException): {ex} → endpoint={endpoint[:50]}...")
    except Exception as ex:
        _log.error(f"Push error: {ex} → endpoint={endpoint[:50]}...")
