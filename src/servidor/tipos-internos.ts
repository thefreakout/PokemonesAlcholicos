/**
 * Tipos internos del servidor: el estado completo y autoritativo de las salas.
 * El cliente nunca recibe esto tal cual: el motor genera vistas filtradas
 * (src/motor/vista.ts).
 */

import type {
  CartaAtaque,
  CartaEfecto,
  EntradaRegistro,
  EstadoSala,
  FaseTurno,
  Pendiente,
} from "../motor/tipos";
import { POKEMON_POR_ID } from "../datos/pokemon";

/** Pokémon dentro de una partida (con su vida actual). */
export interface PokemonEnJuego {
  /** Id en el catálogo (src/datos/pokemon.ts). */
  datosId: string;
  hpActual: number;
}

/** Un jugador dentro de una sala. */
export interface Jugador {
  id: string;
  /** Token secreto: sin él no se puede reconectar a este asiento. */
  tokenSecreto: string;
  apodo: string;
  color: string;
  /** Socket conectado actualmente (null si está desconectado). */
  socketId: string | null;
  /** Momento (Date.now) en el que se desconectó, si lo está. */
  desconectadoDesde: number | null;
  listo: boolean;
  /** Ids de Pokémon elegidos en la pantalla de sala: [activo, reserva, reserva]. */
  seleccion: string[];
  equipo: PokemonEnJuego[];
  /** Índice del Pokémon activo dentro del equipo. */
  activo: number;
  mano: { tragos: CartaEfecto[]; defensa: CartaEfecto[]; retos: CartaEfecto[] };
  pendientes: Pendiente[];
  tragosConfirmados: number;
  chupitosConfirmados: number;
  /** Usos de Regeneración consumidos (límite en src/config/valores.ts). */
  regeneracionUsos: number;
  saltarProximoTurno: boolean;
  /** Contadores del turno en curso (límites en src/config/valores.ts). */
  ataquesEsteTurno: number;
  robosEsteTurno: number;
  retosEsteTurno: number;
}

/** Reto en curso en la sala. */
export interface RetoEnCurso {
  carta: CartaEfecto;
  /** Momento (Date.now) en el que expira el plazo para resolverlo. */
  terminaEn: number;
  lanzadoPor: string;
  objetivo: string;
}

/** Los 3 mazos comunes a ambos jugadores (2, 3 y 4) con sus descartes. */
export interface MazosComunes {
  tragos: CartaEfecto[];
  defensa: CartaEfecto[];
  retos: CartaEfecto[];
  descartesTragos: CartaEfecto[];
  descartesDefensa: CartaEfecto[];
  descartesRetos: CartaEfecto[];
}

/** Estado completo y autoritativo de una sala. Vive solo en memoria. */
export interface Sala {
  codigo: string;
  estadoSala: EstadoSala;
  jugadores: Jugador[];
  turnoDe: string | null;
  faseTurno: FaseTurno;
  /** Jugador que debe elegir nuevo Pokémon activo (fase "cambio"). */
  jugadorCambiando: string | null;
  reto: RetoEnCurso | null;
  /** Momento en el que la sala quedó en pausa (para extender plazos de verdad). */
  pausadaDesde: number | null;
  mazos: MazosComunes;
  registro: EntradaRegistro[];
  ganador: string | null;
  motivoFin: string | null;
  ultimoDado: { valor: number; texto: string; momento: number } | null;
  creadaEn: number;
  ultimaActividad: number;
}

/** Error con mensaje pensado para mostrarse al jugador. */
export class ErrorDeJuego extends Error {
  codigo: string;
  constructor(mensaje: string, codigo?: string) {
    super(mensaje);
    this.codigo = codigo ?? "accion-invalida";
  }
}

/** Busca a un jugador por id o lanza error. */
export function obtenerJugador(sala: Sala, jugadorId: string | null): Jugador {
  const jugador = sala.jugadores.find((j) => j.id === jugadorId);
  if (!jugador) {
    throw new ErrorDeJuego("No estás en esta sala.", "sin-sesion");
  }
  return jugador;
}

/** Busca al oponente de un jugador. */
export function obtenerRival(sala: Sala, jugador: Jugador): Jugador {
  const rival = sala.jugadores.find((j) => j.id !== jugador.id);
  if (!rival) {
    throw new ErrorDeJuego("Aún no ha llegado tu rival.");
  }
  return rival;
}

/** Datos del catálogo del Pokémon activo de un jugador. */
export function datosActivo(jugador: Jugador): {
  enJuego: PokemonEnJuego;
  ataques: CartaAtaque[];
  hpMax: number;
  nombre: string;
} {
  const enJuego = jugador.equipo[jugador.activo];
  if (!enJuego) {
    throw new ErrorDeJuego("Tu equipo aún no está listo.");
  }
  const catalogo = POKEMON_POR_ID[enJuego.datosId];
  if (!catalogo) {
    throw new ErrorDeJuego("Pokémon desconocido en el equipo.");
  }
  return { enJuego, ataques: catalogo.ataques, hpMax: catalogo.hp, nombre: catalogo.nombre };
}
