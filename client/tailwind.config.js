/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    fontFamily: {
      'serif': ['"Times New Roman"', 'Times', 'serif'],
    },
    extend: {
      backgroundImage: {
        'soft-gradient': 'linear-gradient(90deg,var(--primary), rgba(59,130,246,0.6))',
      },
      colors: {
        primary: {
          light: '#3b82f6',
          dark: '#60a5fa',
        },
        tag: {
          light: '#eab308',
          dark: '#facc15',
        },
        background: {
          light: '#ffffff',
          dark: '#1a1b1e',
        },
        card: {
          light: '#ffffff',
          dark: '#25262b',
        },
        surface: {
          light: '#f8fafc',
          dark: '#2c2e33',
        },
        border: {
          light: '#e2e8f0',
          dark: '#2d2d2d',
        },
        text: {
          primary: {
            light: '#1e293b',
            dark: '#e5e7eb',
          },
          secondary: {
            light: '#64748b',
            dark: '#9ca3af',
          },
        }
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          lg: '2rem',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        'card-dark': '0 2px 8px 0 rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [
    typography()
  ],
}
