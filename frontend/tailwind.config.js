/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#FFF8F5',
          card: '#FFFFFF',
          muted: '#F8F3F0',
        },
        foreground: {
          DEFAULT: '#0A0A0A',
          muted: '#555555',
          subtle: '#888888',
        },
        border: {
          DEFAULT: '#E8E4E1',
          light: '#F0ECE8',
        },
        brand: {
          purple: '#7C3AED',
          pink: '#EC4899',
          orange: '#F97316',
          gradientStart: '#7C3AED',
          gradientMid: '#EC4899',
          gradientEnd: '#F97316',
        },
        sentiment: {
          positive: '#16A34A',
          neutral: '#D97706',
          negative: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 20px 40px -15px rgba(124, 58, 237, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
        'floating': '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(232, 228, 225, 0.8)',
        'glow-purple': '0 0 40px -10px rgba(124, 58, 237, 0.3)',
        'glow-pink': '0 0 40px -10px rgba(236, 72, 153, 0.3)',
        'glow-orange': '0 0 40px -10px rgba(249, 115, 22, 0.3)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
