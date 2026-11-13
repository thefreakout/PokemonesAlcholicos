import type { Config } from "tailwindcss";

/**
 * Configuración de Tailwind CSS.
 * Paleta viva estilo Pokémon pensada para móvil vertical.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colores principales del juego
        poke: {
          rojo: "#E3350D",
          rojoOscuro: "#B22308",
          amarillo: "#FFCB05",
          azul: "#2A75BB",
          azulOscuro: "#1B4F8A",
          noche: "#0F172A",
          nocheClara: "#1E293B",
        },
      },
      fontFamily: {
        juego: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        // Animaciones sencillas: dado, golpe y relleno del vaso
        "dado-gira": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(360deg) scale(1.2)" },
          "100%": { transform: "rotate(720deg) scale(1)" },
        },
        golpe: {
          "0%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-10px)" },
          "40%": { transform: "translateX(10px)" },
          "60%": { transform: "translateX(-6px)" },
          "80%": { transform: "translateX(6px)" },
          "100%": { transform: "translateX(0)" },
        },
        "relleno-vaso": {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        },
        latido: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        aparece: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        brilla: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 203, 5, 0.0)" },
          "50%": { boxShadow: "0 0 24px 6px rgba(255, 203, 5, 0.55)" },
        },
      },
      animation: {
        "dado-gira": "dado-gira 0.9s ease-in-out",
        golpe: "golpe 0.55s ease-in-out",
        "relleno-vaso": "relleno-vaso 0.8s ease-out",
        latido: "latido 1.2s ease-in-out infinite",
        aparece: "aparece 0.25s ease-out",
        brilla: "brilla 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
