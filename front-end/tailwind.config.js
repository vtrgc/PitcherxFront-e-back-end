
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {

        brand: {
          50: "#F6F2FF",
          100: "#EBE0FF",
          200: "#D8C6FF",
          300: "#BEA0FF",
          400: "#9D6FFF",
          500: "#7C3CF5",
          600: "#6B21E0",
          700: "#5613BE",
          800: "#3F0F8C",
          900: "#241056",
        },


        ink: {
          25: "#FBFAFE",
          50: "#F7F4FD",
          100: "#EFEAFA",
          200: "#DED4F0",
          300: "#C3B4DD",
          400: "#8F7FAE",
          500: "#6B5C8A",
          600: "#4F4270",
          700: "#362C52",
          800: "#241C3B",
          900: "#150F28",
        },


        accent: {
          50: "#FFF0F7",
          100: "#FFDCEC",
          200: "#FFB3D9",
          300: "#FF80BE",
          400: "#FF4FA0",
          500: "#F5127D",
          600: "#D2066A",
          700: "#A30454",
        },


        void: {
          DEFAULT: "#170B2E",
          soft: "#211141",
          deep: "#0B0518",
        },

        // Nova página inicial: azul-marinho, cinza-claro e dourado discreto
        navy: {
          950: "#0B0F2A",
          900: "#10153A",
          800: "#1A2050",
          700: "#262D6B",
        },
        paper: "#F4F5FA",
        spark: "#F4C95D",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #9D6FFF 0%, #7C3CF5 45%, #5613BE 100%)",
        "brand-gradient-radial": "radial-gradient(circle at 30% 20%, #BEA0FF 0%, #7C3CF5 55%, #3F0F8C 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #F6F2FF 0%, #EBE0FF 100%)",
        "flare-gradient": "linear-gradient(135deg, #FF80BE 0%, #F5127D 100%)",
        "stage-gradient": "linear-gradient(180deg, #F6F2FF 0%, #EFEAFA 55%, #F7F4FD 100%)",
        "aurora": "radial-gradient(60% 60% at 20% 10%, rgba(157,111,255,0.55) 0%, rgba(157,111,255,0) 60%), radial-gradient(50% 50% at 85% 30%, rgba(245,18,125,0.35) 0%, rgba(245,18,125,0) 60%), radial-gradient(70% 70% at 50% 100%, rgba(86,19,190,0.45) 0%, rgba(86,19,190,0) 60%)",
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "sans-serif"],
        hero: ["Archivo Variable", "Archivo", "Arial Narrow", "ui-sans-serif", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(21, 15, 40, 0.04)",
        soft: "0 1px 2px rgba(21, 15, 40, 0.05)",
        card: "0 2px 10px -4px rgba(21, 15, 40, 0.08)",
        popover: "0 12px 32px -8px rgba(21, 15, 40, 0.22)",
        glow: "0 3px 10px -3px rgba(124, 60, 245, 0.28)",
        "glow-lg": "0 6px 18px -6px rgba(124, 60, 245, 0.32)",
        "glow-flare": "0 3px 10px -3px rgba(245, 18, 125, 0.28)",
        stage: "0 0 0 1px rgba(157,111,255,0.06), 8px 0 28px -18px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.75rem",
        "5xl": "2.25rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-450px 0" },
          "100%": { backgroundPosition: "450px 0" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.05)" },
        },
        "skeleton-sweep": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "pop-in": "pop-in 0.18s ease-out",
        drift: "drift 12s ease-in-out infinite",
        "skeleton-sweep": "skeleton-sweep 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
