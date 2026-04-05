import os

# ── Application identity ──────────────────────────────────────────────────────
# Change APP_NAME here (or via the APP_NAME environment variable) to rename the
# application everywhere: e-mails, push notifications, API docs, …
APP_NAME: str = os.getenv("APP_NAME", "BikeTimer")
