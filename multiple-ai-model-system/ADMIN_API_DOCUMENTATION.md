# Admin API Documentation

Base URL: `/api/v1/`

All admin endpoints require admin authentication.
**Header:** `Authorization: Bearer <access_token>`
**Required:** User must have `is_admin = true` or `is_superuser = true`

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

| Throttle Type | Anonymous | Authenticated | Admin |
|--------------|-----------|---------------|-------|
| Burst Rate | 20/min | 60/min | 200/min |
| Sustained Rate | 100/hour | 1000/hour | 5000/hour |
| AI Generation | N/A | 30/hour | 100/hour |

Response when rate limited:
```json
{
  "detail": "Request was throttled. Expected available in X seconds."
}
```

---

## Plan Administration

### List All Plans
**Endpoint:** `GET /plan/admin/plans/`
**Description:** Get all plans with optional filtering

**Query Parameters:**
- `is_active` (boolean): Filter by active status
- `search` (string): Search in name and description

**Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Basic Plan",
      "plan_code": "BASIC_001",
      "description": "Basic subscription plan",
      "words_or_credits": 1000,
      "amount": "9.99",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Plan
**Endpoint:** `POST /plan/admin/plans/`
**Input:**
```json
{
  "name": "string",
  "plan_code": "string (unique)",
  "description": "string",
  "words_or_credits": 1000,
  "amount": "9.99",
  "is_active": true
}
```
**Output:**
```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": { ... }
}
```

### Update Plan
**Endpoint:** `PATCH /plan/admin/plans/{id}/`
**Input:** Any plan fields to update

### Delete Plan
**Endpoint:** `DELETE /plan/admin/plans/{id}/`

### Activate Plan
**Endpoint:** `POST /plan/admin/plans/{id}/activate/`

### Deactivate Plan
**Endpoint:** `POST /plan/admin/plans/{id}/deactivate/`

### Plan Statistics
**Endpoint:** `GET /plan/admin/plans/stats/`
**Output:**
```json
{
  "success": true,
  "data": {
    "total_plans": 10,
    "active_plans": 8,
    "inactive_plans": 2,
    "plans_by_price_range": {
      "low": 5,
      "medium": 3,
      "high": 2
    }
  }
}
```

---

## Subscription Administration

### List All Subscriptions
**Endpoint:** `GET /plan/admin/subscriptions/`
**Query Parameters:**
- `status` (string): active, cancelled, expired
- `user` (integer): Filter by user ID
- `plan` (integer): Filter by plan ID

### Cancel Subscription
**Endpoint:** `POST /plan/admin/subscriptions/{id}/cancel/`
**Output:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

### Extend Subscription
**Endpoint:** `POST /plan/admin/subscriptions/{id}/extend/`
**Input:**
```json
{
  "days": 7
}
```

### Subscription Statistics
**Endpoint:** `GET /plan/admin/subscriptions/stats/`
**Output:**
```json
{
  "success": true,
  "data": {
    "total_subscriptions": 100,
    "active_subscriptions": 80,
    "cancelled_subscriptions": 15,
    "expired_subscriptions": 5,
    "monthly_revenue": "999.99"
  }
}
```

### Expiring Subscriptions
**Endpoint:** `GET /plan/admin/subscriptions/expiring/`
**Query Parameters:**
- `days` (integer, default: 7): Days until expiration

---

## Revenue Analytics

### Get Revenue Data
**Endpoint:** `GET /plan/admin/revenue/`
**Query Parameters:**
- `period` (string): daily, weekly, monthly, yearly
- `start_date` (date): YYYY-MM-DD
- `end_date` (date): YYYY-MM-DD

**Output:**
```json
{
  "success": true,
  "data": {
    "total_revenue": "9999.99",
    "revenue_by_period": [
      {"period": "2024-01", "amount": "1000.00"},
      {"period": "2024-02", "amount": "1200.00"}
    ],
    "top_plans": [
      {"plan": "Pro Plan", "revenue": "5000.00"}
    ]
  }
}
```

---

## Invoice Administration

### List All Invoices
**Endpoint:** `GET /invoices/admin/invoices/`
**Query Parameters:**
- `status` (string): pending, paid, refunded, cancelled
- `user` (integer): Filter by user ID
- `start_date` (date): YYYY-MM-DD
- `end_date` (date): YYYY-MM-DD

### Create Invoice
**Endpoint:** `POST /invoices/admin/invoices/`
**Input:**
```json
{
  "user": 1,
  "amount": "29.99",
  "status": "pending",
  "invoice_number": "INV-001",
  "description": "string"
}
```

### Update Invoice
**Endpoint:** `PATCH /invoices/admin/invoices/{id}/`

### Delete Invoice
**Endpoint:** `DELETE /invoices/admin/invoices/{id}/`

### Mark Invoice as Paid
**Endpoint:** `POST /invoices/admin/invoices/{id}/mark_paid/`

### Mark Invoice as Refunded
**Endpoint:** `POST /invoices/admin/invoices/{id}/mark_refunded/`
**Input:**
```json
{
  "reason": "Customer request"
}
```

### Invoice Statistics
**Endpoint:** `GET /invoices/admin/invoices/stats/`
**Output:**
```json
{
  "success": true,
  "data": {
    "total_invoices": 500,
    "pending_invoices": 50,
    "paid_invoices": 400,
    "refunded_invoices": 30,
    "total_revenue": "15000.00",
    "total_refunded": "1000.00"
  }
}
```

### Export Invoices to CSV
**Endpoint:** `GET /invoices/admin/invoices/export/`
**Response:** CSV file download

