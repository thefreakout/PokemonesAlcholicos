/**
 * Utilidades de los mazos comunes: construcción, mezcla y robo con reciclaje
 * de descartes (cuando un mazo se vacía, se vuelve a barajar con su descarte).
 */

import type { CartaEfecto, NombreMazo } from "./tipos";
import type { MazosComunes } from "../servidor/tipos-internos";
import { CARTAS_TRAGOS } from "../datos/mazo-tragos";
import { CARTAS_DEFENSA } from "../datos/mazo-defensa";
import { CARTAS_RETOS } from "../datos/mazo-retos";

/** Mezcla un array con el algoritmo de Fisher-Yates (no muta el original). */
export function mezclar<T>(cartas: T[]): T[] {
  const copia = [...cartas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Crea los 3 mazos comunes ya barajados. */
export function construirMazos(): MazosComunes {
  return {
    tragos: mezclar(CARTAS_TRAGOS),
    defensa: mezclar(CARTAS_DEFENSA),
    retos: mezclar(CARTAS_RETOS),
    descartesTragos: [],
    descartesDefensa: [],
    descartesRetos: [],
  };
}

/** Claves internas de cada mazo dentro del estado. */
type ClaveMazo = "tragos" | "defensa" | "retos";

function claves(mazo: NombreMazo): { robar: ClaveMazo; descarte: `descartes${Capitalize<ClaveMazo>}` } | null {
  if (mazo === "ataque") return null;
  const capital = (mazo.charAt(0).toUpperCase() + mazo.slice(1)) as Capitalize<ClaveMazo>;
  return { robar: mazo as ClaveMazo, descarte: `descartes${capital}` };
}

/** Roba una carta del mazo indicado; recicla el descarte si el mazo está vacío. */
export function robarCarta(mazos: MazosComunes, mazo: NombreMazo): CartaEfecto | null {
  const clavesMazo = claves(mazo);
  if (!clavesMazo) return null;
  const pila = mazos[clavesMazo.robar];
  if (pila.length === 0) {
    const descarte = mazos[clavesMazo.descarte] as CartaEfecto[];
    if (descarte.length === 0) return null;
    mazos[clavesMazo.robar] = mezclar(descarte);
    mazos[clavesMazo.descarte] = [];
  }
  return mazos[clavesMazo.robar].pop() ?? null;
}

/** Manda una carta jugada al descarte de su mazo. */
export function descartarCarta(mazos: MazosComunes, carta: CartaEfecto): void {
  const clavesMazo = claves(carta.mazo);
  if (!clavesMazo) return;
  (mazos[clavesMazo.descarte] as CartaEfecto[]).push(carta);
}
