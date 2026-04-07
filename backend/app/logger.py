"""Central logging configuration for biketimer backend.

All modules import get_logger() from here.  Logs go to stdout so that
``docker logs biketimer-backend-1`` (or ``docker compose logs backend``)
picks them up without any extra configuration.

Log level is controlled via the LOG_LEVEL environment variable in .env:

  LOG_LEVEL=DEBUG    – very verbose (SQL, WS frames, …)
  LOG_LEVEL=INFO     – normal operation (default)
  LOG_LEVEL=WARNING  – only warnings and errors
  LOG_LEVEL=ERROR    – only errors
  LOG_LEVEL=OFF      – completely silent

A restart without rebuild is sufficient for the change to take effect:
  docker compose restart backend

Format: 2025-01-15 14:32:01 [INFO ] auth        : User Max logged in
"""

import logging
import os
import sys

_LEVEL_MAP = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
    "OFF": logging.CRITICAL + 1,  # silence everything
}

_LOG_LEVEL: int = _LEVEL_MAP.get(
    os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO
)


def get_logger(name: str) -> logging.Logger:
    """Return a module-level logger with a consistent formatter.

    Calling this multiple times with the same *name* is safe – handlers are
    only attached once.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                fmt="%(asctime)s [%(levelname)-5s] %(name)-12s: %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
        logger.addHandler(handler)
        logger.setLevel(_LOG_LEVEL)
    return logger
