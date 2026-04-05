import os

# ── Application identity ──────────────────────────────────────────────────────
# APP_NAME must be set in .env (or as an environment variable).
# It is used everywhere: e-mails, push notifications, API docs, …
APP_NAME: str = os.environ["APP_NAME"]
