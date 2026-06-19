import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Geist"', '"Inter"', "system-ui", "sans-serif"],
        sans:    ['"Inter"', "system-ui", "sans-serif"],
        mono:    ['"Geist Mono"', '"JetBrains Mono"', "monospace"],
      },
      colors: {
        bg:      { primary: "var(--bg-primary)", secondary: "var(--bg-secondary)", card: "var(--bg-card)", light: "var(--bg-secondary)" },
        text:    { primary: "var(--text-primary)", secondary: "var(--text-secondary)", dark: "var(--text-primary)" },
        accent:  { DEFAULT: "#D4AF37", hover: "#FBBF24", light: "#B8860B" },
        border:  { DEFAULT: "var(--border)", light: "var(--border)" },
      },

      borderRadius: {
        card: "24px",
        btn:  "8px",
        full: "9999px",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.08)",
        elevated: "0 12px 48px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        default: "250ms",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}

export default config
