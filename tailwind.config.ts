import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive", "sans-serif"],
      },
      colors: {
        paper: "#FAF8F5",
        ink: "#18181B",
        highlighter: "#FACC15",
        emeraldAccent: "#10B981",
        notebook: "#3B82F6",
        coral: "#F43F5E",
        mystic: "#8B5CF6",
      },
      boxShadow: {
        sketch: "4px 4px 0px 0px rgba(24, 24, 27, 1)",
        "sketch-sm": "2px 2px 0px 0px rgba(24, 24, 27, 1)",
        "sketch-lg": "6px 6px 0px 0px rgba(24, 24, 27, 1)",
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "pop-in": "pop-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
