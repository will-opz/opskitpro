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
        accent: {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        surface: '#ffffff',
        base: '#fcfcfc',
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
