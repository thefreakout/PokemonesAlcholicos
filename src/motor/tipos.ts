/**
 * Tipos compartidos entre el servidor (motor del juego) y el cliente (UI).
 * Este archivo no importa nada del servidor: solo describe datos.
 */

import type { ModoBebidaDado, ModoBebidaFija } from "../config/valores";

/** Carta de ataque propia de un Pokémon del catálogo. */
export interface CartaAtaque {
  id: string;
  nombre: string;
  /** Daño fijo que hace la carta (el daño del dado se suma). */
  danio: number;
  /** De dónde sale la bebida de esta carta: la tabla del dado o una bebida fija. */
  bebida: ModoBebidaDado | ModoBebidaFija;
  /** HP que recupera el Pokémon atacante (opcional). */
  curacion?: number;
  /** El atacante pierde su próximo turno (opcional). */
  saltarTurnoPropio?: boolean;
  /** El rival pierde su próximo turno (opcional). */
  saltarTurnoRival?: boolean;
  /** Al jugarla se obliga al rival a resolver una carta de reto (opcional). */
  fuerzaReto?: boolean;
}

/** Pokémon del catálogo de Hoenn con valores de juego inventados. */
export interface DatosPokemon {
  id: string;
  nombre: string;
  tipos: string[];
  hp: number;
  /** Ruta pública del sprite local (p. ej. "/sprites/sceptile.png"). */
  sprite: string;
  ataques: CartaAtaque[];
}

/** Tipo de efecto de una carta de los mazos comunes (2, 3 y 4). */
export type EfectoCarta =
  | {
      tipo: "bebida";
      /** rival: el contrario · yo: quien juega la carta · todos: los dos · elegir: quien juega elige. */
      objetivo: "rival" | "yo" | "todos" | "elegir";
      tragos: number;
      chupitos: number;
    }
  | { tipo: "pocion" }
  | { tipo: "regeneracion" }
  | { tipo: "reto"; castigoTragos: number; castigoChupitos: number };

/** Carta de los mazos comunes (tragos, defensa y retos). */
export interface CartaEfecto {
  id: string;
  mazo: "tragos" | "defensa" | "retos";
  nombre: string;
  descripcion: string;
  efecto: EfectoCarta;
}

/** Nombre de cada uno de los 4 mazos (bolsillos de la mano). */
export type NombreMazo = "ataque" | "tragos" | "defensa" | "retos";

/** Tragos pendientes de confirmar asignados a un jugador. */
export interface Pendiente {
  id: string;
  tragos: number;
  chupitos: number;
  motivo: string;
  /** De dónde viene la bebida: un ataque (permite responder con Poción) u otra carta. */
  origen: "ataque" | "otro";
}

/** Entrada del registro de jugadas en vivo. */
export interface EntradaRegistro {
  id: string;
  momento: number;
  tipo:
    | "sistema"
    | "ataque"
    | "dado"
    | "bebida"
    | "defensa"
    | "reto"
    | "cambio"
    | "turno"
    | "fin";
  texto: string;
}

/** Fase dentro del turno. */
export type FaseTurno = "accion" | "reto" | "cambio";

/** Estado global de la sala. */
export type EstadoSala = "esperando" | "eligiendo" | "jugando" | "pausada" | "finalizada";

/* ─────────────────────────────── VISTAS ─────────────────────────────── */

/** Pokémon tal y como lo ve un cliente. */
export interface VistaPokemon {
  id: string;
  nombre: string;
  tipos: string[];
  sprite: string;
  hpMax: number;
  hpActual: number;
  debilitado: boolean;
  /** Cartas de ataque (solo se envían del Pokémon activo propio). */
  ataques?: CartaAtaque[];
}

/** Datos propios (visión completa del jugador que consulta). */
export interface VistaPropia {
  id: string;
  apodo: string;
  color: string;
  conectado: boolean;
  listo: boolean;
  /** Ids de Pokémon elegidos en la sala (antes de empezar). */
  seleccion: string[];
  equipo: VistaPokemon[];
  activo: number;
  mano: { ataque: CartaAtaque[]; tragos: CartaEfecto[]; defensa: CartaEfecto[]; retos: CartaEfecto[] };
  pendientes: Pendiente[];
  tragosConfirmados: number;
  chupitosConfirmados: number;
  regeneracionUsada: boolean;
  saltarProximoTurno: boolean;
  /** Marcas del turno actual. */
  atacoEsteTurno: boolean;
  roboEsteTurno: boolean;
  retoJugadoEsteTurno: boolean;
}

/** Datos del rival (sin ver el contenido de su mano). */
export interface VistaRival {
  id: string;
  apodo: string;
  color: string;
  conectado: boolean;
  listo: boolean;
  /** Cuántos Pokémon ha elegido (antes de empezar). */
  seleccionCount: number;
  equipo: VistaPokemon[];
  activo: number;
  manoCuentas: { ataque: number; tragos: number; defensa: number; retos: number };
  pendientes: Pendiente[];
  tragosConfirmados: number;
  chupitosConfirmados: number;
  regeneracionUsada: boolean;
  saltarProximoTurno: boolean;
}

/** Estado completo que recibe cada cliente, personalizado por jugador. */
export interface VistaEstado {
  codigo: string;
  estadoSala: EstadoSala;
  miId: string | null;
  /** Token secreto de sesión: solo lo conoce este jugador y exige la reconexión. */
  miToken: string | null;
  turnoDe: string | null;
  faseTurno: FaseTurno;
  /** Jugador que debe elegir nuevo Pokémon activo (fase "cambio"). */
  jugadorCambiando: string | null;
  reto: {
    carta: CartaEfecto;
    terminaEn: number;
    lanzadoPor: string;
    objetivo: string;
  } | null;
  ultimoDado: { valor: number; texto: string; momento: number } | null;
  tu: VistaPropia | null;
  rival: VistaRival | null;
  registro: EntradaRegistro[];
  ganador: string | null;
  motivoFin: string | null;
}

/* ────────────────────────── EVENTOS SOCKET.IO ───────────────────────── */

/** Perfil mínimo con el que entra un jugador (sin registro). */
export interface PerfilJugador {
  apodo: string;
  color: string;
}

/** Eventos que el cliente envía al servidor. */
export interface EventosCliente {
  "sala:crear": (datos: PerfilJugador) => void;
  "sala:unir": (datos: PerfilJugador & { codigo: string }) => void;
  "sala:reconectar": (datos: { codigo: string; jugadorId: string; token: string }) => void;
  "sala:seleccionarEquipo": (datos: { pokemonIds: string[] }) => void;
  "sala:listo": (datos: { listo: boolean }) => void;
  "juego:atacar": (datos: { cartaId: string }) => void;
  "juego:robar": (datos: { mazo: "tragos" | "defensa" | "retos" }) => void;
  "juego:jugarCarta": (datos: { cartaId: string; objetivoId?: string }) => void;
  "juego:responderPocion": (datos?: Record<string, never>) => void;
  "juego:resolverReto": (datos: { cumplido: boolean }) => void;
  "juego:confirmarBebida": (datos: { modo: "todo" | "mitad" }) => void;
  "juego:cambiarActivo": (datos: { indice: number }) => void;
  "juego:terminarTurno": (datos?: Record<string, never>) => void;
  "juego:rendirse": (datos?: Record<string, never>) => void;
  "juego:nuevaPartida": (datos?: Record<string, never>) => void;
}

/** Eventos que el servidor envía al cliente. */
export interface EventosServidor {
  estado: (vista: VistaEstado) => void;
  "sala:error": (datos: { mensaje: string; codigo?: string }) => void;
}