### Search Invoices
**Endpoint:** `GET /invoices/admin/search/`
**Query Parameters:**
- `q` (string): Search query
- `status` (string): Filter by status
- `user` (integer): Filter by user ID

---

## Ad Rewards Administration

### List All Rewards
**Endpoint:** `GET /ads_rewards/admin/rewards/`
**Query Parameters:**
- `user` (integer): Filter by user ID
- `ad_type` (string): video, banner, interstitial
- `start_date` (date): YYYY-MM-DD
- `end_date` (date): YYYY-MM-DD

### Grant Manual Reward
**Endpoint:** `POST /ads_rewards/admin/rewards/grant/`
**Input:**
```json
{
  "user_id": 1,
  "credits": 100,
  "reason": "Bonus reward"
}
```

### Reward Statistics
**Endpoint:** `GET /ads_rewards/admin/rewards/stats/`
**Output:**
```json
{
  "success": true,
  "data": {
    "total_rewards": 1000,
    "total_credits_given": 50000,
    "rewards_today": 50,
    "rewards_by_type": {
      "video": 800,
      "banner": 150,
      "interstitial": 50
    }
  }
}
```

### User Reward History
**Endpoint:** `GET /ads_rewards/admin/rewards/user_history/`
**Query Parameters:**
- `user_id` (integer, required): User ID

### Reward Configuration
**Endpoint:** `GET /ads_rewards/admin/config/`
**Output:**
```json
{
  "success": true,
  "data": {
    "credits_per_video_ad": 10,
    "credits_per_banner_ad": 2,
    "daily_limit": 50,
    "cooldown_seconds": 30
  }
}
```

**Endpoint:** `PUT /ads_rewards/admin/config/`
**Input:**
```json
{
  "credits_per_video_ad": 15,
  "credits_per_banner_ad": 3,
  "daily_limit": 60,
  "cooldown_seconds": 20
}
```

---

## System Configuration

### List System Configs
**Endpoint:** `GET /auth/admin/config/`
**Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "site_name",
      "value": "AI Model System",
      "description": "Site display name",
      "is_encrypted": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create System Config
**Endpoint:** `POST /auth/admin/config/`
**Input:**
```json
{
  "key": "string (unique)",
  "value": "string",
  "description": "string",
  "is_encrypted": false
}
```

### Update System Config
**Endpoint:** `PATCH /auth/admin/config/{id}/`

### Delete System Config
**Endpoint:** `DELETE /auth/admin/config/{id}/`

---

## API Provider Configuration

### List Providers
**Endpoint:** `GET /auth/admin/providers/`

### Create Provider
**Endpoint:** `POST /auth/admin/providers/`
**Input:**
```json
{
  "name": "openai",
  "display_name": "OpenAI",
  "api_key": "sk-...",
  "base_url": "https://api.openai.com/v1",
  "is_enabled": true,
  "settings": {
    "default_model": "gpt-4",
    "max_tokens": 4096
  }
}
```

### Test Provider Connection
**Endpoint:** `POST /auth/admin/providers/{id}/test/`
**Output:**
```json
{
  "success": true,
  "message": "Connection successful",
  "response_time_ms": 250
}
```

---

## Webhook Configuration

### List Webhooks
**Endpoint:** `GET /auth/admin/webhooks/`

### Create Webhook
**Endpoint:** `POST /auth/admin/webhooks/`
**Input:**
```json
{
  "name": "stripe_webhook",
  "url": "https://example.com/webhook",
  "secret": "whsec_...",
  "events": ["payment.success", "payment.failed"],
  "is_enabled": true
}
```

### Test Webhook
**Endpoint:** `POST /auth/admin/webhooks/{id}/test/`

---

## System Logs (Read-Only)

### List Logs
**Endpoint:** `GET /auth/admin/logs/`
**Query Parameters:**
- `level` (string): debug, info, warning, error, critical
- `source` (string): Filter by source
- `start_date` (datetime): ISO 8601 format
- `end_date` (datetime): ISO 8601 format

**Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "level": "info",
      "message": "User login successful",
      "source": "auth",
      "user_id": 1,
      "details": {"ip": "192.168.1.1"},
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

## WebSocket Chat

### Connection
**URL:** `ws://host/ws/chat/{session_id}/?token={jwt_token}`

### Message Types

#### Ping/Pong (Heartbeat)
Client sends:
```json
{"type": "pong"}
```

Server sends:
```json
{
  "type": "ping",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### Chat Message
Client sends:
```json
{
  "message": "Hello, AI!",
  "images": ["base64_or_url"],
  "voice": "base64_audio_data"
}
```

Server responds:
```json
{
  "type": "new_message",
  "message": {
    "id": 1,
    "sender": "ai",
    "content": "Hello! How can I help?",
    "images": [],
    "timestamp": "2024-01-01T12:00:00Z"
  },
  "remaining_credits": 950.0
}
```

### Error Responses
```json
{
  "type": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many messages. Please wait 30 seconds.",
    "retry_after": 30
  }
}
```

### Error Codes
| Code | Name | Description |
|------|------|-------------|
| 4001 | INVALID_JSON | Invalid JSON format in message |
| 4002 | UNAUTHORIZED | Authentication required or expired |
| 4003 | SESSION_NOT_FOUND | Chat session not found |
| 4004 | RATE_LIMIT_EXCEEDED | Too many messages |
| 4005 | INSUFFICIENT_CREDITS | Not enough credits |
| 4006 | MODEL_NOT_AVAILABLE | AI model unavailable |
| 4007 | INTERNAL_ERROR | Server error |
| 4008 | CONNECTION_TIMEOUT | No activity timeout |
| 4009 | INVALID_MESSAGE | Invalid message format |

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "total_items": 100
  }
}
```
