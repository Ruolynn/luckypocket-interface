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
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#2196f3',
          600: '#1976d2',
          700: '#1565c0',
        },
        success: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          500: '#4caf50',
          600: '#43a047',
        },
        warning: {
          500: '#ff9800',
        },
      },
    },
  },
  plugins: [],
}
