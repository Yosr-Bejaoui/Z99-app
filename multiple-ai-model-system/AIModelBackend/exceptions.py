"""
Custom Exception Handler for Django REST Framework.
Provides consistent API error responses across the application.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from django.db import IntegrityError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error response format.
    
    Response format:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "details": {} or []  # Optional additional details
        }
    }
    """
    # Get the view and request for logging context
    view = context.get('view', None)
    request = context.get('request', None)
    
    # Log the exception
    logger.warning(
        f"Exception in {view.__class__.__name__ if view else 'Unknown'}: {exc}",
        exc_info=True,
        extra={
            'request_path': request.path if request else 'Unknown',
            'request_method': request.method if request else 'Unknown',
            'user': str(request.user) if request and hasattr(request, 'user') else 'Anonymous',
        }
    )
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If DRF handled it, format the response
    if response is not None:
        return format_error_response(response, exc)
    
    # Handle Django ValidationError
    if isinstance(exc, DjangoValidationError):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "details": exc.messages if hasattr(exc, 'messages') else [str(exc)]
                }
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle IntegrityError (database constraints)
    if isinstance(exc, IntegrityError):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "A database constraint was violated. This resource may already exist.",
                    "details": str(exc) if logger.isEnabledFor(logging.DEBUG) else None
                }
            },
            status=status.HTTP_409_CONFLICT
        )
    
    # Handle unexpected errors
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return Response(
        {
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def format_error_response(response, exc):
    """
    Format DRF response into our standard error format.
    """
    error_code = get_error_code(response.status_code)
    
    # Handle different types of error data
    if isinstance(response.data, dict):
        # Check for 'detail' key (common DRF pattern)
        if 'detail' in response.data:
            message = str(response.data['detail'])
            details = None
        else:
            # Field-level errors
            message = "Validation error"
            details = response.data
    elif isinstance(response.data, list):
        message = response.data[0] if response.data else "An error occurred"
        details = response.data if len(response.data) > 1 else None
    else:
        message = str(response.data)
        details = None
    
    response.data = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
        }
    }
    
    if details:
        response.data["error"]["details"] = details
    
    return response


def get_error_code(status_code):
    """
    Map HTTP status codes to error codes.
    """
    error_codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        406: "NOT_ACCEPTABLE",
        409: "CONFLICT",
        415: "UNSUPPORTED_MEDIA_TYPE",
        422: "UNPROCESSABLE_ENTITY",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
    }
    return error_codes.get(status_code, f"HTTP_{status_code}")


class APIException(Exception):
    """
    Base exception for custom API errors.
    
    Usage:
        raise APIException("Something went wrong", code="CUSTOM_ERROR", status_code=400)
    """
    def __init__(self, message, code="API_ERROR", status_code=400, details=None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class InsufficientCreditsError(APIException):
    """Raised when user doesn't have enough credits for an operation."""
    def __init__(self, required, available):
        super().__init__(
            message=f"Insufficient credits. Required: {required}, Available: {available}",
            code="INSUFFICIENT_CREDITS",
            status_code=402,
            details={"required": required, "available": available}
        )


class AIModelNotAvailableError(APIException):
    """Raised when requested AI model is not available."""
    def __init__(self, model_id=None):
        super().__init__(
            message=f"AI model not available" + (f": {model_id}" if model_id else ""),
            code="MODEL_NOT_AVAILABLE",
            status_code=503
        )


class RateLimitError(APIException):
    """Raised when user exceeds rate limit."""
    def __init__(self, retry_after=None):
        super().__init__(
            message="Rate limit exceeded. Please try again later.",
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details={"retry_after": retry_after} if retry_after else None
        )
