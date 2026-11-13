/**
 * Capa de comunicación del servidor: recibe las acciones de los clientes
 * por Socket.IO, las aplica a través del motor y difunde el estado nuevo
 * a los dos móviles en tiempo real.
 */

import type { Server, Socket } from "socket.io";
import type { EventosCliente, EventosServidor } from "../motor/tipos";
import { VALORES } from "../config/valores";
import {
  almacenEnMemoria,
  generarCodigoLibre,
  limpiarSalasAntiguas,
} from "./salas";
import { ErrorDeJuego, type Sala } from "./tipos-internos";
import * as juego from "../motor/juego";
import { vistaPara } from "../motor/vista";

/** Vínculo entre un socket conectado y su jugador. */
interface EnlaceSocket {
  codigo: string;
  jugadorId: string;
}

/** Enlaces activos por socket.id */
const enlaces = new Map<string, EnlaceSocket>();

/** Envía a cada jugador conectado su vista personalizada del estado. */
function difundirEstado(io: Server<EventosCliente, EventosServidor>, sala: Sala): void {
  for (const jugador of sala.jugadores) {
    if (jugador.socketId) {
      io.to(jugador.socketId).emit("estado", vistaPara(sala, jugador.id));
    }
  }
}

/** Envía un error solo al socket que ha hecho la petición. */
function responderError(
  socket: Socket<EventosCliente, EventosServidor>,
  error: unknown
): void {
  if (error instanceof ErrorDeJuego) {
    socket.emit("sala:error", { mensaje: error.message, codigo: error.codigo });
  } else {
    console.error("Error inesperado en el servidor:", error);
    socket.emit("sala:error", { mensaje: "Algo ha ido mal. Inténtalo de nuevo." });
  }
}

