/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        audit: {
          bg: '#090D16',
          panel: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          hover: '#1E293B',
          text: '#F8FAFC',
          muted: '#94A3B8',
          verified: '#10B981',
          'verified-bg': 'rgba(16, 185, 129, 0.12)',
          warning: '#F59E0B',
          'warning-bg': 'rgba(245, 158, 11, 0.12)',
          accent: '#3B82F6',
          'accent-bg': 'rgba(59, 130, 246, 0.12)',
          highlight: '#FACC15',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
