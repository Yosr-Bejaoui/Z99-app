# Database Structure Documentation

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ACCOUNTS MODULE                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────┐       ┌─────────────────────────────────┐          │
│  │         CustomUser              │       │         UserProfile              │          │
│  ├─────────────────────────────────┤       ├─────────────────────────────────┤          │
│  │ PK id                           │       │ PK id                            │          │
│  │ email (unique)                  │───────│ FK user (OneToOne)               │          │
│  │ password                        │       │ first_name                       │          │
│  │ is_staff                        │       │ last_name                        │          │
│  │ is_active                       │       │ phone_number                     │          │
│  │ is_superuser                    │       │ profile_picture                  │          │
│  │ date_joined                     │       │ created_at                       │          │
│  │ total_token_used (decimal)      │       │ updated_at                       │          │
│  │ subscribed                      │       └─────────────────────────────────┘          │
│  │ word_limit                      │                                                     │
│  │ api_limit                       │       ┌─────────────────────────────────┐          │
│  │ is_deleted (soft delete)        │       │       CreditAccount             │          │
│  │ deleted_at                      │       ├─────────────────────────────────┤          │
│  └─────────────────────────────────┘       │ PK id                            │          │
│              │                             │ FK user (OneToOne)               │──────────│
│              │                             │ credits (decimal)                │          │
│              │                             │ created_at                       │          │
│              ▼                             │ updated_at                       │          │
│  ┌─────────────────────────────────┐       └─────────────────────────────────┘          │
│  │     CreditTransaction           │                     │                               │
│  ├─────────────────────────────────┤                     │                               │
│  │ PK id                           │                     │                               │
│  │ FK credit_account               │◄────────────────────┘                               │
│  │ transaction_type                │                                                     │
│  │ amount                          │  INDEX: (credit_account, -created_at)               │
│  │ message                         │                                                     │
│  │ created_at (indexed)            │                                                     │
│  └─────────────────────────────────┘                                                     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    AI_MODEL MODULE                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────┐       ┌─────────────────────────────────┐          │
│  │         AIModelInfo             │       │         ChatSession              │          │
│  ├─────────────────────────────────┤       ├─────────────────────────────────┤          │
│  │ PK id                           │       │ PK id                            │          │
│  │ model_name                      │       │ FK user                          │──────────│
│  │ model_id (unique)               │◄──────│ FK model                         │          │
│  │ provider (indexed)              │       │ session_type                     │          │
│  │ model_type                      │       │ summary                          │          │
│  │ base_cost (decimal 20,8)        │       │ created_at (indexed)             │          │
│  │ description                     │       │ updated_at                       │          │
│  │ input_price_per_1m_tokens       │       │ is_deleted (soft delete)         │          │
│  │ output_price_per_1m_tokens      │       │ deleted_at                       │          │
│  │ logo                            │       └─────────────────────────────────┘          │
│  │ image                           │                     │                               │
│  │ video_name                      │  INDEXES:           │                               │
│  │ is_active                       │  - (user, -created_at)                              │
│  │ created_at                      │  - (user, session_type)                             │
│  │ updated_at                      │                     │                               │
│  └─────────────────────────────────┘                     │                               │
│                                                          ▼                               │
│                                            ┌─────────────────────────────────┐          │
│                                            │         ChatMessage              │          │
│                                            ├─────────────────────────────────┤          │
│                                            │ PK id                            │          │
│                                            │ FK session                       │          │
│                                            │ user_message                     │          │
│                                            │ ai_response                      │          │
│                                            │ images (JSON)                    │          │
│                                            │ voice                            │          │
│                                            │ created_at (indexed)             │          │
│                                            └─────────────────────────────────┘          │
│                                                                                          │
│                                            INDEX: (session, -created_at)                 │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                      PLAN MODULE                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────┐       ┌─────────────────────────────────┐          │
│  │          PlanModel              │       │      SubscriptionModel           │          │
│  ├─────────────────────────────────┤       ├─────────────────────────────────┤          │
│  │ PK id                           │       │ PK id                            │          │
│  │ name (max_length=100)           │◄──────│ FK plan                          │          │
│  │ plan_code (max_length=50)       │       │ FK user                          │──────────│
│  │ description (renamed)           │       │ status (indexed)                 │          │
│  │ words_or_credits                │       │ price (decimal 10,2)             │          │
│  │ amount (decimal 10,2)           │       │ duration_type                    │          │
│  │ subscription_duration           │       │ start_date (indexed)             │          │
│  │ stripe_plan_id                  │       │ expire_date (indexed)            │          │
│  │ is_active (new)                 │       │ created_at                       │          │
│  │ created_at                      │       │ updated_at                       │          │
│  │ updated_at                      │       └─────────────────────────────────┘          │
│  └─────────────────────────────────┘                                                     │
│                                            INDEXES:                                      │
│                                            - (user, status)                              │
│                                            - (expire_date, status)                       │
│                                                                                          │
│  ┌─────────────────────────────────┐                                                     │
│  │           Revenue               │                                                     │
│  ├─────────────────────────────────┤                                                     │
│  │ PK id                           │                                                     │
│  │ FK user                         │                                                     │
│  │ amount                          │                                                     │
│  │ date                            │                                                     │
│  │ status                          │                                                     │
│  │ created_at                      │                                                     │
│  │ updated_at                      │                                                     │
│  └─────────────────────────────────┘                                                     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    INVOICES MODULE                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────┐                                                     │
│  │         InvoiceModel            │                                                     │
│  ├─────────────────────────────────┤                                                     │
│  │ PK id                           │                                                     │
│  │ FK user                         │─────────────────────────────────────────────────────│
│  │ FK plan                         │                                                     │
│  │ invoice_id (unique, UUID)       │                                                     │
│  │ amount                          │                                                     │
│  │ words                           │                                                     │
│  │ status                          │                                                     │
│  │ created_at                      │                                                     │
│  │ updated_at                      │                                                     │
│  └─────────────────────────────────┘                                                     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ADS_REWARDS MODULE                                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────┐                                                     │
│  │        RewardsHistory           │                                                     │
│  ├─────────────────────────────────┤                                                     │
│  │ PK id                           │                                                     │
│  │ FK user                         │─────────────────────────────────────────────────────│
│  │ reward_type                     │                                                     │
│  │ reward_amount                   │                                                     │
│  │ ad_network                      │                                                     │
│  │ ad_unit_id                      │                                                     │
│  │ created_at                      │                                                     │
│  │ updated_at                      │                                                     │
│  └─────────────────────────────────┘                                                     │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Model Details

