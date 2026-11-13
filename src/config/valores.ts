/**
 * ──────────────────────────────────────────────────────────────────────────
 *  VALORES DEL JUEGO — archivo único de configuración editable
 * ──────────────────────────────────────────────────────────────────────────
 *
 *  Todos los números que definen la intensidad del juego viven aquí.
 *  Puedes ajustarlos sin tocar el código del motor.
 *
 *  Los valores marcados como [SUGERIDO] en el documento de especificación
 *  están señalados en los comentarios. Los valores del dado 1 y 2 salen
 *  del audio original; el resto son propuestas ajustables.
 *
 *  Nota: la vida (HP) y los daños base de cada carta de ataque NO están
 *  aquí: son parte del catálogo (src/datos/pokemon.ts), igual que los
 *  castigos de los retos (src/datos/mazo-retos.ts).
 */

/** Una fila de la tabla del dado del ataque directo. */
export interface FilaDado {
  /** Número que sacó el dado (1-6). */
  tirada: number;
  /** Tragos que bebe el objetivo. */
  tragos: number;
  /** Chupitos que bebe el objetivo. */
  chupitos: number;
  /** Daño que recibe el Pokémon activo del objetivo. */
  danio: number;
  /** true si la tirada es un fallo (la bebida va al atacante). */
  fallo?: boolean;
}

export const VALORES = {
  /** Tabla del dado del ataque directo: bebida del rival y daño a su Pokémon. */
  dado: [
    { tirada: 1, tragos: 2, chupitos: 0, danio: 20 }, // del audio original
    { tirada: 2, tragos: 3, chupitos: 0, danio: 25 }, // del audio original
    { tirada: 3, tragos: 4, chupitos: 0, danio: 30 }, // [SUGERIDO]
    { tirada: 4, tragos: 5, chupitos: 0, danio: 35 }, // [SUGERIDO]
    { tirada: 5, tragos: 2, chupitos: 1, danio: 40 }, // [SUGERIDO] (1 chupito y 2 tragos)
    { tirada: 6, tragos: 1, chupitos: 0, danio: 0, fallo: true }, // [SUGERIDO] fallo: bebe el atacante
  ] as FilaDado[],

  /** Pócima: HP que restaura al Pokémon activo. [SUGERIDO: 30] */
  pocionHP: 30,

  /** Poción como respuesta a un ataque: tragos que reduce del castigo. [SUGERIDO: 1] */
  pocionRespuestaReduceTragos: 1,

  /** Regeneración: usos máximos por jugador y partida. [SUGERIDO: 1] */
  regeneracionUsosPorPartida: 1,

  /** «Cuenta la mitad»: por esto se divide la cantidad pendiente (redondeo hacia arriba). */
  divisorCuentaMitad: 2,

  /** Número máximo de salas vivas en memoria (protección contra saturación). */
  maxSalasActivas: 200,

  /** Retos: segundos que tiene el rival para cumplirlo. [SUGERIDO: 30] */
  retoSegundos: 30,

  /** Retos: máximo de cartas de reto por turno. [SUGERIDO: 1] */
  retosPorTurno: 1,

  /** Ataques por turno (el dado se lanza con cada ataque). */
  ataquesPorTurno: 1,

  /** Robos de carta (mazos comunes) que puede hacer cada jugador por turno. */
  robosPorTurno: 1,

  /** Cartas iniciales de cada jugador al empezar la partida, por mazo común. */
  cartasIniciales: {
    tragos: 2,
    defensa: 2,
    retos: 2,
  },

  /** Número máximo de cartas en la mano de un jugador (todos los mazos comunes juntos). */
  tamanoMaximoMano: 8,

  /** Longitud del código de sala (letras/números sin ambigüedad). [SUGERIDO: 5] */
  codigoSalaLongitud: 5,

  /** Segundos de desconexión de un jugador antes de pausar la sala. [SUGERIDO: 60] */
  pausaTrasDesconexionSegundos: 60,

  /** Minutos de inactividad antes de borrar una sala de la memoria. */
  limpiezaSalaMinutos: 180,

  /** Tamaño máximo del registro de jugadas que se guarda en memoria. */
  registroMaximo: 60,

  /** Paleta de colores para el avatar (nombre y color). */
  coloresAvatar: [
    { nombre: "Rojo", valor: "#E3350D" },
    { nombre: "Ámbar", valor: "#F59E0B" },
    { nombre: "Verde", valor: "#22C55E" },
    { nombre: "Cielo", valor: "#0EA5E9" },
    { nombre: "Índigo", valor: "#6366F1" },
    { nombre: "Rosa", valor: "#EC4899" },
    { nombre: "Violeta", valor: "#8B5CF6" },
    { nombre: "Turquesa", valor: "#14B8A6" },
  ],
} as const;

/** Tipo de una carta de ataque de un Pokémon. */
export interface ModoBebidaDado {
  modo: "dado";
}

/** Bebida fija que lleva una carta de ataque (sustituye a la tabla del dado). */
export interface ModoBebidaFija {
  modo: "fija";
  tragos: number;
  chupitos: number;
  /** A quién va la bebida: rival, el propio atacante o todos. */
  objetivo: "rival" | "atacante" | "todos";
}
