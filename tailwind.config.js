/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      },
      fontSize: {
        'xs-custom': ['0.625rem', { lineHeight: '0.875rem' }],
        'sm-custom': ['0.688rem', { lineHeight: '1rem' }],
      },
      animation: {
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#881337",
          secondary: "#D94E67",
          accent: "#B08968",
          neutral: "#6B7280",
          "base-100": "#FFFDFD",
          "base-200": "#F9F5F6",
          "base-300": "#F3E8EE",
          info: "#64748B",
          success: "#10B981",
          warning: "#C59B6D",
          error: "#BE123C",
        },
        dark: {
          primary: "#D94E67",
          secondary: "#F472B6",
          accent: "#C59B6D",
          neutral: "#9CA3AF",
          "base-100": "#111827",
          "base-200": "#1F2937",
          "base-300": "#374151",
          info: "#94A3B8",
          success: "#34D399",
          warning: "#D4A373",
          error: "#FB7185",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}
