/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          400: "#1E1E1E",
          500: "#121212",
        },
        primary: {
          300: '#F0E6D2',
          400: '#E2D0A8',
          500: '#C89B3C',
          600: '#D4AF37',
          700: '#B8860B',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
    },
  },
  plugins: [],
}
