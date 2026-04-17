import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        primary: {
          DEFAULT: "var(--primary)",
          fg: "var(--primary-fg)",
          soft: "var(--primary-soft-bg)",
          "soft-fg": "var(--primary-soft-fg)",
        },
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
        },
        success: "var(--success)",
        border: "var(--border)",
        chip: {
          bg: "var(--chip-bg)",
          fg: "var(--chip-fg)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        label: ["11px", { lineHeight: "1.3", letterSpacing: "0.06em" }],
        "label-lg": ["12px", { lineHeight: "1.3", letterSpacing: "0.06em" }],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.03)",
        "card-hover":
          "0 4px 12px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
        "tab-bar": "0 -1px 0 rgba(15,23,42,0.06)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "180ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "bar-grow": {
          from: { width: "0%" },
          to: { width: "var(--bar-width)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "slide-up": "slide-up 200ms ease-out",
        "bar-grow": "bar-grow 400ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
