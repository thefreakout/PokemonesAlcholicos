/**
 * Mazo 3: defensa (pócima y regeneración).
 *  - Poción: restaura HP a tu Pokémon activo en tu turno. Como respuesta a un
 *    ataque recibido, reduce tragos del castigo pendiente.
 *  - Regeneración: «rellenas el cubata otra vez»: anula los tragos pendientes
 *    que te hayan asignado y aún no hayas confirmado. Máximo 1 uso por jugador
 *    y partida (controlado por el motor con src/config/valores.ts).
 */

import type { CartaEfecto } from "../motor/tipos";

const pocion: CartaEfecto = {
  id: "pocion",
  mazo: "defensa",
  nombre: "Poción",
  descripcion:
    "En tu turno: restaura 30 HP a tu Pokémon activo. Como respuesta a un ataque: reduce 1 trago del castigo.",
  efecto: { tipo: "pocion" },
};

const regeneracion: CartaEfecto = {
  id: "regeneracion",
  mazo: "defensa",
  nombre: "Regeneración",
  descripcion:
    "«Rellenas el cubata otra vez»: anula todos los tragos pendientes que te hayan asignado y aún no confirmes. Un solo uso por partida.",
  efecto: { tipo: "regeneracion" },
};

/** El mazo de defensa lleva varias copias de cada carta. */
export const CARTAS_DEFENSA: CartaEfecto[] = [
  { ...pocion, id: "pocion-1" },
  { ...pocion, id: "pocion-2" },
  { ...pocion, id: "pocion-3" },
  { ...pocion, id: "pocion-4" },
  { ...pocion, id: "pocion-5" },
  { ...pocion, id: "pocion-6" },
  { ...regeneracion, id: "regeneracion-1" },
  { ...regeneracion, id: "regeneracion-2" },
];
