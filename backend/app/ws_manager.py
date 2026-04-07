"""
WebSocket connection manager.

broadcast_sync() may be called from synchronous FastAPI route handlers (which run
in a thread pool).  It schedules the coroutine on the event loop that was captured
at application startup via set_event_loop().
"""

import asyncio
from typing import List

from fastapi import WebSocket

_event_loop: asyncio.AbstractEventLoop | None = None


def set_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Called once at startup to store the running event loop."""
    global _event_loop
    _event_loop = loop


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        """Send *message* to every connected client; silently drop broken sockets."""
        disconnected: List[WebSocket] = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

    def broadcast_sync(self, message: dict) -> None:
        """Thread-safe wrapper: schedule broadcast on the stored event loop."""
        if _event_loop is not None and _event_loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast(message), _event_loop)


manager = ConnectionManager()
