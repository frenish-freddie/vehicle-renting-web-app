import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          dark: "#0F1923",     // Navbar, footer, heavy vehicle cards
          DEFAULT: "#0F1923",
        },
        accent: {
          amber: "#F59E0B",    // CTAs, highlights
          green: "#10B981",    // Available status, EV badge
          red: "#EF4444",      // Unavailable, cancel
          blue: "#3B82F6",     // Info, AI chatbot
        },
        surface: {
          DEFAULT: "#F8F9FC",  // Page background
          card: "#FFFFFF",
        },
        text: {
          primary: "#0F1923",
          muted: "#6B7280",
        },
        border: {
          DEFAULT: "#E5E7EB",
        },
        driver: {
          gold: "#D97706",     // Driver Service premium badge
        },
        category: {
          two_wheeler: "#8B5CF6", // violet
          cars: "#3B82F6",        // blue
          commercial: "#F59E0B",  // amber
          machinery: "#EF4444",   // red/industrial
          special: "#10B981",     // green
        },
        brand: {
          green: "var(--brand-green)",
          bg: "var(--brand-bg)",
          card: "var(--brand-card)",
          text: "var(--brand-text)",
          muted: "var(--brand-muted)",
          accent: "var(--brand-accent)",
          border: "var(--brand-border)",
        }
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        display: ["var(--font-barlow-condensed)", "Barlow Condensed", "system-ui", "sans-serif"],
        numbers: ["var(--font-oswald)", "Oswald", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
        input: "6px",
        badge: "4px",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.08)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      animation: {
        "scroll-line": "scrollLine 2s ease-in-out infinite",
        "fade-in": "fadeIn 1s ease-out forwards",
        "pulse-ring": "pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "marquee": "marquee 30s linear infinite",
      },
      keyframes: {
        scrollLine: {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "50%": { transform: "scaleY(1)", transformOrigin: "top" },
          "50.01%": { transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.5" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        }
      },
    },
  },
  plugins: [],
};
export default config;
