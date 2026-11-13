/**
 * Mazo 2: tragos y chupitos (azar).
 * Cartas que reparten bebida «dependiendo de lo que te ha dado»:
 * quien la juega la aplica según su texto.
 */

import type { CartaEfecto } from "../motor/tipos";

function carta(
  id: string,
  nombre: string,
  descripcion: string,
  objetivo: "rival" | "yo" | "todos" | "elegir",
  tragos: number,
  chupitos: number
): CartaEfecto {
  return {
    id,
    mazo: "tragos",
    nombre,
    descripcion,
    efecto: { tipo: "bebida", objetivo, tragos, chupitos },
  };
}

export const CARTAS_TRAGOS: CartaEfecto[] = [
  carta(
    "brindis-kecleon",
    "Brindis de Kecleon",
    "Todos beben 1 trago. ¡Salud!",
    "todos",
    1,
    0
  ),
  carta(
    "veneno-seviper",
    "Veneno de Seviper",
    "El rival bebe 2 chupitos.",
    "rival",
    0,
    2
  ),
  carta(
    "fiesta-ludicolo",
    "Fiesta de Ludicolo",
    "Eliges quién bebe 3 tragos: tú o el rival.",
    "elegir",
    3,
    0
  ),
  carta(
    "oleada-wailord",
    "Oleada de Wailord",
    "El rival bebe 3 tragos. Ola gigante a la vista.",
    "rival",
    3,
    0
  ),
  carta(
    "susurro-banette",
    "Susurro de Banette",
    "El rival bebe 1 trago y 1 chupito.",
    "rival",
    1,
    1
  ),
  carta(
    "polvo-shiftry",
    "Polvo Burlón de Shiftry",
    "El rival bebe 2 tragos.",
    "rival",
    2,
    0
  ),
  carta(
    "fatalidad-absol",
    "Fatalidad de Absol",
    "Mala suerte: tú bebes 1 chupito.",
    "yo",
    0,
    1
  ),
  carta(
    "niebla-dusclops",
    "Niebla de Dusclops",
    "Todos beben 1 chupito.",
    "todos",
    0,
    1
  ),
  carta(
    "mordisco-sharpedo",
    "Mordisco de Sharpedo",
    "El rival bebe 2 tragos y 1 chupito.",
    "rival",
    2,
    1
  ),
  carta(
    "tueste-camerupt",
    "Tueste de Camerupt",
    "Eliges quién bebe 2 tragos.",
    "elegir",
    2,
    0
  ),
  carta(
    "baile-breloom",
    "Baile Espora de Breloom",
    "Todos beben 2 tragos. ¡A mover el esqueleto!",
    "todos",
    2,
    0
  ),
  carta(
    "duda-shedinja",
    "Duda Existencial de Shedinja",
    "Eliges quién bebe 2 chupitos.",
    "elegir",
    0,
    2
  ),
];