### accounts.CustomUser
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigAutoField | PK | Auto-generated |
| email | EmailField | unique | Primary identifier |
| password | CharField | - | Hashed |
| is_staff | BooleanField | default=False | Admin access |
| is_active | BooleanField | default=True | Account status |
| is_superuser | BooleanField | default=False | Full permissions |
| date_joined | DateTimeField | auto_now_add | - |
| total_token_used | DecimalField | max_digits=20, decimal_places=2 | **Fixed from max_digits=1000000000** |
| subscribed | BooleanField | default=False | Has active subscription |
| word_limit | IntegerField | default=0 | User word limit |
| api_limit | IntegerField | default=0 | API call limit |
| is_deleted | BooleanField | default=False | **NEW: Soft delete flag** |
| deleted_at | DateTimeField | null=True | **NEW: Soft delete timestamp** |

### accounts.CreditTransaction
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigAutoField | PK | - |
| credit_account | ForeignKey | to CreditAccount | - |
| transaction_type | CharField | choices | credit/debit |
| amount | DecimalField | - | Transaction amount |
| message | TextField | null=True | Description |
| created_at | DateTimeField | auto_now_add, **db_index=True** | **NEW: Index added** |

**NEW INDEX:** `(credit_account, -created_at)` for efficient transaction history queries

### ai_model.AIModelInfo
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigAutoField | PK | - |
| model_name | CharField | max_length=255 | Display name |
| model_id | CharField | unique | API identifier |
| provider | CharField | choices, db_index=True | openai, google, etc. |
| model_type | CharField | choices | chat, image, video, etc. |
| base_cost | DecimalField | max_digits=20, decimal_places=8 | **Fixed from decimal_places=50** |
| description | TextField | null=True | Model description |
| input_price_per_1m_tokens | DecimalField | null=True | Input pricing |
| output_price_per_1m_tokens | DecimalField | null=True | Output pricing |
| logo | ImageField | null=True | Provider logo |
| image | ImageField | null=True | Model image |
| video_name | CharField | null=True | Video model name |
| is_active | BooleanField | default=True | Model availability |
| created_at | DateTimeField | auto_now_add | - |
| updated_at | DateTimeField | auto_now | - |

