import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f8fb",
          100: "#e9eef5",
          200: "#d3dce9",
          300: "#aebfd6",
          400: "#829bbd",
          500: "#617da5",
          600: "#4c6489",
          700: "#3f5170",
          800: "#37455e",
          900: "#141b27",
        },
        brand: {
          50: "#eef4ff",
          100: "#dfeaff",
          200: "#c5d8ff",
          300: "#9ebdff",
          400: "#6f97fb",
          500: "#4a6ef7",
          600: "#354ceb",
          700: "#2b3ad8",
          800: "#2732ae",
          900: "#1d2360",
        },
        mint: "#34d399",
        coral: "#fb7185",
        amber: "#fbbf24",
      },
    },
  },
  plugins: [],
};

export default config;
