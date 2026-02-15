/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#111118',
        card: '#16161d',
        border: '#2a2a35',
        primary: {
          DEFAULT: '#2dd4bf',
          hover: '#14b8a6',
          light: 'rgba(45, 212, 191, 0.1)',
        },
        secondary: '#8b5cf6',
        accent: '#f97316',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        foreground: {
          DEFAULT: '#ffffff',
          muted: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
