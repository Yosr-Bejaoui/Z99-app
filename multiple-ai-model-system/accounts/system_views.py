"""
System Configuration Views.
Admin endpoints for managing system settings, API providers, and webhooks.
"""
import logging
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta

from .system_models import SystemConfig, APIProviderConfig, WebhookConfig, SystemLog

logger = logging.getLogger(__name__)


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


# Serializers
class SystemConfigSerializer(serializers.ModelSerializer):
    """Serializer for SystemConfig model."""
    value = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemConfig
        fields = ['id', 'key', 'value', 'is_encrypted', 'description', 'category', 
                  'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_value(self, obj):
        """Return decrypted value, masked for sensitive data."""
        if obj.is_encrypted:
            return '********'  # Mask encrypted values
        return obj.value


class SystemConfigWriteSerializer(serializers.Serializer):
    """Serializer for creating/updating SystemConfig."""
    key = serializers.CharField(max_length=100, required=False)
    value = serializers.CharField(required=False)
    encrypt = serializers.BooleanField(default=False, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(max_length=50, default='general', required=False)


class APIProviderConfigSerializer(serializers.ModelSerializer):
    """Serializer for APIProviderConfig model."""
    api_key_set = serializers.SerializerMethodField()
    
    class Meta:
        model = APIProviderConfig
        fields = ['id', 'name', 'display_name', 'api_key_set', 'api_base_url', 
                  'is_active', 'priority', 'rate_limit', 'timeout_seconds', 
                  'extra_config', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_api_key_set(self, obj):
        """Indicate if API key is set without revealing it."""
        return bool(obj.api_key)


class APIProviderConfigWriteSerializer(serializers.Serializer):
    """Serializer for creating/updating APIProviderConfig."""
    name = serializers.ChoiceField(choices=APIProviderConfig.PROVIDER_CHOICES)
    display_name = serializers.CharField(max_length=100)
    api_key = serializers.CharField(required=False, allow_blank=True)
    api_base_url = serializers.URLField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)
    priority = serializers.IntegerField(default=0)
    rate_limit = serializers.IntegerField(default=100, min_value=1)
    timeout_seconds = serializers.IntegerField(default=60)
    extra_config = serializers.JSONField(required=False, default=dict)


class WebhookConfigSerializer(serializers.ModelSerializer):
    """Serializer for WebhookConfig model."""
    secret_key_set = serializers.SerializerMethodField()
    
    class Meta:
        model = WebhookConfig
        fields = ['id', 'name', 'url', 'secret_key_set', 'events', 'is_active', 
                  'retry_count', 'timeout_seconds', 'headers', 'last_triggered', 
                  'last_status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'last_triggered', 'last_status', 'created_at', 'updated_at']
    
    def get_secret_key_set(self, obj):
        """Indicate if secret key is set without revealing it."""
        return bool(obj.secret_key)


class SystemLogSerializer(serializers.ModelSerializer):
    """Serializer for SystemLog model."""
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemLog
        fields = ['id', 'level', 'category', 'message', 'user', 'user_email', 
                  'ip_address', 'request_path', 'request_method', 'extra_data', 
                  'created_at']
    
    def get_user_email(self, obj):
        return obj.user.email if obj.user else None


# ViewSets
class SystemConfigViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing system configurations.
    
    Endpoints:
    - GET /api/v1/accounts/admin/config/ - List all configs
    - POST /api/v1/accounts/admin/config/ - Create a config
    - GET /api/v1/accounts/admin/config/{id}/ - Retrieve a config
    - PUT /api/v1/accounts/admin/config/{id}/ - Update a config
    - DELETE /api/v1/accounts/admin/config/{id}/ - Delete a config
    - GET /api/v1/accounts/admin/config/by_category/ - List configs by category
    """
    queryset = SystemConfig.objects.all().order_by('category', 'key')
    serializer_class = SystemConfigSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active', 'is_encrypted']
    search_fields = ['key', 'description']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SystemConfigWriteSerializer
        return SystemConfigSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        config = SystemConfig.set(
            key=data['key'],
            value=data['value'],
            encrypt=data.get('encrypt', False),
            category=data.get('category', 'general'),
            description=data.get('description')
        )
        
        logger.info(f"Admin {request.user.email} created config: {config.key}")
        SystemLog.log('INFO', 'config', f"Created config: {config.key}", user=request.user, request=request)
        
        return Response({
            "success": True,
            "message": f"Configuration '{config.key}' created.",
            "data": SystemConfigSerializer(config).data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        if 'value' in data:
            instance.set_value(data['value'], encrypt=data.get('encrypt', instance.is_encrypted))
        if 'description' in data:
            instance.description = data['description']
        if 'category' in data:
            instance.category = data['category']
        instance.save()
        
        logger.info(f"Admin {request.user.email} updated config: {instance.key}")
        SystemLog.log('INFO', 'config', f"Updated config: {instance.key}", user=request.user, request=request)
        
        return Response({
            "success": True,
            "message": f"Configuration '{instance.key}' updated.",
            "data": SystemConfigSerializer(instance).data
        })
    
    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests for partial updates."""
        return self.update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get configs grouped by category."""
        configs = SystemConfig.objects.filter(is_active=True).order_by('category', 'key')
        
        grouped = {}
        for config in configs:
            if config.category not in grouped:
                grouped[config.category] = []
            grouped[config.category].append(SystemConfigSerializer(config).data)
        
        return Response({
            "success": True,
            "data": grouped
        })


class APIProviderConfigViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing API provider configurations.
    
    Endpoints:
    - GET /api/v1/accounts/admin/providers/ - List all providers
    - POST /api/v1/accounts/admin/providers/ - Create a provider
    - GET /api/v1/accounts/admin/providers/{id}/ - Retrieve a provider
    - PUT /api/v1/accounts/admin/providers/{id}/ - Update a provider
    - DELETE /api/v1/accounts/admin/providers/{id}/ - Delete a provider
    - POST /api/v1/accounts/admin/providers/{id}/test/ - Test provider connection
    """
    queryset = APIProviderConfig.objects.all().order_by('-priority', 'name')
    serializer_class = APIProviderConfigSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name', 'is_active']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return APIProviderConfigWriteSerializer
        return APIProviderConfigSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        provider, created = APIProviderConfig.objects.get_or_create(
            name=data['name'],
            defaults={
                'display_name': data['display_name'],
                'api_base_url': data.get('api_base_url'),
                'is_active': data.get('is_active', True),
                'priority': data.get('priority', 0),
                'rate_limit': data.get('rate_limit', 100),
                'timeout_seconds': data.get('timeout_seconds', 60),
                'extra_config': data.get('extra_config', {})
            }
        )
        
        if data.get('api_key'):
            provider.set_api_key(data['api_key'])
            provider.save()
        
        logger.info(f"Admin {request.user.email} created/updated provider: {provider.name}")
        SystemLog.log('INFO', 'provider', f"Created provider: {provider.name}", user=request.user, request=request)
        
        return Response({
            "success": True,
            "message": f"Provider '{provider.display_name}' {'created' if created else 'updated'}.",
            "data": APIProviderConfigSerializer(provider).data
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        instance.display_name = data.get('display_name', instance.display_name)
        instance.api_base_url = data.get('api_base_url', instance.api_base_url)
        instance.is_active = data.get('is_active', instance.is_active)
        instance.priority = data.get('priority', instance.priority)
        instance.rate_limit = data.get('rate_limit', instance.rate_limit)
        instance.timeout_seconds = data.get('timeout_seconds', instance.timeout_seconds)
        instance.extra_config = data.get('extra_config', instance.extra_config)
        
        if data.get('api_key'):
            instance.set_api_key(data['api_key'])
        
        instance.save()
        
        logger.info(f"Admin {request.user.email} updated provider: {instance.name}")
        SystemLog.log('INFO', 'provider', f"Updated provider: {instance.name}", user=request.user, request=request)
        
        return Response({
            "success": True,
            "message": f"Provider '{instance.display_name}' updated.",
            "data": APIProviderConfigSerializer(instance).data
        })
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test provider connection."""
        provider = self.get_object()
        
        # Basic validation test
        if not provider.api_key:
            return Response({
                "success": False,
                "error": {
                    "code": "NO_API_KEY",
                    "message": "No API key configured for this provider."
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # In a real implementation, this would test the actual API connection
        # For now, we just verify the config exists
        
        return Response({
            "success": True,
            "message": f"Provider '{provider.display_name}' configuration is valid.",
            "data": {
                "provider": provider.name,
                "is_active": provider.is_active,
                "api_key_set": True,
                "base_url": provider.api_base_url
            }
        })


class WebhookConfigViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for managing webhook configurations.
    
    Endpoints:
    - GET /api/v1/accounts/admin/webhooks/ - List all webhooks
    - POST /api/v1/accounts/admin/webhooks/ - Create a webhook
    - GET /api/v1/accounts/admin/webhooks/{id}/ - Retrieve a webhook
    - PUT /api/v1/accounts/admin/webhooks/{id}/ - Update a webhook
    - DELETE /api/v1/accounts/admin/webhooks/{id}/ - Delete a webhook
    - POST /api/v1/accounts/admin/webhooks/{id}/test/ - Test webhook
    """
    queryset = WebhookConfig.objects.all().order_by('name')
    serializer_class = WebhookConfigSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test webhook by sending a test payload."""
        import requests
        
        webhook = self.get_object()
        
        test_payload = {
            "event": "test",
            "timestamp": timezone.now().isoformat(),
            "message": "This is a test webhook from AI Model Backend"
        }
        
        try:
            response = requests.post(
                webhook.url,
                json=test_payload,
                headers=webhook.headers,
                timeout=webhook.timeout_seconds
            )
            
            webhook.last_triggered = timezone.now()
            webhook.last_status = f"{response.status_code}"
            webhook.save()
            
            return Response({
                "success": True,
                "message": "Test webhook sent successfully.",
                "data": {
                    "status_code": response.status_code,
                    "response_time_ms": response.elapsed.total_seconds() * 1000
                }
            })
        except Exception as e:
            webhook.last_triggered = timezone.now()
            webhook.last_status = f"ERROR: {str(e)[:50]}"
            webhook.save()
            
            return Response({
                "success": False,
                "error": {
                    "code": "WEBHOOK_FAILED",
                    "message": f"Failed to send test webhook: {str(e)}"
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin ViewSet for viewing system logs (read-only).
    
    Endpoints:
    - GET /api/v1/accounts/admin/logs/ - List logs
    - GET /api/v1/accounts/admin/logs/{id}/ - Retrieve a log
    - GET /api/v1/accounts/admin/logs/stats/ - Get log statistics
    """
    queryset = SystemLog.objects.all().order_by('-created_at')
    serializer_class = SystemLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['level', 'category']
    search_fields = ['message', 'request_path']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Limit to recent logs by default
        days = int(self.request.query_params.get('days', 7))
        if not start_date and not end_date:
            cutoff = timezone.now() - timedelta(days=days)
            queryset = queryset.filter(created_at__gte=cutoff)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get log statistics."""
        now = timezone.now()
        today = now.date()
        
        # Recent logs (last 24 hours)
        yesterday = now - timedelta(hours=24)
        recent_logs = SystemLog.objects.filter(created_at__gte=yesterday)
        
        # By level
        by_level = recent_logs.values('level').annotate(count=models.Count('id'))
        
        # By category
        by_category = recent_logs.values('category').annotate(count=models.Count('id'))
        
        # Error rate
        total_count = recent_logs.count()
        error_count = recent_logs.filter(level__in=['ERROR', 'CRITICAL']).count()
        error_rate = (error_count / total_count * 100) if total_count > 0 else 0
        
        return Response({
            "success": True,
            "data": {
                "total_logs_24h": total_count,
                "error_rate_24h": round(error_rate, 2),
                "by_level": list(by_level),
                "by_category": list(by_category)
            }
        })


# Import models for Count
from django.db import models
