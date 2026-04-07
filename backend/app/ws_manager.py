"""
WebSocket connection manager.

Each connection is stored together with the authenticated user's sub (or None for
anonymous connections).  Messages are routed server-side – only the intended
recipients receive a given payload.

dispatch_sync() may be called from synchronous FastAPI route handlers (which run
in a thread pool).  It schedules the coroutine on the event loop that was captured
at application startup via set_event_loop().
"""

import asyncio
from typing import List, Optional

from fastapi import WebSocket

_event_loop: asyncio.AbstractEventLoop | None = None


def set_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Called once at startup to store the running event loop."""
    global _event_loop
    _event_loop = loop


class ConnectionManager:
    def __init__(self) -> None:
        # List of (websocket, user_sub) – sub is None for unauthenticated connections
        self._connections: List[tuple[WebSocket, Optional[str]]] = []

    async def connect(self, websocket: WebSocket, sub: Optional[str] = None) -> None:
        await websocket.accept()
        self._connections.append((websocket, sub))

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections = [(ws, s) for ws, s in self._connections if ws is not websocket]

    def set_sub(self, websocket: WebSocket, sub: Optional[str]) -> None:
        """Update the sub associated with an existing connection (called after auth frame)."""
        self._connections = [
            (ws, sub if ws is websocket else s)
            for ws, s in self._connections
        ]

    def get_sub(self, websocket: WebSocket) -> Optional[str]:
        """Return the sub currently associated with *websocket*, or None."""
        for ws, s in self._connections:
            if ws is websocket:
                return s
        return None

    async def _send_safe(self, websocket: WebSocket, message: dict) -> bool:
        try:
            await websocket.send_json(message)
            return True
        except Exception:
            return False

    async def broadcast(self, message: dict, exclude_sub: Optional[str] = None) -> None:
        """Send *message* to every connected client, optionally skipping one sub."""
        disconnected: List[WebSocket] = []
        for ws, sub in list(self._connections):
            if exclude_sub and sub == exclude_sub:
                continue
            if not await self._send_safe(ws, message):
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws)

    async def send_to_subs(
        self, subs: List[str], message: dict, exclude_sub: Optional[str] = None
    ) -> None:
        """Send *message* only to connections whose sub appears in *subs*."""
        disconnected: List[WebSocket] = []
        for ws, sub in list(self._connections):
            if sub not in subs:
                continue
            if exclude_sub and sub == exclude_sub:
                continue
            if not await self._send_safe(ws, message):
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect(ws)

    def dispatch_sync(
        self,
        message: dict,
        recipient_subs: Optional[List[str]] = None,
        exclude_sub: Optional[str] = None,
    ) -> None:
        """Thread-safe dispatcher for use from synchronous route handlers.

        recipient_subs=None  → broadcast to all (minus exclude_sub)
        recipient_subs=[]    → send to nobody (no-op)
        recipient_subs=[...] → send only to matching subs (minus exclude_sub)
        """
        if _event_loop is None or not _event_loop.is_running():
            return
        if recipient_subs is not None and len(recipient_subs) == 0:
            return  # nothing to send
        if recipient_subs is None:
            coro = self.broadcast(message, exclude_sub=exclude_sub)
        else:
            coro = self.send_to_subs(recipient_subs, message, exclude_sub=exclude_sub)
        asyncio.run_coroutine_threadsafe(coro, _event_loop)

    # Legacy shim so old call-sites don't break immediately
    def broadcast_sync(self, message: dict) -> None:
        self.dispatch_sync(message)


manager = ConnectionManager()
