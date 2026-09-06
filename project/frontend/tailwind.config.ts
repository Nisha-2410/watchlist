import type { Config } from "tailwindcss";
import { borderRadius, boxShadow, colors, fontFamily, fontSize, spacing } from "./src/theme";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors,
      borderRadius,
      spacing,
      fontFamily,
      fontSize,
      boxShadow,
    },
  },
  plugins: [],
} satisfies Config;
