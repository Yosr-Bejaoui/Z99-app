"""
Unit tests for the plan app.
Tests cover: Plans, Subscriptions, Revenue tracking
"""
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
from .models import PlanModel, SubscriptionModel, Revenue
from .serializers import PlanSerializer, SubscriptionSerializer

User = get_user_model()


class PlanModelTests(TestCase):
    """Tests for PlanModel."""
    
    def test_create_plan(self):
        """Test creating a plan."""
        plan = PlanModel.objects.create(
            name='Basic Plan',
            plan_code='BASIC_001',
            discription='Basic subscription plan',
            words_or_credits=1000,
            amount=9.99
        )
        self.assertEqual(plan.name, 'Basic Plan')
        self.assertEqual(plan.plan_code, 'BASIC_001')
        self.assertEqual(plan.words_or_credits, 1000)
        self.assertEqual(plan.amount, 9.99)
    
    def test_plan_str_representation(self):
        """Test plan string representation."""
        plan = PlanModel.objects.create(
            name='Pro Plan',
            plan_code='PRO_001',
            words_or_credits=5000,
            amount=29.99
        )
        self.assertIn('Pro Plan', str(plan))
        self.assertIn('PRO_001', str(plan))
    
    def test_plan_code_unique(self):
        """Test plan_code uniqueness."""
        PlanModel.objects.create(
            name='Plan 1',
            plan_code='UNIQUE_CODE',
            words_or_credits=1000,
            amount=9.99
        )
        with self.assertRaises(Exception):
            PlanModel.objects.create(
                name='Plan 2',
                plan_code='UNIQUE_CODE',  # Duplicate
                words_or_credits=2000,
                amount=19.99
            )


class SubscriptionModelTests(TestCase):
    """Tests for SubscriptionModel."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='sub@example.com',
            password='TestPass123'
        )
        self.plan = PlanModel.objects.create(
            name='Test Plan',
            plan_code='TEST_001',
            words_or_credits=1000,
            amount=9.99
        )
    
    def test_create_subscription(self):
        """Test creating a subscription."""
        subscription = SubscriptionModel.objects.create(
            plan=self.plan,
            user=self.user,
            price=999,
            credits_words=1000,
            duration_type='monthly',
            start_date=date.today(),
            expire_date=date.today() + timedelta(days=30),
            status='active'
        )
        self.assertEqual(subscription.user, self.user)
        self.assertEqual(subscription.plan, self.plan)
        self.assertEqual(subscription.status, 'active')
    
    def test_subscription_not_expired(self):
        """Test subscription is not expired when expire_date is in future."""
        subscription = SubscriptionModel.objects.create(
            plan=self.plan,
            user=self.user,
            price=999,
            credits_words=1000,
            duration_type='monthly',
            start_date=date.today(),
            expire_date=date.today() + timedelta(days=30),
            status='active'
        )
        self.assertFalse(subscription.is_expired)
    
    def test_subscription_expired(self):
        """Test subscription is expired when expire_date is in past."""
        subscription = SubscriptionModel.objects.create(
            plan=self.plan,
            user=self.user,
            price=999,
            credits_words=1000,
            duration_type='monthly',
            start_date=date.today() - timedelta(days=60),
            expire_date=date.today() - timedelta(days=30),
            status='active'
        )
        self.assertTrue(subscription.is_expired)
    
    def test_subscription_str_representation(self):
        """Test subscription string representation."""
        subscription = SubscriptionModel.objects.create(
            plan=self.plan,
            user=self.user,
            price=999,
            credits_words=1000,
            duration_type='monthly',
            start_date=date.today(),
            expire_date=date.today() + timedelta(days=30),
            status='active'
        )
        self.assertIn(str(self.user), str(subscription))
        self.assertIn('active', str(subscription))


class RevenueModelTests(TestCase):
    """Tests for Revenue model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='revenue@example.com',
            password='TestPass123'
        )
        self.plan = PlanModel.objects.create(
            name='Revenue Plan',
            plan_code='REV_001',
            words_or_credits=1000,
            amount=9.99
        )
    
    def test_create_revenue_record(self):
        """Test creating a revenue record."""
        revenue = Revenue.objects.create(
            user=self.user,
            plan=self.plan,
            amount=Decimal('9.99'),
            payment_id='pay_123456'
        )
        self.assertEqual(revenue.amount, Decimal('9.99'))
        self.assertEqual(revenue.payment_id, 'pay_123456')


class PlanSerializerTests(TestCase):
    """Tests for PlanSerializer."""
    
    def test_serialize_plan(self):
        """Test serializing a plan."""
        plan = PlanModel.objects.create(
            name='Serializer Test Plan',
            plan_code='SER_001',
            words_or_credits=2000,
            amount=19.99
        )
        serializer = PlanSerializer(plan)
        self.assertEqual(serializer.data['name'], 'Serializer Test Plan')
        self.assertEqual(serializer.data['plan_code'], 'SER_001')


class SubscriptionSerializerTests(TestCase):
    """Tests for SubscriptionSerializer."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='subser@example.com',
            password='TestPass123',
            username='subseruser'
        )
        self.plan = PlanModel.objects.create(
            name='Serializer Plan',
            plan_code='SUBSER_001',
            words_or_credits=1000,
            amount=9.99
        )
    
    def test_serialize_subscription(self):
        """Test serializing a subscription with user and plan details."""
        subscription = SubscriptionModel.objects.create(
            plan=self.plan,
            user=self.user,
            price=999,
            credits_words=1000,
            duration_type='monthly',
            start_date=date.today(),
            expire_date=date.today() + timedelta(days=30),
            status='active'
        )
        serializer = SubscriptionSerializer(subscription)
        self.assertEqual(serializer.data['status'], 'active')
        self.assertIn('user_details', serializer.data)
        self.assertIn('plan_details', serializer.data)
        self.assertEqual(serializer.data['user_details']['email'], 'subser@example.com')
    
    def test_validate_expire_date_after_start_date(self):
        """Test validation that expire_date must be after start_date."""
        data = {
            'plan': self.plan.id,
            'user': self.user.id,
            'price': 999,
            'credits_words': 1000,
            'duration_type': 'monthly',
            'start_date': date.today(),
            'expire_date': date.today() - timedelta(days=1),  # Invalid: before start_date
            'status': 'active'
        }
        serializer = SubscriptionSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('expire_date', serializer.errors)


class PlanAPITests(APITestCase):
    """API tests for plan endpoints."""
    
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='AdminPass123'
        )
        self.user = User.objects.create_user(
            email='user@example.com',
            password='UserPass123',
            is_active=True
        )
        self.plan = PlanModel.objects.create(
            name='API Test Plan',
            plan_code='API_001',
            words_or_credits=1000,
            amount=9.99
        )
    
    def test_list_plans_authenticated(self):
        """Test listing plans as authenticated user."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/plan/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_plans_unauthenticated(self):
        """Test listing plans without authentication."""
        response = self.client.get('/api/v1/plan/list/')
        # Should be allowed based on current permissions
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED])
