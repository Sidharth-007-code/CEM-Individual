import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== NEW: Modern design system colors (light mode) =====
        modern: {
          // Brand
          primary: "#172554",        // Navy — primary actions, headings
          "primary-hover": "#1e3a8a",
          "primary-light": "#dbeafe",
          accent: "#2563EB",         // Blue — secondary actions, links
          "accent-hover": "#1d4ed8",
          "accent-light": "#eff6ff",
          warm: "#F59E0B",           // Amber — highlights, CTAs, badges
          "warm-hover": "#d97706",
          "warm-light": "#fffbeb",
          "warm-text": "#172554",    // Navy text on amber for contrast

          // Surfaces
          bg: "#F8FAFC",             // Page background
          surface: "#FFFFFF",        // Cards, modals, inputs
          "surface-hover": "#f1f5f9",

          // Borders & Dividers
          border: "#e2e8f0",         // Default borders
          "border-strong": "#cbd5e1",

          // Text
          "text-primary": "#0f172a",   // Slate 950
          "text-secondary": "#334155", // Slate 700
          "text-tertiary": "#64748b",  // Slate 500
          "text-inverse": "#ffffff",

          // Semantic
          success: "#059669",        // Emerald 600
          "success-light": "#ecfdf5",
          warning: "#d97706",        // Amber 600
          "warning-light": "#fffbeb",
          error: "#dc2626",          // Red 600
          "error-light": "#fef2f2",
          info: "#2563eb",           // Blue 600
          "info-light": "#eff6ff",

          // Role accents (kept for verifier/admin)
          verifier: "#059669",
          admin: "#dc2626",
        },

        // ===== EXISTING: Neo-brutalist colors (preserved for backward compat) =====
        brutal: {
          bg: "#FDFBF7",
          dark: "#09090B",
          black: "#000000",
          yellow: {
            DEFAULT: "#FFD027",
            light: "#FFE366",
            dark: "#E5B810",
          },
          purple: {
            DEFAULT: "#8B5CF6",
            light: "#DDD6FE",
            dark: "#7C3AED",
          },
          green: {
            DEFAULT: "#86EFAC",
            light: "#DCFCE7",
            dark: "#22C55E",
          },
          pink: {
            DEFAULT: "#FDA4AF",
            light: "#FFE4E6",
            dark: "#FB7185",
          },
          blue: {
            DEFAULT: "#38BDF8",
            light: "#E0F2FE",
            dark: "#0284C7",
          },
        },
        paper: {
          50: "#FCFBF7",
          100: "#F7F5EE",
          200: "#EFECE1",
          300: "#E3DFC8",
          400: "#CDC7A7",
          800: "#3D3929",
          900: "#222017",
        },
        ink: {
          950: "#09121F",
          900: "#0F1E36",
          800: "#1A2E4E",
          700: "#2B436D",
          600: "#445E8D",
          500: "#6981AD",
          300: "#AEC0DC",
          100: "#E3EBF8",
        },
        saffron: {
          50: "#FFF8EB",
          100: "#FEEBC8",
          200: "#FDD694",
          300: "#FBBF5B",
          400: "#F8A123",
          500: "#E57C04",
          600: "#C65C00",
          700: "#984002",
        },
        verifier: {
          50: "#F0F7F4",
          100: "#DCEDE4",
          600: "#1E654C",
          700: "#154A37",
          900: "#0B271D",
        },
        admin: {
          50: "#FCF2F2",
          100: "#F8DFDF",
          600: "#9E2A2B",
          700: "#7A1C1D",
          900: "#450C0C",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 30, 54, 0.06), 0 1px 2px rgba(15, 30, 54, 0.04)",
        "card-hover": "0 8px 24px -4px rgba(15, 30, 54, 0.12), 0 2px 6px -1px rgba(15, 30, 54, 0.06)",
        float: "0 14px 34px -6px rgba(15, 30, 54, 0.18)",
        // Neo-Brutalist 3D hard offset drop shadows (preserved for backward compat)
        "brutal-sm": "2px 2px 0px 0px #000000",
        brutal: "4px 4px 0px 0px #000000",
        "brutal-lg": "6px 6px 0px 0px #000000",
        "brutal-xl": "8px 8px 0px 0px #000000",
        // Modern layered shadows
        "modern-xs": "0 1px 2px rgba(15,23,42,0.05)",
        "modern-sm": "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
        "modern-md": "0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)",
        "modern-lg": "0 12px 24px rgba(15,23,42,0.1), 0 4px 8px rgba(15,23,42,0.05)",
        "modern-focus": "0 0 0 3px rgba(37,99,235,0.3)",
      },
      borderRadius: {
        notice: "6px",
        "brutal-sm": "10px",
        brutal: "16px",
        "brutal-lg": "24px",
        "brutal-xl": "32px",
        // Modern radius scale
        "modern-xs": "4px",
        "modern-sm": "6px",
        "modern-md": "8px",
        "modern-lg": "12px",
        "modern-xl": "16px",
        "modern-2xl": "24px",
        "modern-full": "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
