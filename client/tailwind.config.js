/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        samurai: {
          red: '#E63946',
          'red-dark': '#C1121F',
          'red-darker': '#8B0000',
          steel: '#6B7280',
          'steel-light': '#9CA3AF',
          'steel-dark': '#4B5563',
          black: '#0A0A0A',
          'black-light': '#1A1A1A',
          'black-lighter': '#2A2A2A',
          grey: '#374151',
          'grey-dark': '#1F2937',
          'grey-darker': '#111827',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flame-flicker': 'flameFlicker 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        flameFlicker: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(230, 57, 70, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(230, 57, 70, 0.8)' },
        },
      }
    },
  },
  plugins: [],
}
