# AI Model Platform - Mobile App

A React Native mobile application for the AI Model Platform, inspired by modern dark-themed UI design.

## Tech Stack

- **React Native** with **Expo** framework
- **TypeScript** for type safety
- **React Navigation** for routing
- **Expo Linear Gradient** for gradient effects

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

```bash
cd mobile-app
npm install
```

### Running the App

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## Project Structure

```
mobile-app/
├── App.tsx                 # Main app entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── babel.config.js        # Babel config
├── assets/                # Static assets (icons, splash screens)
└── src/
    ├── components/        # Reusable UI components
    │   ├── GradientButton.tsx
    │   ├── GradientText.tsx
    │   └── GlassCard.tsx
    ├── screens/           # Screen components
    │   └── LandingScreen.tsx
    └── theme/             # Theme configuration
        └── colors.ts
```

## Design System

The app uses a dark theme with teal/cyan accent colors:

- **Background**: `#0f1115` (dark charcoal)
- **Primary**: `#2dd4bf` (teal)
- **Secondary**: `#0ea5e9` (cyan)
- **Foreground**: `#e8ebf0` (light gray)

## Features

### Landing Screen
- Animated hero section with gradient text
- Feature cards with glass morphism effect
- Smooth entrance animations
- Call-to-action buttons

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Private - All rights reserved
