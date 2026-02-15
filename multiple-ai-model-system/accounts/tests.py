"""
Unit tests for the accounts app.
Tests cover: User registration, Login, Password validation, Credit accounts
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import OTP, CreditAccount, CreditTransaction, UserProfile
from .serializers import RegisterSerializer

User = get_user_model()


class UserModelTests(TestCase):
    """Tests for CustomUser model."""
    
    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123',
            username='testuser'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.username, 'testuser')
        self.assertTrue(user.check_password('TestPass123'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_create_superuser(self):
        """Test creating a superuser."""
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='AdminPass123'
        )
        self.assertEqual(admin.email, 'admin@example.com')
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
    
    def test_create_user_without_email_fails(self):
        """Test that creating user without email raises error."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='TestPass123')
    
    def test_user_str_representation(self):
        """Test user string representation."""
        user = User.objects.create_user(email='test@example.com', password='Test123')
        self.assertEqual(str(user), 'test@example.com')


class OTPModelTests(TestCase):
    """Tests for OTP model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='otp@example.com',
            password='TestPass123'
        )
    
    def test_create_otp(self):
        """Test creating an OTP."""
        otp = OTP.objects.create(user=self.user, code='123456', type='registration')
        self.assertEqual(otp.code, '123456')
        self.assertEqual(otp.type, 'registration')
    
    def test_otp_not_expired_immediately(self):
        """Test OTP is not expired right after creation."""
        otp = OTP.objects.create(user=self.user, code='123456')
        self.assertFalse(otp.is_expired())


class CreditAccountTests(TestCase):
    """Tests for CreditAccount model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='credits@example.com',
            password='TestPass123',
            is_active=True  # This triggers the signal to create CreditAccount
        )
    
    def test_credit_account_auto_created(self):
        """Test credit account is auto-created via signal."""
        # Credit account should be auto-created when user is active
        self.assertTrue(hasattr(self.user, 'creditaccount'))
        self.assertEqual(self.user.creditaccount.credits, 1000)  # Initial bonus
    
    def test_credit_transaction(self):
        """Test creating a credit transaction."""
        # Use the auto-created account
        account = self.user.creditaccount
        transaction = CreditTransaction.objects.create(
            credit_account=account,
            amount=50,
            transaction_type='add',
            message='Test bonus'
        )
        self.assertEqual(transaction.amount, 50)
        self.assertEqual(transaction.transaction_type, 'add')


class RegisterSerializerTests(TestCase):
    """Tests for RegisterSerializer validation."""
    
    def test_valid_registration_data(self):
        """Test valid registration data passes validation."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'ValidPass1',
            'confirm_password': 'ValidPass1'
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
    
    def test_password_too_short(self):
        """Test password under 8 characters fails."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'Short1',
            'confirm_password': 'Short1'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)
    
    def test_password_no_uppercase(self):
        """Test password without uppercase fails."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'nouppercase1',
            'confirm_password': 'nouppercase1'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_password_no_lowercase(self):
        """Test password without lowercase fails."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'NOLOWERCASE1',
            'confirm_password': 'NOLOWERCASE1'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_password_no_digit(self):
        """Test password without digit fails."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'NoDigitPass',
            'confirm_password': 'NoDigitPass'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_password_mismatch(self):
        """Test password confirmation mismatch fails."""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'ValidPass1',
            'confirm_password': 'DifferentPass1'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
    
    def test_duplicate_email(self):
        """Test duplicate email fails."""
        User.objects.create_user(email='existing@example.com', password='Test123')
        data = {
            'username': 'newuser',
            'email': 'existing@example.com',
            'password': 'ValidPass1',
            'confirm_password': 'ValidPass1'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_duplicate_username(self):
        """Test duplicate username fails."""
        User.objects.create_user(
            email='first@example.com',
            password='Test123',
            username='existinguser'
        )
        data = {
            'username': 'existinguser',
            'email': 'new@example.com',
            'password': 'ValidPass1',
            'confirm_password': 'ValidPass1'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)


class RegisterAPITests(APITestCase):
    """API tests for registration endpoint."""
    
    def test_register_success(self):
        """Test successful registration via API."""
        from unittest.mock import patch
        
        url = '/api/v1/accounts/register/'
        data = {
            'username': 'apiuser',
            'email': 'api@example.com',
            'password': 'ValidPass1',
            'confirm_password': 'ValidPass1'
        }
        
        # Mock the Celery task to avoid broker connection
        with patch('accounts.views.send_otp_email_task.delay') as mock_task:
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            # Verify task was called
            self.assertTrue(mock_task.called)
    
    def test_register_invalid_password(self):
        """Test registration fails with weak password."""
        url = '/api/v1/accounts/register/'
        data = {
            'username': 'apiuser',
            'email': 'api@example.com',
            'password': 'weak',
            'confirm_password': 'weak'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITests(APITestCase):
    """API tests for login endpoint."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='login@example.com',
            password='TestPass123',
            username='loginuser',
            is_active=True
        )
    
    def test_login_success(self):
        """Test successful login."""
        url = '/api/v1/accounts/login/'
        data = {
            'email': 'login@example.com',
            'password': 'TestPass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_login_wrong_password(self):
        """Test login fails with wrong password."""
        url = '/api/v1/accounts/login/'
        data = {
            'email': 'login@example.com',
            'password': 'WrongPassword1'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_nonexistent_user(self):
        """Test login fails for nonexistent user."""
        url = '/api/v1/accounts/login/'
        data = {
            'email': 'nonexistent@example.com',
            'password': 'TestPass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
