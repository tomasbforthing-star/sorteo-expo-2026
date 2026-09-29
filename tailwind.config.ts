import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: "#11131A",
        "surface-card": "#161922",
        "surface-light": "#1E222D",
        primary: {
          DEFAULT: "#00E5FF",
          hover: "#00B4D8",
          dark: "#0077B6",
          glow: "rgba(0, 229, 255, 0.35)",
        },
        accent: {
          cyan: "#00F5D4",
          teal: "#06D6A0",
          amber: "#FFB703",
          crimson: "#FF0054",
        },
        border: "rgba(255, 255, 255, 0.08)",
        "border-glow": "rgba(0, 229, 255, 0.25)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-orbitron)", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slot-spin": "slotSpin 0.15s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 25px rgba(0, 229, 255, 0.4)",
          },
          "50%": {
            opacity: "0.6",
            boxShadow: "0 0 10px rgba(0, 229, 255, 0.15)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
