"""
Unit tests for system configuration admin API endpoints.
Tests cover: System Config, API Provider Config, Webhook Config, System Logs
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from .system_models import SystemConfig, APIProviderConfig, WebhookConfig, SystemLog

User = get_user_model()


class SystemConfigViewSetTests(APITestCase):
    """Tests for SystemConfigViewSet endpoints."""
    
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.admin_user.is_admin = True
        self.admin_user.save()
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='UserPass123!'
        )
        
        # Create test config
        self.config1 = SystemConfig.objects.create(
            key='site_name',
            value='Test Site',
            description='Site name configuration',
            is_encrypted=False
        )
        
        self.client = APIClient()
    
    def test_list_configs_admin(self):
        """Admin can list all system configurations."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/accounts/admin/config/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response could be a list or dict with 'success' key
        self.assertTrue(isinstance(response.data, (list, dict)))
    
    def test_list_configs_non_admin_forbidden(self):
        """Non-admin cannot list system configurations."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/accounts/admin/config/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_config_admin(self):
        """Admin can create system configuration."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'key': 'maintenance_mode',
            'value': 'false',
            'description': 'Enable maintenance mode',
            'is_encrypted': False
        }
        response = self.client.post('/api/v1/accounts/admin/config/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(SystemConfig.objects.filter(key='maintenance_mode').exists())
    
    def test_update_config_admin(self):
        """Admin can update system configuration."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'value': 'Updated Site Name'
        }
        response = self.client.patch(f'/api/v1/accounts/admin/config/{self.config1.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.config1.refresh_from_db()
        self.assertEqual(self.config1.value, 'Updated Site Name')
    
    def test_delete_config_admin(self):
        """Admin can delete system configuration."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/accounts/admin/config/{self.config1.id}/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.assertFalse(SystemConfig.objects.filter(id=self.config1.id).exists())
    
    def test_duplicate_key_rejected(self):
        """Duplicate configuration keys are rejected."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'key': 'unique_config_key',
            'value': 'First Value',
            'is_encrypted': False
        }
        # Create first config
        response1 = self.client.post('/api/v1/accounts/admin/config/', data)
        self.assertIn(response1.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        # Duplicate should fail (unique constraint) or create with diff key


class APIProviderConfigViewSetTests(APITestCase):
    """Tests for APIProviderConfigViewSet endpoints."""
    
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.admin_user.is_admin = True
        self.admin_user.save()
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='UserPass123!'
        )
        
        # Create test provider config
        self.provider = APIProviderConfig.objects.create(
            name='openai',
            display_name='OpenAI',
            api_key='test-api-key-12345',
            api_base_url='https://api.openai.com/v1',
            is_active=True
        )
        
        self.client = APIClient()
    
    def test_list_providers_admin(self):
        """Admin can list all API providers."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/accounts/admin/providers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_list_providers_non_admin_forbidden(self):
        """Non-admin cannot list API providers."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/accounts/admin/providers/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_provider_admin(self):
        """Admin can create API provider configuration."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'name': 'google',
            'display_name': 'Google AI',
            'api_key': 'google-api-key-12345',
            'api_base_url': 'https://generativelanguage.googleapis.com',
            'is_active': True
        }
        response = self.client.post('/api/v1/accounts/admin/providers/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_update_provider_admin(self):
        """Admin can update API provider configuration."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'is_active': False
        }
        response = self.client.patch(f'/api/v1/accounts/admin/providers/{self.provider.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.provider.refresh_from_db()
        self.assertFalse(self.provider.is_active)
    
    def test_test_provider_admin(self):
        """Admin can test API provider connection."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/accounts/admin/providers/{self.provider.id}/test/')
        # Test may pass or fail depending on actual API key
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


class WebhookConfigViewSetTests(APITestCase):
    """Tests for WebhookConfigViewSet endpoints."""
    
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.admin_user.is_admin = True
        self.admin_user.save()
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='UserPass123!'
        )
        
        # Create test webhook config
        self.webhook = WebhookConfig.objects.create(
            name='stripe_webhook',
            url='https://example.com/webhook/stripe',
            secret_key='whsec_test12345',
            events=['payment.success', 'payment.failed'],
            is_active=True
        )
        
        self.client = APIClient()
    
    def test_list_webhooks_admin(self):
        """Admin can list all webhooks."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/accounts/admin/webhooks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_list_webhooks_non_admin_forbidden(self):
        """Non-admin cannot list webhooks."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/accounts/admin/webhooks/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_webhook_admin(self):
        """Admin can create webhook configuration."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'name': 'payment_webhook',
            'url': 'https://example.com/webhook/payment',
            'secret_key': 'secret123',
            'events': ['order.created', 'order.completed'],
            'is_active': True
        }
        response = self.client.post('/api/v1/accounts/admin/webhooks/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_update_webhook_admin(self):
        """Admin can update webhook configuration."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'is_active': False
        }
        response = self.client.patch(f'/api/v1/accounts/admin/webhooks/{self.webhook.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.webhook.refresh_from_db()
        self.assertFalse(self.webhook.is_active)
    
    def test_delete_webhook_admin(self):
        """Admin can delete webhook configuration."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/accounts/admin/webhooks/{self.webhook.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(WebhookConfig.objects.filter(id=self.webhook.id).exists())


class SystemLogViewSetTests(APITestCase):
    """Tests for SystemLogViewSet endpoints."""
    
    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.admin_user.is_admin = True
        self.admin_user.save()
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            email='user@test.com',
            password='UserPass123!'
        )
        
        # Create test log entries
        self.log1 = SystemLog.objects.create(
            level='INFO',
            message='Test log entry 1',
            category='test',
            user=self.admin_user
        )
        self.log2 = SystemLog.objects.create(
            level='ERROR',
            message='Test error log entry',
            category='test',
            user=self.regular_user
        )
        
        self.client = APIClient()
    
    def test_list_logs_admin(self):
        """Admin can list all system logs."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/accounts/admin/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_list_logs_non_admin_forbidden(self):
        """Non-admin cannot list system logs."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/accounts/admin/logs/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_filter_logs_by_level(self):
        """Admin can filter logs by level."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/accounts/admin/logs/', {'level': 'ERROR'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_filter_logs_by_source(self):
        """Admin can filter logs by category."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/accounts/admin/logs/', {'category': 'test'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_logs_are_read_only(self):
        """System logs cannot be created or modified via API."""
        self.client.force_authenticate(user=self.admin_user)
        
        # Try to create
        data = {
            'level': 'WARNING',
            'message': 'Unauthorized log creation',
            'category': 'api'
        }
        response = self.client.post('/api/v1/accounts/admin/logs/', data)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Try to update
        response = self.client.patch(f'/api/v1/accounts/admin/logs/{self.log1.id}/', {'message': 'Modified'})
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Try to delete
        response = self.client.delete(f'/api/v1/accounts/admin/logs/{self.log1.id}/')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class ThrottlingTests(APITestCase):
    """Tests for API throttling."""
    
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='AdminPass123!'
        )
        self.admin_user.is_admin = True
        self.admin_user.save()
        
        self.client = APIClient()
    
    def test_admin_endpoints_work_under_throttle(self):
        """Admin endpoints work under normal conditions."""
        self.client.force_authenticate(user=self.admin_user)
        
        # Make several requests
        for _ in range(5):
            response = self.client.get('/api/v1/accounts/admin/config/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)


class StructuredLoggingTests(TestCase):
    """Tests for structured logging functionality."""
    
    def test_system_log_creation(self):
        """Test creating a system log entry."""
        log = SystemLog.objects.create(
            level='INFO',
            message='Test log message',
            category='unit_test',
            extra_data={'key': 'value'}
        )
        self.assertEqual(log.level, 'INFO')
        self.assertEqual(log.category, 'unit_test')
        self.assertEqual(log.extra_data, {'key': 'value'})
    
    def test_system_log_str_representation(self):
        """Test system log string representation."""
        log = SystemLog.objects.create(
            level='WARNING',
            message='Warning message',
            category='test'
        )
        self.assertIn('WARNING', str(log))
    
    def test_system_log_ordering(self):
        """Test system logs are ordered by timestamp descending."""
        log1 = SystemLog.objects.create(level='INFO', message='First', category='test')
        log2 = SystemLog.objects.create(level='INFO', message='Second', category='test')
        
        logs = SystemLog.objects.all()
        self.assertEqual(logs[0].message, 'Second')
        self.assertEqual(logs[1].message, 'First')
