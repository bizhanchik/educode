/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#3B82F6',
        'primary-light': '#60A5FA',
        'primary-dark': '#2563EB',
        'secondary': '#22C55E',
        'secondary-light': '#4ADE80',
        'secondary-dark': '#16A34A',
        'accent-blue': '#3B82F6',
        'accent-green': '#22C55E',
        'light-bg': '#f4f8ff',
        'light-surface': '#ffffff',
        'light-border': '#e2e8f0',
        'light-text': '#4B5563',
        'dark-text': '#111827',
        'error': '#EF4444',
        'glass-white': 'rgba(255, 255, 255, 0.4)',
        'glass-black': 'rgba(0, 0, 0, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'input': '0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(59, 130, 246, 0.1)',
        'card': '0 10px 25px rgba(0, 0, 0, 0.03), 0 4px 10px rgba(0, 0, 0, 0.05)',
        'button': '0 4px 14px rgba(59, 130, 246, 0.25)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'navbar': '0 4px 10px rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      keyframes: {
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        pulse: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 0.8 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'gradient-shift': 'gradientShift 15s ease infinite',
        'pulse': 'pulse 10s infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(120deg, #edf9f5, #f4f8ff, #eaf3ff)',
        'primary-gradient': 'linear-gradient(to right, #22C55E, #3B82F6)',
        'button-gradient': 'linear-gradient(to right, #22C55E, #3B82F6)',
        'subtle-pattern': 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}
