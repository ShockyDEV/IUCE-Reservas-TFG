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
        },
        iuce: {
          blue: "#3B7DD8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
