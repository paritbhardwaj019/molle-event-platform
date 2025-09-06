import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        "18": "4.5rem", // 72px - for bottom navigation height
      },
      fontFamily: {
        spaceGrotesk: ["var(--font-space-grotesk)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#b81ce3", // Outer - bright purple-pink
          foreground: "#FFFFFF",
          50: "#fdf2ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#b81ce3",
          600: "#cc18d9",
          700: "#e316cd",
          800: "#a21caf",
          900: "#86198f",
        },
        secondary: {
          DEFAULT: "#cc18d9", // Mid - medium purple-pink
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "#1e1e1e",
          foreground: "#B3B3B3",
        },
        accent: {
          DEFAULT: "#e316cd", // Inner - lighter purple-pink
          gold: "#FFD700", // Gold accent
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "#1e1e1e",
          foreground: "#FFFFFF",
        },
        theme: {
          outer: "#b81ce3", // Outer theme color
          mid: "#cc18d9", // Mid theme color
          inner: "#e316cd", // Inner theme color
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(184, 28, 227, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(184, 28, 227, 0.6)" },
        },
        "theme-gradient": {
          "0%": { backgroundColor: "#b81ce3" },
          "50%": { backgroundColor: "#cc18d9" },
          "100%": { backgroundColor: "#e316cd" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "theme-gradient": "theme-gradient 3s ease-in-out infinite",
      },
      backgroundImage: {
        "theme-gradient": "linear-gradient(135deg, #b81ce3, #cc18d9, #e316cd)",
        "theme-gradient-radial":
          "radial-gradient(circle, #b81ce3, #cc18d9, #e316cd)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
