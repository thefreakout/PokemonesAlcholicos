"use client";

/**
 * Hook de comunicación con el servidor: gestiona la conexión Socket.IO,
 * la reconexión automática y el estado visible del juego.
 *
 * El cliente nunca calcula reglas: solo envía acciones y dibuja la vista
 * autoritativa que llega del servidor.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { EventosCliente, EventosServidor, VistaEstado } from "@/motor/tipos";
import {
  borrarSesionSala,
  guardarAvisoInicio,
  guardarSesionSala,
  leerPerfil,
  leerSesionSala,
} from "./identidad";

export interface EstadoConexion {
  /** Vista autoritativa de la sala para este jugador. */
  estado: VistaEstado | null;
  /** Conectado al servidor (WebSockets). */
  conectado: boolean;
  /** Último mensaje de error para mostrar en un aviso. */
  error: string | null;
  /** true si el servidor ha rechazado el acceso y hay que volver al inicio. */
  expulsado: boolean;
  /** Envía una acción al servidor. */
  enviar: EnviarAccion;
}

/** Firma de la función que envía acciones al servidor. */
export type EnviarAccion = <Evento extends keyof EventosCliente>(
  evento: Evento,
  ...datos: Parameters<EventosCliente[Evento]>
) => void;

export function usarSala(codigo: string, modo: "crear" | "unir"): EstadoConexion {
  const [estado, setEstado] = useState<VistaEstado | null>(null);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expulsado, setExpulsado] = useState(false);
  const socketRef = useRef<Socket<EventosServidor, EventosCliente> | null>(null);
  // En modo «crear» el código real lo genera el servidor: se guarda aquí
  const codigoActual = useRef(codigo);

  useEffect(() => {
    const socket: Socket<EventosServidor, EventosCliente> = io({
      transports: ["websocket", "polling"],
      reconnection: true, // reconexión automática si se pierde la red
      reconnectionDelay: 800,
      reconnectionDelayMax: 3000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConectado(true);
      setError(null);

      // ¿Teníamos sesión guardada en esta sala? → reconectar con su token secreto
      const sesion = leerSesionSala(codigoActual.current);
      if (sesion) {
        socket.emit("sala:reconectar", {
          codigo: codigoActual.current,
          jugadorId: sesion.jugadorId,
          token: sesion.token,
        });
        return;
      }

      // Primera entrada: crear o unirse con el perfil elegido en el inicio
      const perfil = leerPerfil();
      if (!perfil) {
        setExpulsado(true);
        return;
      }
      if (modo === "crear") {
        socket.emit("sala:crear", { apodo: perfil.apodo, color: perfil.color });
      } else {
        socket.emit("sala:unir", { codigo, apodo: perfil.apodo, color: perfil.color });
      }
    });

    socket.on("disconnect", () => {
      setConectado(false);
    });

    // Fallo al conectar (servidor caído, cambio de red…): se avisa mientras se reintenta
    socket.on("connect_error", () => {
      setConectado(false);
      setError("Sin conexión con el servidor. Reintentando…");
    });

    socket.on("estado", (vista) => {
      setEstado(vista);
      if (vista.codigo) {
        codigoActual.current = vista.codigo;
      }
      if (vista.miId && vista.miToken) {
        guardarSesionSala(vista.codigo, vista.miId, vista.miToken);
      }
    });

    socket.on("sala:error", ({ mensaje, codigo: codigoError }) => {
      setError(mensaje);
      if (codigoError === "sala-no-encontrada" || codigoError === "sala-llena") {
        borrarSesionSala(codigoActual.current);
        guardarAvisoInicio(mensaje);
        setExpulsado(true);
      }
      // Sesión caducada o no válida: la sala existe pero no podemos identificar al
      // jugador → se borra la sesión y se intenta entrar de nuevo si hay hueco.
      if (codigoError === "sin-sesion" || codigoError === "sesion-invalida") {
        borrarSesionSala(codigoActual.current);
        const perfil = leerPerfil();
        if (perfil && !socket.disconnected) {
          if (modo === "crear") {
            socket.emit("sala:crear", { apodo: perfil.apodo, color: perfil.color });
          } else {
            socket.emit("sala:unir", {
              codigo: codigoActual.current,
              apodo: perfil.apodo,
              color: perfil.color,
            });
          }
        }
      }
      // Autoocultar el aviso a los 4 segundos
      setTimeout(() => setError(null), 4000);
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [codigo, modo]);

  /** Envía una acción al servidor. */
  const enviar = useCallback(
    <Evento extends keyof EventosCliente>(
      evento: Evento,
      ...datos: Parameters<EventosCliente[Evento]>
    ) => {
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit(evento, ...datos);
    },
    []
  );

  return { estado, conectado, error, expulsado, enviar };
}
