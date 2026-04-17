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
        vs: {
          bg:         "#F7F5F0",
          green:      "#2D6A4F",
          greenLight: "#52B788",
          greenPale:  "#D8F3DC",
          accent:     "#F4A261",
          accentLight:"#FFE8D6",
          text:       "#1B2B1E",
          muted:      "#6B7C6E",
          border:     "#E0EBE3",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body:    ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
