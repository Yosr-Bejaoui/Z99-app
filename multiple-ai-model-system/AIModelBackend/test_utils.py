"""
Test utilities and fixtures for the Multi-AI Platform.
Provides common test helpers, factories, and utilities.
"""
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal

User = get_user_model()


class TestUserFactory:
    """Factory for creating test users."""
    
    @staticmethod
    def create_user(
        email='test@example.com',
        password='TestPass123',
        username='testuser',
        is_active=True,
        **kwargs
    ):
        """Create a regular test user."""
        return User.objects.create_user(
            email=email,
            password=password,
            username=username,
            is_active=is_active,
            **kwargs
        )
    
    @staticmethod
    def create_admin(
        email='admin@example.com',
        password='AdminPass123',
        **kwargs
    ):
        """Create a superuser/admin."""
        return User.objects.create_superuser(
            email=email,
            password=password,
            **kwargs
        )


class AuthenticatedAPIClient(APIClient):
    """APIClient with helper methods for authentication."""
    
    def authenticate_user(self, user):
        """Authenticate the client with JWT tokens for a user."""
        refresh = RefreshToken.for_user(user)
        self.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        return str(refresh.access_token)
    
    def authenticate_as_new_user(self, email='auth@example.com', password='TestPass123'):
        """Create a new user and authenticate."""
        user = TestUserFactory.create_user(email=email, password=password)
        self.authenticate_user(user)
        return user


class TestDataFactory:
    """Factory for creating test data."""
    
    @staticmethod
    def create_plan(
        name='Test Plan',
        plan_code='TEST_001',
        words_or_credits=1000,
        amount=9.99
    ):
        """Create a test plan."""
        from plan.models import PlanModel
        return PlanModel.objects.create(
            name=name,
            plan_code=plan_code,
            words_or_credits=words_or_credits,
            amount=amount
        )
    
    @staticmethod
    def create_ai_model(
        name='Test AI Model',
        version='1.0',
        provider='openai',
        model_id='test-model',
        model_type='chat',
        is_active=True,
        base_cost=Decimal('1.00')
    ):
        """Create a test AI model."""
        from ai_model.models import AIModelInfo
        return AIModelInfo.objects.create(
            name=name,
            version=version,
            provider=provider,
            model_id=model_id,
            model_type=model_type,
            is_active=is_active,
            base_cost=base_cost
        )
    
    @staticmethod
    def create_chat_session(user, ai_model, session_type='chat'):
        """Create a test chat session."""
        from ai_model.models import ChatSession
        return ChatSession.objects.create(
            model=ai_model,
            user=user,
            session_type=session_type
        )
    
    @staticmethod
    def create_credit_account(user, credits=100):
        """Create a credit account for a user."""
        from accounts.models import CreditAccount
        return CreditAccount.objects.create(
            user=user,
            credits=Decimal(str(credits))
        )


def get_auth_header(user):
    """Get JWT authorization header for a user."""
    refresh = RefreshToken.for_user(user)
    return {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}


def assert_error_response(response, expected_code=None):
    """Assert that response follows the standard error format."""
    assert 'success' in response.data, "Response missing 'success' field"
    assert response.data['success'] is False, "Expected success=False"
    assert 'error' in response.data, "Response missing 'error' field"
    
    if expected_code:
        assert response.data['error'].get('code') == expected_code, \
            f"Expected error code '{expected_code}', got '{response.data['error'].get('code')}'"


def assert_success_response(response):
    """Assert that response is successful (for custom success format if used)."""
    if 'success' in response.data:
        assert response.data['success'] is True, "Expected success=True"
