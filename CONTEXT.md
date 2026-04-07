# Project Context & Current State

## Current State Snapshot
The workspace is actively under development, blending a mature Django REST API backend with a React Native mobile application and a React Admin Dashboard. Heavy use of root-level Python scripts indicates ongoing automated refactoring, scaffolding, and bulk code manipulation.

## Implemented and Working Features

### Backend (`multiple-ai-model-system`)
- Authentication and User Management (`accounts/`), specifically JWT auth via `/accounts/login/`, `/accounts/register/`, `/accounts/activate/` (with code).
- AI Model interaction mapping and endpoints (`ai_model/`).
- Background job processing setup (Celery, `celerybeat-schedule`).
- Database schema established (Django ORM over SQLite with multiple JSON backups).
- Billing and Subscription tracking (`invoices/`, `plan/`).
- External API integrations (e.g., Groq, Leonardo AI via `leronardo_model_id_fetch.py`).

### Mobile App (`mobile-app`)
- Navigation architecture (React Navigation stack and tab routers).
- User authentication flows (`OTPVerificationScreen` is heavily unit-tested).
- Core contexts established (`AuthContext`, `CreditsContext`).
- Subscription and Plans UI (`subscriptionPlansScreen`).
- Extensively configured Jest test suites running seamlessly against services, contexts, and screens (`src/__tests__/`).

### Admin Dashboard (`admin-dashboard`)
- Project scaffolded with Vite and React.
- Tailwind CSS configuration complete.
- Basic layouts, pages, and routing initialized (`src/layouts/`, `src/pages/`, `src/components/`, `src/hooks/`).

## In Progress
- Voice cloning workflows (`write_voice_cloning.py`, `write_voice_cloning_ux.py`).
- Audio processing refinements (`rewrite_audio.py`, `fix_color_audio.py`, `write_audio_tools.py`, `write_stt.py`, `write_tts.py`).
- Universal color and theming standardizations (`unified_colors.py`, `unify_remaining.py`, `cleanup_colors.py`, `color_fix.py`).
- Adding new models/tools dynamically (`insert_tools.py`, `insert_tools2.py`, `insert_missing_tools.py`).

## Known Bugs & Tech Debt
- **Tech Debt**: Heavy reliance on root-level `.py` scripts for code generation/fixes (`fix_*.py`, `write_*.py`). This suggests that the baseline code might be prone to breaking changes being managed by external scripts rather than internal modularization.
- **Tech Debt**: Use of SQLite (`db.sqlite3`) for the backend. Eventually, this should be migrated to PostgreSQL for production readiness, especially given the presence of Celery tasks.
- **Warnings/Errors**: 
  - Admin dashboard has tracked TypeScript errors (`tsc_errors.txt`) and general errors (`errors.txt`).
  - Mobile app has tracked build/bundle logs (`bundle_log.txt`, `expo_error_log.txt`, `android_log.txt`).
  - Backend has smtp test files (`test_smtp.py`) and a tracked error file (`test_error.py`, `error_out.html`).

## Recent Changes
- Significant modifications to the UX/UI colors and layouts (evidenced by `color_fix.py`, `fix_layout.py`).
- Drawer/Menu updates (`fix_drw.py`, `fix_drw2.py`, `fix_menu.py`, `update_drawer.py`).
- Groq integration updates (`fix_groq.py`, `update_groq.py`).
- Refactoring and patching of the Video Tool (`patch_video_tool.py`) and Voice Cloning modules.