### ai_model.ChatSession
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigAutoField | PK | - |
| user | ForeignKey | to CustomUser | Session owner |
| model | ForeignKey | to AIModelInfo | AI model used |
| session_type | CharField | choices | chat, image, video |
| summary | TextField | null=True | Session summary |
| created_at | DateTimeField | auto_now_add, **db_index=True** | **Index added** |
| updated_at | DateTimeField | auto_now | - |
| is_deleted | BooleanField | default=False | **NEW: Soft delete flag** |
| deleted_at | DateTimeField | null=True | **NEW: Soft delete timestamp** |

**NEW INDEXES:**
- `(user, -created_at)` - User's sessions by date
- `(user, session_type)` - User's sessions by type

### ai_model.ChatMessage
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigAutoField | PK | - |
| session | ForeignKey | to ChatSession | Parent session |
| user_message | TextField | - | User input |
| ai_response | TextField | - | AI output |
| images | JSONField | null=True | Image attachments |
| voice | FileField | null=True | Voice message |
| created_at | DateTimeField | auto_now_add, **db_index=True** | **Index added** |

**NEW INDEX:** `(session, -created_at)` for efficient message pagination

### plan.PlanModel
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigAutoField | PK | - |
| name | CharField | **max_length=100** | **Added max_length** |
| plan_code | CharField | **max_length=50** | **Added max_length** |
| description | TextField | null=True | **RENAMED from 'discription'** |
| words_or_credits | IntegerField | - | Plan allocation |
| amount | DecimalField | **max_digits=10, decimal_places=2** | **Changed from FloatField** |
| subscription_duration | IntegerField | default=30 | Days |
| stripe_plan_id | CharField | null=True | Stripe integration |
| is_active | BooleanField | default=True | **NEW: Plan availability** |
| created_at | DateTimeField | auto_now_add | - |
| updated_at | DateTimeField | auto_now | - |

### plan.SubscriptionModel
| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigAutoField | PK | - |
| user | ForeignKey | to CustomUser | Subscriber |
| plan | ForeignKey | to PlanModel | Selected plan |
| status | CharField | choices, **db_index=True** | **Index added** |
| price | DecimalField | **max_digits=10, decimal_places=2** | **Changed from IntegerField** |
| duration_type | CharField | choices | monthly, yearly, etc. |
| start_date | DateTimeField | **db_index=True** | **Index added** |
| expire_date | DateTimeField | **db_index=True** | **Index added** |
| created_at | DateTimeField | auto_now_add | - |
| updated_at | DateTimeField | auto_now | - |

**NEW INDEXES:**
- `(user, status)` - Find user's active subscriptions
- `(expire_date, status)` - Find expiring subscriptions

## Summary of Changes Made

### 1. Data Type Fixes
- ✅ `CustomUser.total_token_used`: max_digits reduced from 1,000,000,000 to 20
- ✅ `AIModelInfo.base_cost`: decimal_places reduced from 50 to 8

### 2. Field Renames
- ✅ `PlanModel.discription` → `PlanModel.description`

### 3. Field Type Changes
- ✅ `PlanModel.amount`: FloatField → DecimalField(10, 2)
- ✅ `SubscriptionModel.price`: IntegerField → DecimalField(10, 2)

### 4. New Constraints
- ✅ `PlanModel.name`: Added max_length=100
- ✅ `PlanModel.plan_code`: Added max_length=50

### 5. Soft Delete Support
- ✅ `CustomUser`: Added `is_deleted` and `deleted_at` fields
- ✅ `ChatSession`: Added `is_deleted` and `deleted_at` fields

### 6. New Indexes for Query Performance
- ✅ `CreditTransaction`: Index on `(credit_account, -created_at)`
- ✅ `ChatSession`: Index on `(user, -created_at)` and `(user, session_type)`
- ✅ `ChatMessage`: Index on `(session, -created_at)`
- ✅ `SubscriptionModel`: Index on `(user, status)` and `(expire_date, status)`

### 7. New Fields
- ✅ `PlanModel.is_active`: Boolean flag to enable/disable plans

## Migration Files Created
1. `accounts/migrations/0013_fix_models.py`
2. `ai_model/migrations/0019_fix_models.py`
3. `plan/migrations/0009_fix_models.py`
