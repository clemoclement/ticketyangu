// Tokens from the Figma kit. Change here, not in components.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#5B3FE0", dark: "#4A31C4", soft: "#EDE9FE" },
        success: { DEFAULT: "#16A34A", soft: "#E8F7EE" },
        warning: { DEFAULT: "#B45309", soft: "#FEF3C7" },
        danger: { DEFAULT: "#DC2626", soft: "#FEE2E2" },
        ink: "#111827", muted: "#4B5563", line: "#E5E7EB",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      fontSize: { xs: ["12px", "16px"], sm: ["14px", "20px"], base: ["16px", "24px"], xl: ["20px", "28px"], "3xl": ["28px", "36px"], "5xl": ["40px", "44px"] },
      borderRadius: { md: "8px", xl: "12px" },
    },
  },
  plugins: [],
};
