/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FBF7F0",
          100: "#F5EDDF",
          200: "#EADDC6",
        },
        coffee: {
          500: "#8B5E3C",
          600: "#6F4A2F",
          700: "#5A3B26",
          900: "#2E1D12",
        },
        point: {
          DEFAULT: "#2F5D50",
          light: "#E3EDE8",
          dark: "#23473D",
        },
        terracotta: "#C96F4A",
      },
      fontFamily: {
        serif: ['Georgia', '"Noto Serif KR"', "serif"],
        sans: ['"Pretendard"', "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px -6px rgba(46, 29, 18, 0.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
