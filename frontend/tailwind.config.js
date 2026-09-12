/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#080a0f",
          card: "#0f131d",
          cardHover: "#161b28",
          border: "#1e2638",
          borderLight: "#2d3748",
          text: "#f1f5f9",
          muted: "#94a3b8",
          subtle: "#64748b",
          crimson: "#ef4444",
          crimsonBg: "rgba(239, 68, 68, 0.12)",
          amber: "#f59e0b",
          amberBg: "rgba(245, 158, 11, 0.12)",
          cyan: "#06b6d4",
          cyanBg: "rgba(6, 182, 212, 0.12)",
          purple: "#a855f7",
          purpleBg: "rgba(168, 85, 247, 0.12)",
          emerald: "#10b981",
          emeraldBg: "rgba(16, 185, 129, 0.12)",
          blue: "#3b82f6",
          blueBg: "rgba(59, 130, 246, 0.12)",
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
