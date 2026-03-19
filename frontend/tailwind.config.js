/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        casino: {
          bg: '#0a0a0f',
          surface: '#12121a',
          card: '#1a1a26',
          border: '#2a2a3e',
          gold: '#f5c842',
          'gold-dark': '#c9a227',
          green: '#00c853',
          red: '#ff1744',
          purple: '#7c3aed',
          'purple-light': '#a855f7',
          text: '#e2e8f0',
          muted: '#64748b',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'reel-spin': 'reelSpin 0.3s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'win-flash': 'winFlash 0.5s ease-in-out 3',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 200, 66, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(245, 200, 66, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        winFlash: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(245, 200, 66, 0.2)' },
        },
      },
      backgroundImage: {
        'casino-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0d0d18 100%)',
        'gold-gradient': 'linear-gradient(135deg, #f5c842 0%, #c9a227 100%)',
        'card-gradient': 'linear-gradient(145deg, #1a1a26 0%, #12121a 100%)',
      },
    },
  },
  plugins: [],
}
