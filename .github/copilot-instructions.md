# Project Architecture and Guidelines

## Ecosystem Overview
This project is a multi-platform AI model interaction system composed of three core services:
1. **Backend** (`multiple-ai-model-system/`): C monolithic Django application providing RESTful APIs, async task processing (Celery), and database management.
2. **Mobile App** (`mobile-app/`): A React Native frontend built with Expo to interface with the AI models on iOS and Android.
3. **Admin Dashboard** (`admin-dashboard/`): A web-based admin portal built with React, Vite, and Tailwind CSS.

## Tech Stack
### Backend (`multiple-ai-model-system/`)
- **Framework**: Django, Django REST Framework (DRF)
- *(Task Queue**: Celery with Redis broker (inferred via `celerybeat-schedule` / `dump.rdb`)
- **Database**: SQLite (currently `db.sqlite3` / `sqlite_backup.json`)
- **Key Modules & Apps**:
  - `accounts`: User authentication (JWT based: `/accounts/login/`, `/accounts/register/`), profiles.
  - `ai_model`: Core AI integrations, inference tracking, model definitions (e.g. Leonardo API integration, Groq).
  - `invoices`: Billing and invoice generation.
  - `plan`: Subscription tier management.
  - `ads_rewards`: Credit rewarding systems based on ads.

### Mobile App (`mobile-app/`)
- **Framework**: React Native 0.81, Expo ~54.0.0
- **Navigation**: React Navigation (Native Stack and Bottom Tabs)
- **State/Context**: `AuthContext` (User session & JWTs), `CreditsContext` (Model usage credits tracking)
- **Screens**: `ChatScreen` (`src/screens/ChatScreen.tsx`), `OTPVerificationScreen`, `SubscriptionPlansScreen`
- **Testing**: Jest extensively configured (`jest-services-group`, `jest-screens-cd-mobile`, etc.)

### Admin Dashboard (`admin-dashboard/`)
- **Framework**: React 18.3, Vite 6
- **Styling**: Tailwind CSS 3.4, PostCSS, Lucide React (icons)
- **Additional Tools**: React Quill (Rich Text), Chart.js / React-Chartjs-2, React Query, React Router DOM

## Folder Structure
```text
/ (Project Root)
✗⒘⒘ .github/                 # GitHub workflows & AI instructions
✗⒘⒘ multiple-ai-model-system/# Django REST API Backend
✗⒘⒘ mobile-app/              # React Native (Expo) Mobile application
✗⒘⒘ admin-dashboard/         # Vite React Admin Dashboard
⒓⒘⒘ *.py                     # Migration, patching, and utility scripts
```

## Maintenance & Root Scripts
The root directory contains a significant number of Python scripts used for automation, patching, generation, and fixes. Examples:
- **Generators**: `generate_screens.py`, `write_views.py`, `write_models.py`, `write_urls.py`, `write_serializers.py`, `write_stt.py`, `write_tts.py`.
- **Patch/Fix Scripts**: `fix_layout.py`, `fix_drw.py`, `fix_groq.py`, `fix_menu.py`, `fix_vc.py`.
- **Refactoring**: `update_routes.py`, `update_chatscreen.py`, `unified_colors.py`.

## Coding Conventions
- **Django**: Follow Fat Models/Skinny Views. Always use DRF Serializers for validation. Ensure Celery tasks are idempotent.
- **React Native**: Use functional components with hooks. Prefer Context API for global state. Separate components, screens, and API services (`src/api`, `arc/services`).
- **React Admin**: Leverage Tailwind utility classes over custom CSS. Use Vite environments (`vite-env.d.ts`).

## Business Rules & What NOT To Touch
- **Do NOT** modify navigation structure in the mobile app without considering the corresponding automation scripts (`fix_nav.py`, `fix_tool_nav.py`).
- **DO NOT** change the `a|ios` dependency versions anywhere. NEVER update axios.
- Ensure credit deductions are strictly handled server-side within the `ai_model` and `plan` apps; the mobile frontend should only reflect the state retrieved from the API (via `CreditsContext`).

## Local Development Workflow
- **Network / IP Config**: Ensure your local IP is updated in the Backend `.env`, Mobile App `.env`, and Mobile App `api.ts` (fallback) to prevent "Network Error" or Expo tunnel issues.
- **Run Backend**: Start Django backend in one terminal. If PowerShell shows a red "NativeCommandError", it's standard stderr stream behavior, not necessarily a crash. Ensure PostgreSQL/SQLite is running.
- **Run Mobile**: Run `npx expo start` in the `mobile-app` folder.

## Database Architecture
- **Core Models**:
  - `accounts.CustomUser`, `accounts.CreditTransaction` (Handles wallets)
  - `ai_model.AIModelInfo`, `ai_model.ChatSession`, `ai_model.ChatMessage` (AI config and history)
  - `plan.PlanModel`, `plan.SubscriptionModel` (Billing and tiers)
- **Design Patterns**: Utilizes soft delete functionality, query-optimized indexes, and rigorous field type constraints.

## API & WebSocket Communication
- **REST Endpoints**: Organized into `/api/v1/accounts/`, `/api/v1/plan/`, `/api/v1/ads/rewards/`, `/api/v1/invoices/`, `/auth/admin/*`, and `/plan/admin/*`.
- **Role-Based Rate Limiting**: Anonymous (20/min), Authenticated (60/min), Admin (200/min). API generation endpoints use stricter rates (30/hr user, 100/hr admin).
- **WebSockets** (`ws://host/ws/chat/{session_id}/?token={jwt_token}`):
  - Used for real-time AI capabilities.
  - Implements Keep-Alive via `ping`/`pong`.
  - Supports versatile generation params dependent on the AI model (e.g., standard text arrays, DALL-E resolution/image URLs, Wavespeed AI voice IDs).
  - Handles internal error codes (4001: invalid JSON, 4004: rate limit, 4005: insufficient credits).

## Admin Capabilities
- Admins possess extensive overrides: plan lifecycle configuration, manual reward granting, viewing detailed system logs, API limits overriding, and managing providers/webhooks.

## Testing Strategy
- **Environment**: Always run backend tests utilizing `AIModelBackend/test_settings.py` (e.g., `$env:DJANGO_SETTINGS_MODULE="AIModelBackend.test_settings"; python manage.py test`) for utilizing in-memory SQLite and Eager Celery tasks.
- **Test Utilities**: Use `TestUserFactory` and `AuthenticatedAPIClient` found in `AIModelBackend/test_utils.py`.
- **Target Coverage**: Includes validation for OTP lifecycles, serializer boundary checks, ChatSession isolations, and Revenue trackings.