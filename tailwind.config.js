/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#040508",
        panel: "#0b0d12",
        line: "#1a1f2a",
        neon: "#75f7c3",
        blue: "#8bd2ff",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(117, 247, 195, 0.12), 0 20px 60px rgba(7, 14, 24, 0.55)",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
