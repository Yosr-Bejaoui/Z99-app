---
description: How to run the backend (Django) and mobile app (Expo) for local development
---

# Running the Project Locally

## Prerequisites
- Python 3.13+ with virtual environment at `multiple-ai-model-system/.venv/`
- Node.js 22+ and npm
- PostgreSQL running locally (database: `aimodel_db`, user: `postgres`, password: `postgres`)
- Expo Go app installed on your phone (for mobile testing)
- Both your PC and phone must be on the **same WiFi network**

## Step 1: Find Your Local IP Address

// turbo
Run in PowerShell:
```powershell
ipconfig | findstr /R /C:"IPv4"
```
Note your local WiFi IP (e.g., `192.168.1.11`). Ignore virtual adapter IPs like `192.168.56.1`.

## Step 2: Update Environment Files (if IP changed)

### Backend `.env`
Edit `multiple-ai-model-system/.env`:
- Update `BASE_URL` to `http://<YOUR_IP>:8000`
- Ensure `ALLOWED_HOSTS` contains your IP
- Ensure `DATABASE_ENGINE=postgresql` (or `sqlite` if no PostgreSQL)

### Mobile App `.env`
Edit `mobile-app/.env`:
- Update to: `EXPO_PUBLIC_API_BASE_URL=http://<YOUR_IP>:8000/api/v1`

### Mobile App `api.ts` fallback
Edit `mobile-app/src/services/api.ts`:
- Update the hardcoded fallback IP in `buildFallbackApiBaseUrls` to match your IP

## Step 3: Start the Backend (Django)

// turbo
Open a **new terminal** and run:
```powershell
cd c:\Users\user\Desktop\multiple-ai-model-system-20260204T220529Z-1-001\multiple-ai-model-system
& ".venv\Scripts\python.exe" manage.py runserver 0.0.0.0:8000
```

**IMPORTANT**: Use `0.0.0.0:8000` (not `localhost:8000`) so the server is accessible from your phone on the network.

Wait until you see: `Watching for file changes with StatReloader`

## Step 4: Start Expo (Mobile App)

// turbo
Open a **second terminal** and run:
```powershell
cd c:\Users\user\Desktop\multiple-ai-model-system-20260204T220529Z-1-001\mobile-app
npx expo start --lan
```

**IMPORTANT**: Use `--lan` mode (not `--tunnel`). Tunnel mode requires ngrok and often fails.

Wait for the QR code to appear, then scan it with Expo Go on your phone.

## Common Issues & Fixes

### "Network Error" on mobile app
- **Cause**: Phone can't reach the backend
- **Fix**: Make sure both phone and PC are on the same WiFi. Check that `EXPO_PUBLIC_API_BASE_URL` in `mobile-app/.env` has the correct IP.

### Backend won't start - PostgreSQL connection error
- **Fix Option 1**: Start PostgreSQL service
- **Fix Option 2**: Change `DATABASE_ENGINE=sqlite` in `multiple-ai-model-system/.env` to use SQLite instead

### "ALLOWED_HOSTS" error
- **Fix**: Add your current IP to `ALLOWED_HOSTS` in `multiple-ai-model-system/.env`

### Expo tunnel mode fails
- **Fix**: Use `--lan` mode instead: `npx expo start --lan`

### PowerShell shows red "NativeCommandError" when running Django
- **This is normal**. PowerShell treats Django's stderr output as errors. The server is working fine if you see `Watching for file changes with StatReloader`.

### "Missing authentication tokens" on login
- **Fix**: Make sure the backend is actually running and reachable at the URL in `.env`

## Quick Start (Copy-Paste)

### Terminal 1 - Backend:
```powershell
cd c:\Users\user\Desktop\multiple-ai-model-system-20260204T220529Z-1-001\multiple-ai-model-system
& ".venv\Scripts\python.exe" manage.py runserver 0.0.0.0:8000
```

### Terminal 2 - Mobile App:
```powershell
cd c:\Users\user\Desktop\multiple-ai-model-system-20260204T220529Z-1-001\mobile-app
npx expo start --lan
```
