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
        vs: {
          bg:          "var(--vs-bg)",
          green:       "var(--vs-green)",
          greenLight:  "var(--vs-green-light)",
          greenPale:   "var(--vs-green-pale)",
          accent:      "var(--vs-accent)",
          accentLight: "var(--vs-accent-light)",
          text:        "var(--vs-text)",
          muted:       "var(--vs-muted)",
          border:      "var(--vs-border)",
          white:       "var(--vs-white)",
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
