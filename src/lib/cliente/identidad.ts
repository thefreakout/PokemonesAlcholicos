"use client";

/**
 * Identidad local del jugador guardada en el navegador (sin registro):
 *  - perfil: apodo y color de avatar, temporal para navegar entre pantallas.
 *  - sesión por sala: { jugadorId } para poder reconectar si se pierde la red.
 */

import type { PerfilJugador } from "@/motor/tipos";

const CLAVE_PERFIL = "pokecubata:perfil";
const PREFIJO_SESION = "pokecubata:sala:";

interface SesionSala {
  jugadorId: string;
  /** Token secreto que el servidor exige para reconectar a este asiento. */
  token: string;
}

/** Guarda temporalmente el perfil mientras el jugador navega a la sala. */
export function guardarPerfil(perfil: PerfilJugador): void {
  sessionStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil));
}

/** Lee el perfil temporal; null si no existe (habría que volver al inicio). */
export function leerPerfil(): PerfilJugador | null {
  const bruto = sessionStorage.getItem(CLAVE_PERFIL);
  if (!bruto) return null;
  try {
    const datos = JSON.parse(bruto) as PerfilJugador;
    if (typeof datos.apodo === "string" && typeof datos.color === "string") {
      return datos;
    }
  } catch {
    // Perfil corrupto: se ignora
  }
  return null;
}

/** Guarda la sesión (jugadorId + token secreto) para permitir la reconexión automática. */
export function guardarSesionSala(codigo: string, jugadorId: string, token: string): void {
  const sesion: SesionSala = { jugadorId, token };
  localStorage.setItem(PREFIJO_SESION + codigo.toUpperCase(), JSON.stringify(sesion));
}

export interface SesionGuardada {
  jugadorId: string;
  token: string;
}

/** Lee la sesión guardada para una sala (reconexión). */
export function leerSesionSala(codigo: string): SesionGuardada | null {
  const bruto = localStorage.getItem(PREFIJO_SESION + codigo.toUpperCase());
  if (!bruto) return null;
  try {
    const datos = JSON.parse(bruto) as SesionSala;
    if (typeof datos.jugadorId === "string" && typeof datos.token === "string") {
      return { jugadorId: datos.jugadorId, token: datos.token };
    }
  } catch {
    // Sesión corrupta: se ignora
  }
  return null;
}

/** Guarda un aviso para mostrarlo en la pantalla de inicio (p. ej. motivo de expulsión). */
export function guardarAvisoInicio(mensaje: string): void {
  sessionStorage.setItem("pokecubata:aviso", mensaje);
}

/** Lee y borra el aviso pendiente para la pantalla de inicio. */
export function leerAvisoInicio(): string | null {
  const mensaje = sessionStorage.getItem("pokecubata:aviso");
  if (mensaje) sessionStorage.removeItem("pokecubata:aviso");
  return mensaje;
}

/** Borra la sesión guardada de una sala (p. ej. sesión caducada). */
export function borrarSesionSala(codigo: string): void {
  localStorage.removeItem(PREFIJO_SESION + codigo.toUpperCase());
}
