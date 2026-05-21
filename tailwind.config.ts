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
        usal: {
          red: "#C8102E",
          "red-dark": "#A00D24",
        },
        iuce: {
          blue: "#3B7DD8",
          "blue-dark": "#1B3A5C",
          "blue-pale": "#EFF4FB",
        },
        brand: {
          50: "#F2F7FE",
          100: "#E3EEFB",
          400: "#7DAFEA",
          500: "#3B7DD8",
          700: "#1B3A5C",
          800: "#142E4A",
        },
        success: {
          50: "#ECFDF3",
          500: "#12B76A",
          700: "#027A48",
        },
        warning: {
          50: "#FFFAEB",
          500: "#F79009",
          700: "#B54708",
        },
        danger: {
          50: "#FEF3F2",
          500: "#D92D20",
          700: "#B42318",
        },
      },
    },
  },
  plugins: [],
};

export default config;
