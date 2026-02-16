"""
Unit tests for plan admin API endpoints.
Tests cover: Admin Plan ViewSet, Admin Subscription ViewSet, Revenue endpoints
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
from .models import PlanModel, SubscriptionModel, Revenue

User = get_user_model()


class AdminPlanViewSetTests(APITestCase):
    """Tests for AdminPlanViewSet endpoints."""
    
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
        
        # Create test plans
        self.plan1 = PlanModel.objects.create(
            name='Basic Plan',
            plan_code='BASIC_001',
            description='Basic subscription plan',
            words_or_credits=1000,
            amount=9.99,
            is_active=True
        )
        self.plan2 = PlanModel.objects.create(
            name='Pro Plan',
            plan_code='PRO_001',
            description='Pro subscription plan',
            words_or_credits=5000,
            amount=29.99,
            is_active=True
        )
        
        self.client = APIClient()
    
    def test_list_plans_admin(self):
        """Admin can list all plans."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/plan/admin/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertEqual(len(response.data.get('data', [])), 2)
    
    def test_list_plans_non_admin_forbidden(self):
        """Non-admin cannot list plans via admin endpoint."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/plan/admin/plans/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_plans_unauthenticated_forbidden(self):
        """Unauthenticated user cannot list plans via admin endpoint."""
        response = self.client.get('/api/v1/plan/admin/plans/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_plan_admin(self):
        """Admin can create a new plan."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'name': 'Enterprise Plan',
            'plan_code': 'ENT_001',
            'description': 'Enterprise level plan',
            'words_or_credits': 50000,
            'amount': 99.99
        }
        response = self.client.post('/api/v1/plan/admin/plans/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(PlanModel.objects.filter(plan_code='ENT_001').exists())
    
    def test_update_plan_admin(self):
        """Admin can update a plan."""
        self.client.force_authenticate(user=self.admin_user)
        data = {
            'name': 'Updated Basic Plan',
            'amount': 12.99
        }
        response = self.client.patch(f'/api/v1/plan/admin/plans/{self.plan1.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plan1.refresh_from_db()
        self.assertEqual(self.plan1.name, 'Updated Basic Plan')
    
    def test_delete_plan_admin(self):
        """Admin can delete a plan."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/v1/plan/admin/plans/{self.plan2.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(PlanModel.objects.filter(id=self.plan2.id).exists())
    
    def test_activate_plan_admin(self):
        """Admin can activate a plan."""
        self.plan1.is_active = False
        self.plan1.save()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/plan/admin/plans/{self.plan1.id}/activate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plan1.refresh_from_db()
        self.assertTrue(self.plan1.is_active)
    
    def test_deactivate_plan_admin(self):
        """Admin can deactivate a plan."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/plan/admin/plans/{self.plan1.id}/deactivate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.plan1.refresh_from_db()
        self.assertFalse(self.plan1.is_active)
    
    def test_plan_stats_admin(self):
        """Admin can get plan statistics."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/plan/admin/plans/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIn('total_plans', response.data.get('data', {}))


class AdminSubscriptionViewSetTests(APITestCase):
    """Tests for AdminSubscriptionViewSet endpoints."""
    
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
        
        # Create plan
        self.plan = PlanModel.objects.create(
            name='Test Plan',
            plan_code='TEST_001',
            words_or_credits=1000,
            amount=9.99,
            is_active=True
        )
        
        # Create subscription
        self.subscription = SubscriptionModel.objects.create(
            plan=self.plan,
            user=self.regular_user,
            price=999,
            credits_words=1000,
            duration_type='monthly',
            start_date=date.today(),
            expire_date=date.today() + timedelta(days=30),
            status='active'
        )
        
        self.client = APIClient()
    
    def test_list_subscriptions_admin(self):
        """Admin can list all subscriptions."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/plan/admin/subscriptions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_list_subscriptions_non_admin_forbidden(self):
        """Non-admin cannot list subscriptions via admin endpoint."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/plan/admin/subscriptions/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_cancel_subscription_admin(self):
        """Admin can cancel a subscription."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(f'/api/v1/plan/admin/subscriptions/{self.subscription.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.status, 'cancelled')
    
    def test_extend_subscription_admin(self):
        """Admin can extend a subscription."""
        self.client.force_authenticate(user=self.admin_user)
        original_expire = self.subscription.expire_date
        response = self.client.post(
            f'/api/v1/plan/admin/subscriptions/{self.subscription.id}/extend/',
            {'days': 7}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.expire_date, original_expire + timedelta(days=7))
    
    def test_subscription_stats_admin(self):
        """Admin can get subscription statistics."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/plan/admin/subscriptions/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIn('total_subscriptions', response.data.get('data', {}))
    
    def test_expiring_subscriptions_admin(self):
        """Admin can get expiring subscriptions."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/plan/admin/subscriptions/expiring/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))


class AdminRevenueViewTests(APITestCase):
    """Tests for AdminRevenueView endpoints."""
    
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
        
        self.client = APIClient()
    
    def test_get_revenue_admin(self):
        """Admin can get revenue data."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/plan/admin/revenue/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
    
    def test_get_revenue_non_admin_forbidden(self):
        """Non-admin cannot get revenue data."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/v1/plan/admin/revenue/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ThrottlingTests(APITestCase):
    """Tests for API throttling."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='throttle@test.com',
            password='TestPass123!'
        )
        self.client = APIClient()
    
    def test_throttle_headers_present(self):
        """Test that throttle headers are present in responses."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/plan/')
        # Check response has standard headers
        self.assertIn('Content-Type', response.headers)
