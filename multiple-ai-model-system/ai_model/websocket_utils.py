"""
WebSocket Utilities.
Provides heartbeat, error handling, and logging for WebSocket connections.
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger('websocket')


class WebSocketError:
    """Standard WebSocket error codes and messages."""
    
    # Error codes
    INVALID_JSON = 4001
    UNAUTHORIZED = 4002
    SESSION_NOT_FOUND = 4003
    RATE_LIMIT_EXCEEDED = 4004
    INSUFFICIENT_CREDITS = 4005
    MODEL_NOT_AVAILABLE = 4006
    INTERNAL_ERROR = 4007
    CONNECTION_TIMEOUT = 4008
    INVALID_MESSAGE = 4009
    
    # Error messages
    ERRORS = {
        4001: {"code": "INVALID_JSON", "message": "Invalid JSON format in message."},
        4002: {"code": "UNAUTHORIZED", "message": "Authentication required or token expired."},
        4003: {"code": "SESSION_NOT_FOUND", "message": "Chat session not found or access denied."},
        4004: {"code": "RATE_LIMIT_EXCEEDED", "message": "Rate limit exceeded. Please slow down."},
        4005: {"code": "INSUFFICIENT_CREDITS", "message": "Insufficient credits for this operation."},
        4006: {"code": "MODEL_NOT_AVAILABLE", "message": "Requested AI model is not available."},
        4007: {"code": "INTERNAL_ERROR", "message": "An internal error occurred. Please try again."},
        4008: {"code": "CONNECTION_TIMEOUT", "message": "Connection timed out due to inactivity."},
        4009: {"code": "INVALID_MESSAGE", "message": "Invalid message format or content."},
    }
    
    @classmethod
    def get_error(cls, code: int, details: str = None) -> Dict[str, Any]:
        """Get error response for a given code."""
        error = cls.ERRORS.get(code, {"code": "UNKNOWN_ERROR", "message": "An unknown error occurred."})
        response = {
            "type": "error",
            "error": {
                "code": error["code"],
                "message": error["message"],
            }
        }
        if details:
            response["error"]["details"] = details
        return response


class HeartbeatMixin:
    """
    Mixin to add heartbeat functionality to WebSocket consumers.
    
    Usage:
        class MyConsumer(HeartbeatMixin, AsyncWebsocketConsumer):
            heartbeat_interval = 30  # seconds
            heartbeat_timeout = 60   # seconds
    """
    
    heartbeat_interval: int = 30  # Send ping every 30 seconds
    heartbeat_timeout: int = 60   # Disconnect if no response in 60 seconds
    
    _heartbeat_task: Optional[asyncio.Task] = None
    _last_pong: Optional[datetime] = None
    _connected: bool = False
    
    async def start_heartbeat(self):
        """Start the heartbeat task."""
        self._connected = True
        self._last_pong = datetime.utcnow()
        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        logger.debug(f"Heartbeat started for connection {getattr(self, 'channel_name', 'unknown')}")
    
    async def stop_heartbeat(self):
        """Stop the heartbeat task."""
        self._connected = False
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
            self._heartbeat_task = None
        logger.debug(f"Heartbeat stopped for connection {getattr(self, 'channel_name', 'unknown')}")
    
    async def _heartbeat_loop(self):
        """Main heartbeat loop."""
        while self._connected:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                if not self._connected:
                    break
                
                # Check for timeout
                if self._last_pong:
                    elapsed = (datetime.utcnow() - self._last_pong).total_seconds()
                    if elapsed > self.heartbeat_timeout:
                        logger.warning(f"Connection timeout - no pong in {elapsed} seconds")
                        await self.send_error(WebSocketError.CONNECTION_TIMEOUT)
                        await self.close(code=WebSocketError.CONNECTION_TIMEOUT)
                        break
                
                # Send ping
                await self.send_ping()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
    
    async def send_ping(self):
        """Send a ping message."""
        try:
            await self.send(text_data=json.dumps({
                "type": "ping",
                "timestamp": datetime.utcnow().isoformat()
            }))
        except Exception as e:
            logger.error(f"Failed to send ping: {e}")
    
    async def handle_pong(self):
        """Handle pong response from client."""
        self._last_pong = datetime.utcnow()
        logger.debug(f"Received pong at {self._last_pong}")
    
    async def send_error(self, error_code: int, details: str = None):
        """Send an error message to the client."""
        try:
            error_response = WebSocketError.get_error(error_code, details)
            await self.send(text_data=json.dumps(error_response))
        except Exception as e:
            logger.error(f"Failed to send error: {e}")


class RateLimitMixin:
    """
    Mixin to add rate limiting to WebSocket consumers.
    
    Usage:
        class MyConsumer(RateLimitMixin, AsyncWebsocketConsumer):
            rate_limit_messages = 60   # messages per minute
            rate_limit_window = 60     # window in seconds
    """
    
    rate_limit_messages: int = 60   # Max messages per window
    rate_limit_window: int = 60     # Window in seconds
    
    _message_timestamps: list = None
    
    def _init_rate_limit(self):
        """Initialize rate limit tracking."""
        if self._message_timestamps is None:
            self._message_timestamps = []
    
    def _check_rate_limit(self) -> bool:
        """
        Check if the rate limit is exceeded.
        Returns True if under limit, False if exceeded.
        """
        self._init_rate_limit()
        
        now = datetime.utcnow()
        cutoff = now.timestamp() - self.rate_limit_window
        
        # Remove old timestamps
        self._message_timestamps = [
            ts for ts in self._message_timestamps 
            if ts > cutoff
        ]
        
        # Check limit
        if len(self._message_timestamps) >= self.rate_limit_messages:
            logger.warning(f"Rate limit exceeded: {len(self._message_timestamps)} messages in {self.rate_limit_window}s")
            return False
        
        # Record this message
        self._message_timestamps.append(now.timestamp())
        return True
    
    def _get_rate_limit_reset(self) -> int:
        """Get seconds until rate limit resets."""
        self._init_rate_limit()
        
        if not self._message_timestamps:
            return 0
        
        oldest = min(self._message_timestamps)
        reset_time = oldest + self.rate_limit_window
        now = datetime.utcnow().timestamp()
        
        return max(0, int(reset_time - now))


class ConnectionTracker:
    """
    Track active WebSocket connections for monitoring.
    Thread-safe singleton for tracking connections.
    """
    
    _instance = None
    _connections: Dict[str, Dict[str, Any]] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._connections = {}
        return cls._instance
    
    def add_connection(self, connection_id: str, user_id: int = None, session_id: int = None):
        """Register a new connection."""
        self._connections[connection_id] = {
            "user_id": user_id,
            "session_id": session_id,
            "connected_at": datetime.utcnow().isoformat(),
            "message_count": 0,
            "last_activity": datetime.utcnow().isoformat()
        }
        logger.info(f"Connection added: {connection_id} (Total: {len(self._connections)})")
    
    def remove_connection(self, connection_id: str):
        """Remove a connection."""
        if connection_id in self._connections:
            del self._connections[connection_id]
            logger.info(f"Connection removed: {connection_id} (Total: {len(self._connections)})")
    
    def update_activity(self, connection_id: str, message_count_increment: int = 1):
        """Update connection activity."""
        if connection_id in self._connections:
            self._connections[connection_id]["last_activity"] = datetime.utcnow().isoformat()
            self._connections[connection_id]["message_count"] += message_count_increment
    
    def get_connection(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get connection info."""
        return self._connections.get(connection_id)
    
    def get_all_connections(self) -> Dict[str, Dict[str, Any]]:
        """Get all connection info."""
        return self._connections.copy()
    
    def get_user_connections(self, user_id: int) -> Dict[str, Dict[str, Any]]:
        """Get all connections for a user."""
        return {
            conn_id: info 
            for conn_id, info in self._connections.items() 
            if info.get("user_id") == user_id
        }
    
    @property
    def connection_count(self) -> int:
        """Get total active connections."""
        return len(self._connections)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get connection statistics."""
        user_ids = set(
            info.get("user_id") 
            for info in self._connections.values() 
            if info.get("user_id")
        )
        
        return {
            "total_connections": len(self._connections),
            "unique_users": len(user_ids),
            "connections": [
                {
                    "id": conn_id,
                    "user_id": info.get("user_id"),
                    "session_id": info.get("session_id"),
                    "connected_at": info.get("connected_at"),
                    "message_count": info.get("message_count", 0),
                    "last_activity": info.get("last_activity")
                }
                for conn_id, info in self._connections.items()
            ]
        }


# Singleton tracker instance
connection_tracker = ConnectionTracker()


def format_ws_message(type: str, data: Any = None, **kwargs) -> str:
    """
    Format a standard WebSocket message.
    
    Args:
        type: Message type (e.g., 'chat_message', 'error', 'ping')
        data: Main data payload
        **kwargs: Additional fields
    
    Returns:
        JSON string
    """
    message = {
        "type": type,
        "timestamp": datetime.utcnow().isoformat(),
        **kwargs
    }
    if data is not None:
        message["data"] = data
    return json.dumps(message, ensure_ascii=False)


def parse_ws_message(message: str) -> Optional[Dict[str, Any]]:
    """
    Parse and validate a WebSocket message.
    
    Args:
        message: Raw message string
    
    Returns:
        Parsed message dict or None if invalid
    """
    try:
        data = json.loads(message)
        if not isinstance(data, dict):
            return None
        return data
    except (json.JSONDecodeError, TypeError):
        return None