/** Registra todos los manejadores de eventos en el servidor Socket.IO. */
export function registrarComunicacion(io: Server<EventosCliente, EventosServidor>): void {
  io.on("connection", (socket) => {
    // ── Crear sala ──────────────────────────────────────────────────────
    socket.on("sala:crear", ({ apodo, color }) => {
      try {
        const codigo = generarCodigoLibre();
        const jugador = juego.crearJugador(apodo, color, socket.id);
        const sala = juego.crearSala(codigo, jugador);
        almacenEnMemoria.guardar(sala);
        enlaces.set(socket.id, { codigo, jugadorId: jugador.id });
        socket.join(`sala:${codigo}`);
        socket.emit("estado", vistaPara(sala, jugador.id));
      } catch (error) {
        responderError(socket, error);
      }
    });

    // ── Unirse con código ───────────────────────────────────────────────
    socket.on("sala:unir", ({ codigo, apodo, color }) => {
      try {
        const codigoLimpio = (codigo ?? "").trim().toUpperCase();
        const sala = almacenEnMemoria.obtener(codigoLimpio);
        if (!sala) {
          throw new ErrorDeJuego("No existe ninguna sala con ese código.", "sala-no-encontrada");
        }
        const jugador = juego.crearJugador(apodo, color, socket.id);
        juego.unirJugador(sala, jugador);
        almacenEnMemoria.guardar(sala);
        enlaces.set(socket.id, { codigo: sala.codigo, jugadorId: jugador.id });
        socket.join(`sala:${sala.codigo}`);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    // ── Reconexión automática tras perder la red unos segundos ─────────
    // Exige el token secreto del jugador: sin él nadie puede suplantar su asiento.
    socket.on("sala:reconectar", ({ codigo, jugadorId, token }) => {
      try {
        const sala = almacenEnMemoria.obtener((codigo ?? "").trim().toUpperCase());
        if (!sala) {
          throw new ErrorDeJuego("La sala ya no existe. Crea una nueva.", "sala-no-encontrada");
        }
        // Localiza un enlace anterior del mismo jugador para expulsar su socket viejo.
        let socketViejo: string | null = null;
        for (const [idSocket, enlace] of enlaces) {
          if (enlace.codigo === sala.codigo && enlace.jugadorId === jugadorId) {
            socketViejo = idSocket;
            break;
          }
        }
        const jugador = juego.reconectarJugador(sala, jugadorId, token, socket.id);
        enlaces.set(socket.id, { codigo: sala.codigo, jugadorId: jugador.id });
        // La pestaña antigua pierde su sesión y se desconecta: un asiento, un dispositivo.
        if (socketViejo && socketViejo !== socket.id) {
          enlaces.delete(socketViejo);
          io.in(socketViejo).disconnectSockets(true);
        }
        socket.join(`sala:${sala.codigo}`);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    // ── Acciones del juego ──────────────────────────────────────────────
    socket.on("sala:seleccionarEquipo", ({ pokemonIds }) => {
      try {
        const enlace = enlaces.get(socket.id);
        if (!enlace) throw new ErrorDeJuego("No estás en ninguna sala.", "sin-sesion");
        const sala = almacenEnMemoria.obtener(enlace.codigo);
        if (!sala) throw new ErrorDeJuego("La sala ya no existe.", "sala-no-encontrada");
        juego.seleccionarEquipo(sala, enlace.jugadorId, pokemonIds);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("sala:listo", ({ listo }) => {
      try {
        const enlace = enlaces.get(socket.id);
        if (!enlace) throw new ErrorDeJuego("No estás en ninguna sala.", "sin-sesion");
        const sala = almacenEnMemoria.obtener(enlace.codigo);
        if (!sala) throw new ErrorDeJuego("La sala ya no existe.", "sala-no-encontrada");
        juego.marcarListo(sala, enlace.jugadorId, listo);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:atacar", ({ cartaId }) => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.atacar(sala, enlaceDe(socket).jugadorId, cartaId);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });


    socket.on("juego:robar", ({ mazo }) => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.robarDeMazo(sala, enlaceDe(socket).jugadorId, mazo);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:jugarCarta", ({ cartaId, objetivoId }) => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.jugarCarta(sala, enlaceDe(socket).jugadorId, cartaId, objetivoId);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:responderPocion", () => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.responderPocion(sala, enlaceDe(socket).jugadorId);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:resolverReto", ({ cumplido }) => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.resolverReto(sala, enlaceDe(socket).jugadorId, cumplido);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:confirmarBebida", ({ modo }) => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.confirmarBebida(sala, enlaceDe(socket).jugadorId, modo);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:cambiarActivo", ({ indice }) => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.cambiarActivo(sala, enlaceDe(socket).jugadorId, indice);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:terminarTurno", () => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.terminarTurno(sala, enlaceDe(socket).jugadorId);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:rendirse", () => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.rendirse(sala, enlaceDe(socket).jugadorId);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    socket.on("juego:nuevaPartida", () => {
      try {
        const sala = salaDesdeSocket(socket);
        juego.nuevaPartida(sala);
        difundirEstado(io, sala);
      } catch (error) {
        responderError(socket, error);
      }
    });

    // ── Desconexión: se marca al jugador y el temporizador global pausará
    //    la sala si tarda demasiado en volver.
    socket.on("disconnect", () => {
      const enlace = enlaces.get(socket.id);
      enlaces.delete(socket.id);
      if (!enlace) return;
      const sala = almacenEnMemoria.obtener(enlace.codigo);
      const jugador = sala?.jugadores.find((j) => j.id === enlace.jugadorId);
      if (sala && jugador && jugador.socketId === socket.id) {
        jugador.socketId = null;
        jugador.desconectadoDesde = Date.now();
        difundirEstado(io, sala);
      }
    });
  });

  // Temporizador global: plazos de retos, pausas por desconexión y limpieza.
  setInterval(() => {
    for (const sala of almacenEnMemoria.todas()) {
      let haCambiado = false;
      if (juego.comprobarPlazoReto(sala)) {
        haCambiado = true;
      }
      if (juego.pausarSiDesconectado(sala, VALORES.pausaTrasDesconexionSegundos)) {
        haCambiado = true;
      }
      if (haCambiado) {
        difundirEstado(io, sala);
      }
    }
    limpiarSalasAntiguas();
  }, 1000);
}

/** Obtiene el enlace (sala + jugador) asociado a un socket o lanza error. */
function enlaceDe(socket: Socket<EventosCliente, EventosServidor>): EnlaceSocket {
  const enlace = enlaces.get(socket.id);
  if (!enlace) {
    throw new ErrorDeJuego("No estás en ninguna sala.", "sin-sesion");
  }
  return enlace;
}

/** Obtiene la sala vinculada a un socket o lanza error. */
function salaDesdeSocket(socket: Socket<EventosCliente, EventosServidor>): Sala {
  const enlace = enlaceDe(socket);
  const sala = almacenEnMemoria.obtener(enlace.codigo);
  if (!sala) {
    throw new ErrorDeJuego("La sala ya no existe.", "sala-no-encontrada");
  }
  return sala;
}
