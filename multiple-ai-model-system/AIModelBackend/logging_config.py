"""
Structured Logging Module for AI Model Backend.
Provides consistent, JSON-formatted logging for all application components.
"""
import logging
import json
import traceback
from datetime import datetime
from functools import wraps
from typing import Any, Dict, Optional
from django.conf import settings
import uuid


class StructuredLogFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.
    Outputs logs in a format suitable for log aggregation services.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add extra fields if present
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'ip_address'):
            log_data['ip_address'] = record.ip_address
        if hasattr(record, 'endpoint'):
            log_data['endpoint'] = record.endpoint
        if hasattr(record, 'method'):
            log_data['method'] = record.method
        if hasattr(record, 'status_code'):
            log_data['status_code'] = record.status_code
        if hasattr(record, 'duration_ms'):
            log_data['duration_ms'] = record.duration_ms
        if hasattr(record, 'extra_data'):
            log_data['extra'] = record.extra_data
            
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': traceback.format_exception(*record.exc_info) if record.exc_info[0] else None
            }
        
        return json.dumps(log_data, default=str)


class AppLogger:
    """
    Application logger with context support.
    Provides methods for logging various events with structured data.
    """
    
    def __init__(self, name: str = 'app'):
        self.logger = logging.getLogger(name)
        self._context: Dict[str, Any] = {}
    
    def set_context(self, **kwargs):
        """Set context that will be included in all subsequent logs."""
        self._context.update(kwargs)
    
    def clear_context(self):
        """Clear the current context."""
        self._context = {}
    
    def _log(self, level: int, message: str, **kwargs):
        """Internal log method with context."""
        extra = {**self._context, **kwargs}
        self.logger.log(level, message, extra={'extra_data': extra} if extra else {})
    
    def debug(self, message: str, **kwargs):
        self._log(logging.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, exc_info: bool = False, **kwargs):
        self.logger.error(message, exc_info=exc_info, extra={'extra_data': {**self._context, **kwargs}})
    
    def critical(self, message: str, exc_info: bool = True, **kwargs):
        self.logger.critical(message, exc_info=exc_info, extra={'extra_data': {**self._context, **kwargs}})
    
    # Specialized logging methods
    
    def log_request(self, request, **kwargs):
        """Log an incoming HTTP request."""
        self.info(
            f"Request: {request.method} {request.path}",
            request_id=getattr(request, 'request_id', None),
            method=request.method,
            endpoint=request.path,
            user_id=request.user.id if request.user.is_authenticated else None,
            ip_address=get_client_ip(request),
            **kwargs
        )
    
    def log_response(self, request, response, duration_ms: float = None, **kwargs):
        """Log an HTTP response."""
        level = logging.WARNING if response.status_code >= 400 else logging.INFO
        self._log(
            level,
            f"Response: {response.status_code} for {request.method} {request.path}",
            request_id=getattr(request, 'request_id', None),
            method=request.method,
            endpoint=request.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            user_id=request.user.id if request.user.is_authenticated else None,
            **kwargs
        )
    
    def log_auth_event(self, event_type: str, user_id: int = None, success: bool = True, **kwargs):
        """Log authentication events."""
        level = logging.INFO if success else logging.WARNING
        self._log(
            level,
            f"Auth event: {event_type}",
            event_type=event_type,
            user_id=user_id,
            success=success,
            **kwargs
        )
    
    def log_ai_generation(self, model_id: str, user_id: int, session_type: str, 
                          credits_used: float = None, duration_ms: float = None, 
                          success: bool = True, **kwargs):
        """Log AI generation events."""
        level = logging.INFO if success else logging.ERROR
        self._log(
            level,
            f"AI Generation: {session_type} using {model_id}",
            model_id=model_id,
            user_id=user_id,
            session_type=session_type,
            credits_used=credits_used,
            duration_ms=duration_ms,
            success=success,
            **kwargs
        )
    
    def log_payment(self, user_id: int, amount: float, plan_id: int = None, 
                    status: str = 'completed', **kwargs):
        """Log payment events."""
        level = logging.INFO if status == 'completed' else logging.WARNING
        self._log(
            level,
            f"Payment: {status} - ${amount}",
            user_id=user_id,
            amount=amount,
            plan_id=plan_id,
            payment_status=status,
            **kwargs
        )
    
    def log_websocket_event(self, event_type: str, session_id: int = None, 
                            user_id: int = None, **kwargs):
        """Log WebSocket events."""
        self.info(
            f"WebSocket: {event_type}",
            event_type=event_type,
            session_id=session_id,
            user_id=user_id,
            **kwargs
        )
    
    def log_error(self, error: Exception, context: str = None, **kwargs):
        """Log an error with full context."""
        self.error(
            f"Error in {context or 'application'}: {str(error)}",
            exc_info=True,
            error_type=type(error).__name__,
            error_message=str(error),
            **kwargs
        )


def get_client_ip(request) -> str:
    """Extract client IP from request, handling proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def generate_request_id() -> str:
    """Generate a unique request ID."""
    return str(uuid.uuid4())[:8]


# Decorator for logging function calls
def log_function_call(logger_name: str = 'app'):
    """
    Decorator to log function entry and exit with timing.
    
    Usage:
        @log_function_call('ai_model')
        def generate_image(prompt, model_id):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = AppLogger(logger_name)
            func_name = func.__name__
            
            logger.debug(f"Entering {func_name}", args_count=len(args), kwargs_keys=list(kwargs.keys()))
            
            start_time = datetime.utcnow()
            try:
                result = func(*args, **kwargs)
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                logger.debug(f"Exiting {func_name}", duration_ms=duration)
                return result
            except Exception as e:
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                logger.error(f"Error in {func_name}: {e}", exc_info=True, duration_ms=duration)
                raise
        return wrapper
    return decorator


# Async version of the decorator
def log_async_function_call(logger_name: str = 'app'):
    """Async version of log_function_call decorator."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            logger = AppLogger(logger_name)
            func_name = func.__name__
            
            logger.debug(f"Entering async {func_name}")
            
            start_time = datetime.utcnow()
            try:
                result = await func(*args, **kwargs)
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                logger.debug(f"Exiting async {func_name}", duration_ms=duration)
                return result
            except Exception as e:
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                logger.error(f"Error in async {func_name}: {e}", exc_info=True, duration_ms=duration)
                raise
        return wrapper
    return decorator


# Global logger instances
app_logger = AppLogger('app')
auth_logger = AppLogger('auth')
ai_logger = AppLogger('ai_model')
payment_logger = AppLogger('payment')
websocket_logger = AppLogger('websocket')


# Middleware for request logging
class RequestLoggingMiddleware:
    """
    Middleware to log all requests and responses.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = AppLogger('http')
    
    def __call__(self, request):
        # Generate and attach request ID
        request.request_id = generate_request_id()
        
        # Log request
        start_time = datetime.utcnow()
        self.logger.log_request(request)
        
        # Process request
        response = self.get_response(request)
        
        # Log response
        duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        self.logger.log_response(request, response, duration_ms=duration_ms)
        
        # Add headers
        response['X-Request-ID'] = request.request_id
        
        return response
