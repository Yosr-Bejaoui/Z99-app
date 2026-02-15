# Multi-AI Platform - Testing Guide

## Running Tests

### Quick Start

```bash
# Run all tests
python manage.py test

# Run tests with test settings (recommended - faster & isolated)
$env:DJANGO_SETTINGS_MODULE="AIModelBackend.test_settings"
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test plan
python manage.py test ai_model

# Run with verbosity
python manage.py test --verbosity=2
```

### Test Coverage

```bash
# Install coverage
pip install coverage

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

## Test Structure

### Accounts App (`accounts/tests.py`)
- **UserModelTests** - User creation, superuser, validation
- **OTPModelTests** - OTP creation, expiration
- **CreditAccountTests** - Auto-creation via signals, transactions
- **RegisterSerializerTests** - Password validation rules
- **RegisterAPITests** - Registration endpoint
- **LoginAPITests** - Login endpoint

### Plan App (`plan/tests.py`)
- **PlanModelTests** - Plan creation, uniqueness
- **SubscriptionModelTests** - Subscription lifecycle, expiration
- **RevenueModelTests** - Revenue tracking
- **PlanSerializerTests** - Serialization
- **SubscriptionSerializerTests** - Validation rules
- **PlanAPITests** - API endpoints

### AI Model App (`ai_model/tests.py`)
- **AIModelInfoTests** - Model creation, uniqueness
- **ChatSessionTests** - Session management
- **ChatMessageTests** - Message handling
- **AIModelSerializerTests** - Public vs admin serializers
- **ChatSessionSerializerTests** - Type compatibility validation
- **AIModelAPITests** - API authentication
- **ChatSessionAPITests** - Session isolation

## Test Configuration

### Test Settings (`AIModelBackend/test_settings.py`)

The test settings provide:
- **In-memory SQLite** - Faster database operations
- **Eager Celery** - Tasks run synchronously without broker
- **Disabled throttling** - No rate limiting during tests
- **Null logging** - Clean test output
- **Fast password hashing** - MD5 for speed

### Test Utilities (`AIModelBackend/test_utils.py`)

Helper classes available:
- `TestUserFactory` - Creates test users
- `AuthenticatedAPIClient` - Auto-authentication
- `TestDataFactory` - Creates test plans, models, sessions
- `get_auth_header()` - JWT header helper
- `assert_error_response()` - Error format validation

## Writing New Tests

### Example Test

```python
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from AIModelBackend.test_utils import TestUserFactory, TestDataFactory

class MyFeatureTests(APITestCase):
    def setUp(self):
        self.user = TestUserFactory.create_user(
            email='test@example.com',
            is_active=True
        )
        self.ai_model = TestDataFactory.create_ai_model(
            name='Test Model',
            model_type='chat'
        )
    
    def test_my_feature(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/my-endpoint/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```

### Mocking Celery Tasks

```python
from unittest.mock import patch

def test_with_celery_task(self):
    with patch('myapp.views.my_task.delay') as mock_task:
        response = self.client.post('/api/v1/endpoint/', data)
        self.assertTrue(mock_task.called)
```

## API Endpoints Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/accounts/register/` | POST | User registration |
| `/api/v1/accounts/activate/` | POST | Activate account |
| `/api/v1/accounts/login/` | POST | Login (JWT tokens) |
| `/api/v1/accounts/logout/` | POST | Logout (blacklist token) |
| `/api/v1/accounts/forgot-password/` | POST | Request password reset |
| `/api/v1/accounts/reset-password/` | POST | Reset password |

### AI Models
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/list/` | GET | List AI models |
| `/api/v1/list/{id}/` | GET | Get model details |
| `/api/v1/chat/session/list/` | GET | List user sessions |
| `/api/v1/chat/session/list/` | POST | Create session |
| `/api/v1/chat/session/list/{id}/` | GET | Get session |

### Plans
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/plan/list/` | GET | List plans |
| `/api/v1/plan/list/{id}/` | GET | Get plan details |
| `/api/v1/plan/webhook/` | POST | Stripe webhook |
| `/api/v1/plan/revenue/` | GET | Revenue stats |

### User Profile
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/accounts/profile/` | GET | List profiles |
| `/api/v1/accounts/credit-account/` | GET | Get credit balance |
| `/api/v1/accounts/transactions/` | GET | Transaction history |

## Continuous Integration

Recommended CI configuration:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: |
          export DJANGO_SETTINGS_MODULE=AIModelBackend.test_settings
          python manage.py test
```
