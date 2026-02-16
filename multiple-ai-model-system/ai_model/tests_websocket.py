"""
Unit tests for WebSocket functionality.
Tests cover: WebSocket utilities, connection tracking, heartbeat
"""
from django.test import TestCase
from datetime import datetime
import json
from unittest.mock import Mock, patch, AsyncMock
import asyncio

from .websocket_utils import (
    WebSocketError,
    HeartbeatMixin,
    RateLimitMixin,
    ConnectionTracker,
    connection_tracker,
    format_ws_message,
    parse_ws_message
)


class WebSocketErrorTests(TestCase):
    """Tests for WebSocketError class."""
    
    def test_invalid_json_error(self):
        """Test INVALID_JSON error code and message."""
        error = WebSocketError.get_error(WebSocketError.INVALID_JSON)
        self.assertEqual(error['type'], 'error')
        self.assertEqual(error['error']['code'], 'INVALID_JSON')
        self.assertIn('JSON', error['error']['message'])
    
    def test_unauthorized_error(self):
        """Test UNAUTHORIZED error code and message."""
        error = WebSocketError.get_error(WebSocketError.UNAUTHORIZED)
        self.assertEqual(error['error']['code'], 'UNAUTHORIZED')
        self.assertIn('Authentication', error['error']['message'])
    
    def test_session_not_found_error(self):
        """Test SESSION_NOT_FOUND error code and message."""
        error = WebSocketError.get_error(WebSocketError.SESSION_NOT_FOUND)
        self.assertEqual(error['error']['code'], 'SESSION_NOT_FOUND')
    
    def test_rate_limit_error(self):
        """Test RATE_LIMIT_EXCEEDED error code and message."""
        error = WebSocketError.get_error(WebSocketError.RATE_LIMIT_EXCEEDED)
        self.assertEqual(error['error']['code'], 'RATE_LIMIT_EXCEEDED')
    
    def test_error_with_details(self):
        """Test error with additional details."""
        error = WebSocketError.get_error(
            WebSocketError.INTERNAL_ERROR, 
            details='Database connection failed'
        )
        self.assertEqual(error['error']['details'], 'Database connection failed')
    
    def test_unknown_error_code(self):
        """Test unknown error code returns generic error."""
        error = WebSocketError.get_error(9999)
        self.assertEqual(error['error']['code'], 'UNKNOWN_ERROR')


class RateLimitMixinTests(TestCase):
    """Tests for RateLimitMixin class."""
    
    def test_rate_limit_allows_messages(self):
        """Test rate limit allows messages under limit."""
        class TestConsumer(RateLimitMixin):
            rate_limit_messages = 10
            rate_limit_window = 60
            _message_timestamps = None
        
        consumer = TestConsumer()
        
        # Should allow 10 messages
        for i in range(10):
            self.assertTrue(consumer._check_rate_limit())
        
        # 11th message should be blocked
        self.assertFalse(consumer._check_rate_limit())
    
    def test_rate_limit_reset(self):
        """Test rate limit reset calculation."""
        class TestConsumer(RateLimitMixin):
            rate_limit_messages = 5
            rate_limit_window = 60
            _message_timestamps = None
        
        consumer = TestConsumer()
        consumer._init_rate_limit()
        
        # Initially no timestamps
        self.assertEqual(consumer._get_rate_limit_reset(), 0)
        
        # After a message, reset time should be ~60 seconds
        consumer._check_rate_limit()
        reset_time = consumer._get_rate_limit_reset()
        self.assertGreater(reset_time, 0)
        self.assertLessEqual(reset_time, 60)


class ConnectionTrackerTests(TestCase):
    """Tests for ConnectionTracker class."""
    
    def setUp(self):
        # Clear any existing connections
        ConnectionTracker._connections = {}
    
    def test_singleton_pattern(self):
        """Test ConnectionTracker is singleton."""
        tracker1 = ConnectionTracker()
        tracker2 = ConnectionTracker()
        self.assertIs(tracker1, tracker2)
    
    def test_add_connection(self):
        """Test adding a connection."""
        tracker = ConnectionTracker()
        tracker.add_connection('conn1', user_id=1, session_id=10)
        
        self.assertEqual(tracker.connection_count, 1)
        conn = tracker.get_connection('conn1')
        self.assertIsNotNone(conn)
        self.assertEqual(conn['user_id'], 1)
        self.assertEqual(conn['session_id'], 10)
    
    def test_remove_connection(self):
        """Test removing a connection."""
        tracker = ConnectionTracker()
        tracker.add_connection('conn2', user_id=2)
        tracker.remove_connection('conn2')
        
        self.assertIsNone(tracker.get_connection('conn2'))
    
    def test_update_activity(self):
        """Test updating connection activity."""
        tracker = ConnectionTracker()
        tracker.add_connection('conn3', user_id=3)
        
        initial_count = tracker.get_connection('conn3')['message_count']
        tracker.update_activity('conn3', message_count_increment=5)
        
        updated_count = tracker.get_connection('conn3')['message_count']
        self.assertEqual(updated_count, initial_count + 5)
    
    def test_get_user_connections(self):
        """Test getting connections for a specific user."""
        tracker = ConnectionTracker()
        tracker.add_connection('conn4', user_id=4)
        tracker.add_connection('conn5', user_id=4)
        tracker.add_connection('conn6', user_id=5)
        
        user_conns = tracker.get_user_connections(4)
        self.assertEqual(len(user_conns), 2)
        self.assertIn('conn4', user_conns)
        self.assertIn('conn5', user_conns)
    
    def test_get_stats(self):
        """Test getting connection statistics."""
        tracker = ConnectionTracker()
        tracker.add_connection('conn7', user_id=7)
        tracker.add_connection('conn8', user_id=8)
        
        stats = tracker.get_stats()
        self.assertIn('total_connections', stats)
        self.assertIn('unique_users', stats)
        self.assertIn('connections', stats)
        self.assertEqual(stats['unique_users'], 2)


