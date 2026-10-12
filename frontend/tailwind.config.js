export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f8f9ff", "surface-dim": "#cbdbf5", "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff", "surface-container": "#e5eeff", "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe", "on-surface": "#0b1c30", "on-surface-variant": "#434655",
        "inverse-surface": "#213145", "inverse-on-surface": "#eaf1ff", outline: "#747686", "outline-variant": "#c4c5d7",
        primary: "#0037b0", "primary-container": "#1d4ed8", "on-primary": "#ffffff", tertiary: "#004e47",
        "tertiary-fixed": "#89f5e7", error: "#ba1a1a", navy: "#0F172A", line: "#E2E8F0",
      },
      borderRadius: { DEFAULT: "0.125rem", lg: "0.25rem", xl: "0.5rem", full: "0.75rem" },
      fontFamily: {
        head: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
