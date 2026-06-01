import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        appSurface: '#ffffff',
        appCanvas: '#f7f8f8',
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
