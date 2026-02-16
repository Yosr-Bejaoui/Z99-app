"""
Custom Throttling Classes for Rate Limiting.
Provides fine-grained rate limiting per endpoint, user, and IP.
"""
import logging
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, SimpleRateThrottle
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class BurstRateThrottle(UserRateThrottle):
    """
    Burst rate throttle - allows short bursts of requests.
    Authenticated users: 60 requests/minute
    """
    scope = 'burst'
    rate = '60/min'


class SustainedRateThrottle(UserRateThrottle):
    """
    Sustained rate throttle - limits overall usage over time.
    Authenticated users: 1000 requests/hour
    """
    scope = 'sustained'
    rate = '1000/hour'


class AnonBurstRateThrottle(AnonRateThrottle):
    """
    Burst rate throttle for anonymous users.
    Anonymous users: 20 requests/minute
    """
    scope = 'anon_burst'
    rate = '20/min'


class AnonSustainedRateThrottle(AnonRateThrottle):
    """
    Sustained rate throttle for anonymous users.
    Anonymous users: 100 requests/hour
    """
    scope = 'anon_sustained'
    rate = '100/hour'


class AIGenerationThrottle(UserRateThrottle):
    """
    Special throttle for AI generation endpoints (expensive operations).
    Authenticated users: 30 requests/hour
    """
    scope = 'ai_generation'
    rate = '30/hour'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }


class WebSocketThrottle(SimpleRateThrottle):
    """
    Throttle for WebSocket message rate.
    Limits: 60 messages/minute per connection
    """
    scope = 'websocket'
    rate = '60/min'

    def get_cache_key(self, request, view):
        if hasattr(request, 'user') and request.user.is_authenticated:
            return f"ws_throttle_{request.user.pk}"
        return f"ws_throttle_{self.get_ident(request)}"


class AdminRateThrottle(UserRateThrottle):
    """
    Rate throttle for admin endpoints.
    Admin users get higher limits: 500 requests/minute
    """
    scope = 'admin'
    rate = '500/min'

    def allow_request(self, request, view):
        # Only apply to admin users
        if request.user and request.user.is_staff:
            return super().allow_request(request, view)
        return True  # Non-admin users use default throttle


class SubscriptionBasedThrottle(UserRateThrottle):
    """
    Dynamic throttle based on user's subscription level.
    Free users: 100 requests/hour
    Premium users: 5000 requests/hour
    """
    scope = 'subscription'

    def get_rate(self):
        if hasattr(self, 'request') and self.request.user.is_authenticated:
            if getattr(self.request.user, 'subscribed', False):
                return '5000/hour'
        return '100/hour'

    def allow_request(self, request, view):
        self.request = request
        self.rate = self.get_rate()
        return super().allow_request(request, view)


class IPBasedThrottle(SimpleRateThrottle):
    """
    IP-based throttle to prevent abuse from single IP.
    100 requests/minute per IP.
    """
    scope = 'ip'
    rate = '100/min'

    def get_cache_key(self, request, view):
        return f"ip_throttle_{self.get_ident(request)}"


def get_throttle_status(request, throttle_classes=None):
    """
    Get current throttle status for a request.
    Returns dict with remaining requests and reset time.
    """
    if throttle_classes is None:
        throttle_classes = [BurstRateThrottle, SustainedRateThrottle]
    
    status = {}
    for throttle_class in throttle_classes:
        throttle = throttle_class()
        # Initialize throttle
        throttle.allow_request(request, None)
        
        if throttle.num_requests is not None:
            remaining = max(0, throttle.num_requests - len(throttle.history))
            reset_time = throttle.wait()
            status[throttle.scope] = {
                'limit': throttle.num_requests,
                'remaining': remaining,
                'reset_seconds': reset_time
            }
    
    return status


# Mapping of endpoint patterns to throttle classes
ENDPOINT_THROTTLES = {
    'ai_generation': [AIGenerationThrottle, BurstRateThrottle],
    'admin': [AdminRateThrottle],
    'auth': [BurstRateThrottle, IPBasedThrottle],
    'default': [BurstRateThrottle, SustainedRateThrottle],
}
