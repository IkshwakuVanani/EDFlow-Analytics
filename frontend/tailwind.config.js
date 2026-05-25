/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        mist: "#f6f8fb",
        teal: "#0f766e",
        "teal-deep": "#134e4a",
        amber: "#b7791f",
        risk: "#b42318"
      },
      boxShadow: {
        soft: "0 14px 35px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
