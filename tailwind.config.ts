import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FFFDF9",
          100: "#FFF9F2", // Warm Ivory / Cream background
          200: "#FAF2E8",
          300: "#F4E9DB",
          400: "#EFE1D0",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          warm: "#FFF6ED",
          sand: "#F8F3EC",
          border: "#EFE6DC",
        },
        coral: {
          50: "#FEF3F2",
          100: "#FDE6E3",
          200: "#FBCDC7",
          300: "#F7A398",
          400: "#F27766",
          500: "#E85D4A", // Primary Coral / Tomato
          600: "#D44733",
          700: "#B23422",
          800: "#932D1F",
          900: "#7A2B1F",
        },
        mango: {
          50: "#FEF9EE",
          100: "#FDF2D5",
          200: "#FCE3A7",
          300: "#FACF72",
          400: "#F7BF4B",
          500: "#F4B942", // Secondary Mango / Golden Saffron
          600: "#DC9A22",
          700: "#B7771B",
          800: "#935D1C",
        },
        mint: {
          50: "#EFFBF7",
          100: "#D7F5EC",
          200: "#B3ECDC",
          300: "#80DEC5",
          400: "#4BC9A8",
          500: "#2FAF8F", // Fresh Herb Mint / Green Accent
          600: "#228F74",
          700: "#1C725E",
          800: "#195B4C",
        },
        charcoal: {
          950: "#161E1B",
          900: "#25312C", // Primary warm charcoal text
          800: "#33413B",
          700: "#45544E",
          600: "#68736D", // Muted warm sage-gray text
          500: "#828E88",
          400: "#A0ACA6",
          300: "#C3CDC8",
          200: "#E1E7E4",
          100: "#F0F4F2",
          50: "#F7FAF9",
        },
        // Backwards compatibility mappings mapped to warm palette
        obsidian: {
          950: "#161E1B",
          900: "#25312C",
          850: "#33413B",
          800: "#45544E",
          700: "#68736D",
          600: "#828E88",
          500: "#A0ACA6",
          400: "#C3CDC8",
          300: "#E1E7E4",
          200: "#EFE6DC",
          100: "#FAF2E8",
          50: "#FFF9F2",
        },
      },
      boxShadow: {
        "warm-xs": "0 1px 2px 0 rgba(37, 49, 44, 0.04)",
        "warm-sm": "0 1px 3px 0 rgba(37, 49, 44, 0.05), 0 1px 2px -1px rgba(37, 49, 44, 0.03)",
        "warm-card": "0 3px 12px -2px rgba(37, 49, 44, 0.05), 0 1px 4px -1px rgba(37, 49, 44, 0.03)",
        "warm-hover": "0 10px 28px -4px rgba(232, 93, 74, 0.09), 0 4px 10px -2px rgba(37, 49, 44, 0.04)",
        "warm-hero": "0 16px 40px -10px rgba(232, 93, 74, 0.12), 0 6px 16px -4px rgba(244, 185, 66, 0.08)",
        "coral-glow": "0 8px 25px -4px rgba(232, 93, 74, 0.28)",
        // Fallback shadows
        subtle: "0 1px 3px 0 rgba(37, 49, 44, 0.04)",
        card: "0 3px 12px -2px rgba(37, 49, 44, 0.05), 0 1px 4px -1px rgba(37, 49, 44, 0.03)",
        "card-hover": "0 10px 28px -4px rgba(232, 93, 74, 0.09)",
        hero: "0 16px 40px -10px rgba(232, 93, 74, 0.12)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Plus Jakarta Sans",
          "Outfit",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "fade-up": "fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-gentle": "pulseGentle 2.5s ease-in-out infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseGentle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
