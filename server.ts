/**
 * Servidor principal: Next.js (interfaz) + Socket.IO (tiempo real)
 * sobre el mismo puerto. Es un servidor Node.js personalizado porque
 * Socket.IO necesita WebSockets de larga duración.
 *
 * Arranque en desarrollo:  npm run dev
 * Arranque en producción:  npm run build && npm start
 */

import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { registrarComunicacion } from "./src/servidor/comunicacion";
import type { EventosCliente, EventosServidor } from "./src/motor/tipos";

const PUERTO = Number(process.env.PUERTO ?? process.env.PORT ?? 3000);
const enDesarrollo = process.env.NODE_ENV !== "production";

async function main(): Promise<void> {
  const app = next({ dev: enDesarrollo });
  const manejar = app.getRequestHandler();

  await app.prepare();

  const servidorHttp = createServer((req, res) => {
    manejar(req, res);
  });

  const io = new Server<EventosCliente, EventosServidor>(servidorHttp, {
    // Sin CORS amplio a propósito: el cliente siempre entra por el mismo origen
    // (la página la sirve este propio servidor), así que ningún otro sitio web
    // puede abrir sockets contra la sala desde el navegador de un jugador.
  });

  registrarComunicacion(io);

  servidorHttp.listen(PUERTO, () => {
    console.log(`🍺 PokéCubata Hoenn escuchando en http://localhost:${PUERTO}`);
    if (enDesarrollo) {
      console.log("   (modo desarrollo; para producción usa npm run build && npm start)");
    }
  });
}

main().catch((error) => {
  console.error("No se pudo arrancar el servidor:", error);
  process.exit(1);
});
