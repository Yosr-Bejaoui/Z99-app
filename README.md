# Multi-Model AI Platform (Z99)

A comprehensive mobile application and backend platform that integrates multiple leading AI providers (OpenAI, DeepSeek, Leonardo, and more) into a single unified experience. Users can interact with various models to generate text, create stunning images, edit media, and manage their subscription plans.

## 🚀 Features

- **Multi-Model Chat**: Seamlessly switch between different LLMs for text generation and assistance.
- **AI Image Generation & Editing**: Advanced image capabilities including text-to-image, upscaling, and 3D conversions.
- **User Authentication**: Secure login, registration, and OTP activation system.
- **Subscription Management**: Integrated Stripe billing for various tier plans.
- **Modern Mobile UI**: Built with React Native & Expo for a smooth, native-feeling iOS and Android experience.

## 🛠 Tech Stack

- **Mobile Frontend**: React Native, Expo, React Navigation, Axios, Reanimated.
- **Backend API**: Python, Django, Django REST Framework, Daphne (ASGI).
- **Database**: SQLite (Development) / PostgreSQL (Production).
- **Background Tasks**: Celery & Redis.

## ⚙️ Local Development Setup

### 1. Backend Setup (Django)

Navigate to the backend directory:
```bash
cd multiple-ai-model-system
```

Create and activate a virtual environment (Windows):
```bash
python -m venv .venv
.\.venv\Scripts\activate
```

Install dependencies and run migrations:
```bash
pip install -r requirements.txt
python manage.py migrate
```

Start the backend server on port 8082:
```bash
python run.py
```

### 2. Mobile App Setup (React Native / Expo)

Open a new terminal and navigate to the mobile app directory:
```bash
cd mobile-app
```

Install dependencies:
```bash
npm install
```

Configure your local IP address for the API:
1. Open `mobile-app/.env`
2. Update the `EXPO_PUBLIC_API_BASE_URL` to match your computer's local IP address (e.g. `192.168.1.x:8082/api/v1`).
3. Note: If you test on an Android emulator on the same machine, you can use `10.0.2.2:8082`.

Start the Expo bundler:
```bash
npx expo start -c
```
*Note: The `-c` flag is important to clear the cache if you just changed your `.env` IP address!*

## 🔑 Default Accounts (Development)
You can use the following default Admin account in the local database:
- **Email:** `admin@admin.com`
- **Password:** `admin123`
