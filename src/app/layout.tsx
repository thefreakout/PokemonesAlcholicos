import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegistrarPWA } from "@/componentes/RegistrarPWA";

/**
 * Layout raíz de la aplicación.
 * Configura el título, el manifest de la PWA y los iconos.
 */

export const metadata: Metadata = {
  title: "PokéCubata Hoenn",
  description:
    "Juego de beber con cartas Pokémon de Hoenn. Partidas 1 contra 1 en tiempo real desde tu móvil.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PokéCubata",
  },
  icons: {
    icon: "/iconos/icono-192.png",
    apple: "/iconos/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E3350D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">
        {children}
        <RegistrarPWA />
      </body>
    </html>
  );
}
