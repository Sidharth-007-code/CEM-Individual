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
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 30, 54, 0.06), 0 1px 2px rgba(15, 30, 54, 0.04)",
        "card-hover": "0 8px 24px -4px rgba(15, 30, 54, 0.12), 0 2px 6px -1px rgba(15, 30, 54, 0.06)",
        float: "0 14px 34px -6px rgba(15, 30, 54, 0.18)",
      },
      borderRadius: {
        notice: "6px",
      },
    },
  },
  plugins: [],
};

export default config;