class MessageFormattingTests(TestCase):
    """Tests for message formatting utilities."""
    
    def test_format_ws_message(self):
        """Test formatting a WebSocket message."""
        message = format_ws_message('chat_message', data={'text': 'Hello'})
        parsed = json.loads(message)
        
        self.assertEqual(parsed['type'], 'chat_message')
        self.assertEqual(parsed['data']['text'], 'Hello')
        self.assertIn('timestamp', parsed)
    
    def test_format_ws_message_with_kwargs(self):
        """Test formatting with additional kwargs."""
        message = format_ws_message('event', session_id=123, user_id=456)
        parsed = json.loads(message)
        
        self.assertEqual(parsed['session_id'], 123)
        self.assertEqual(parsed['user_id'], 456)
    
    def test_parse_ws_message_valid(self):
        """Test parsing a valid WebSocket message."""
        raw = '{"type": "message", "text": "Hello"}'
        parsed = parse_ws_message(raw)
        
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed['type'], 'message')
        self.assertEqual(parsed['text'], 'Hello')
    
    def test_parse_ws_message_invalid_json(self):
        """Test parsing invalid JSON returns None."""
        result = parse_ws_message('not valid json')
        self.assertIsNone(result)
    
    def test_parse_ws_message_non_object(self):
        """Test parsing non-object JSON returns None."""
        result = parse_ws_message('[1, 2, 3]')
        self.assertIsNone(result)


class HeartbeatMixinTests(TestCase):
    """Tests for HeartbeatMixin class."""
    
    def test_heartbeat_configuration(self):
        """Test default heartbeat configuration."""
        class TestConsumer(HeartbeatMixin):
            pass
        
        consumer = TestConsumer()
        self.assertEqual(consumer.heartbeat_interval, 30)
        self.assertEqual(consumer.heartbeat_timeout, 60)
    
    def test_custom_heartbeat_configuration(self):
        """Test custom heartbeat configuration."""
        class TestConsumer(HeartbeatMixin):
            heartbeat_interval = 15
            heartbeat_timeout = 45
        
        consumer = TestConsumer()
        self.assertEqual(consumer.heartbeat_interval, 15)
        self.assertEqual(consumer.heartbeat_timeout, 45)
    
    def test_handle_pong_updates_timestamp(self):
        """Test that handling pong updates last_pong timestamp."""
        class TestConsumer(HeartbeatMixin):
            pass
        
        consumer = TestConsumer()
        consumer._last_pong = None
        
        # Run async handle_pong
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(consumer.handle_pong())
        finally:
            loop.close()
        
        self.assertIsNotNone(consumer._last_pong)
        self.assertIsInstance(consumer._last_pong, datetime)


class WebSocketConsumerIntegrationTests(TestCase):
    """Integration tests for WebSocket consumer functionality."""
    
    def test_error_codes_are_unique(self):
        """Test all error codes are unique."""
        codes = [
            WebSocketError.INVALID_JSON,
            WebSocketError.UNAUTHORIZED,
            WebSocketError.SESSION_NOT_FOUND,
            WebSocketError.RATE_LIMIT_EXCEEDED,
            WebSocketError.INSUFFICIENT_CREDITS,
            WebSocketError.MODEL_NOT_AVAILABLE,
            WebSocketError.INTERNAL_ERROR,
            WebSocketError.CONNECTION_TIMEOUT,
            WebSocketError.INVALID_MESSAGE,
        ]
        self.assertEqual(len(codes), len(set(codes)))
    
    def test_error_codes_in_4000_range(self):
        """Test all custom error codes are in 4000 range."""
        codes = [
            WebSocketError.INVALID_JSON,
            WebSocketError.UNAUTHORIZED,
            WebSocketError.SESSION_NOT_FOUND,
            WebSocketError.RATE_LIMIT_EXCEEDED,
            WebSocketError.INSUFFICIENT_CREDITS,
            WebSocketError.MODEL_NOT_AVAILABLE,
            WebSocketError.INTERNAL_ERROR,
            WebSocketError.CONNECTION_TIMEOUT,
            WebSocketError.INVALID_MESSAGE,
        ]
        for code in codes:
            self.assertGreaterEqual(code, 4000)
            self.assertLess(code, 5000)
    
    def test_all_error_codes_have_messages(self):
        """Test all error codes have corresponding messages."""
        for code in WebSocketError.ERRORS:
            error = WebSocketError.get_error(code)
            self.assertIn('error', error)
            self.assertIn('code', error['error'])
            self.assertIn('message', error['error'])
            self.assertTrue(len(error['error']['message']) > 0)
