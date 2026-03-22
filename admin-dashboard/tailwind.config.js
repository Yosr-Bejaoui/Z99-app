/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ChatGPT-inspired colors matching mobile app
        background: '#212121',
        surface: '#171717',
        card: '#2f2f2f',
        border: '#3f3f3f',
        primary: {
          DEFAULT: '#10a37f',
          hover: '#0d8a6a',
          light: 'rgba(16, 163, 127, 0.1)',
        },
        secondary: '#3b82f6', // blue
        accent: '#8b5cf6', // purple
        success: '#10b981', // green
        warning: '#f59e0b',
        error: '#ef4444',
        foreground: {
          DEFAULT: '#ececec',
          muted: '#8e8e8e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
