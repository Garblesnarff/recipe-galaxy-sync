
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        recipe: {
          sage: "hsl(150, 15%, 50%)",
          "sage-light": "hsl(150, 15%, 95%)",
          green: "hsl(120, 61%, 50%)",        // Bright green like in screenshots
          "green-light": "hsl(120, 61%, 90%)", // Light green for backgrounds
          "green-dark": "hsl(120, 61%, 35%)",  // Darker green for hover states
        },
        // Feedback colors for high contrast themes
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        info: "hsl(var(--info))",
        // Chart colors
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "float-in": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "float-in": "float-in 0.4s ease-out",
      },
      borderRadius: {
        "xl": "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // High contrast utilities plugin
    plugin(function({ addUtilities, addVariant }) {
      // Add high contrast utility classes
      addUtilities({
        '.border-strong': {
          'border-width': '2px',
        },
        '.border-extra-strong': {
          'border-width': '3px',
        },
        '.shadow-strong': {
          'box-shadow': '0 4px 8px rgba(0, 0, 0, 0.3)',
        },
        '.focus-strong': {
          '&:focus-visible': {
            'outline-width': '3px',
            'outline-offset': '3px',
          },
        },
        '.text-emphasis': {
          'font-weight': '700',
        },
      });

      // Add high contrast variant
      addVariant('high-contrast', '[data-theme*="high-contrast"] &');
      addVariant('extra-high-contrast', '[data-theme*="high-contrast"] &, [data-theme="yellow-on-black"] &, [data-theme="white-on-black"] &');
    })
  ],
} satisfies Config;
