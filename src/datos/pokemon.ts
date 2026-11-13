/**
 * Catálogo de 30 Pokémon únicos de la tercera generación (Hoenn)
 * con valores de juego inventados para PokéCubata Hoenn.
 *
 * Los nombres provienen de PokeAPI (https://pokeapi.co) y los sprites
 * se guardan en una copia local en /public/sprites (ver scripts/descargar-sprites.mjs).
 *
 * Cada Pokémon tiene: nombre, tipo, HP y 2 cartas de ataque propias
 * con nombre divertido en español, daño y tragos.
 *
 * Regla de las cartas de ataque:
 *  - bebida { modo: "dado" }  → el rival bebe según la tabla del dado (src/config/valores.ts).
 *  - bebida { modo: "fija" }  → la carta define la bebida y a quién va (rival / atacante / todos).
 *  - campos extra opcionales: curacion, saltarTurnoPropio, saltarTurnoRival, fuerzaReto.
 */

import type { DatosPokemon } from "../motor/tipos";

export const CATALOGO_POKEMON: DatosPokemon[] = [
  {
    id: "sceptile",
    nombre: "Sceptile",
    tipos: ["Planta"],
    hp: 110,
    sprite: "/sprites/sceptile.png",
    ataques: [
      { id: "sceptile-filo-hoenn", nombre: "Filo Hoenn", danio: 30, bebida: { modo: "dado" } },
      {
        id: "sceptile-colahoja",
        nombre: "Cola Hoja Certera",
        danio: 25,
        bebida: { modo: "fija", tragos: 2, chupitos: 0, objetivo: "rival" },
      },
    ],
  },
  {
    id: "blaziken",
    nombre: "Blaziken",
    tipos: ["Fuego", "Lucha"],
    hp: 115,
    sprite: "/sprites/blaziken.png",
    ataques: [
      {
        id: "blaziken-patada",
        nombre: "Patada Ígnea",
        danio: 40,
        bebida: { modo: "fija", tragos: 2, chupitos: 0, objetivo: "rival" },
      },
      { id: "blaziken-puno", nombre: "Puño Calcinado", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "swampert",
    nombre: "Swampert",
    tipos: ["Agua", "Tierra"],
    hp: 120,
    sprite: "/sprites/swampert.png",
    ataques: [
      {
        id: "swampert-maremoto",
        nombre: "Maremoto",
        danio: 35,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "todos" },
      },
      { id: "swampert-brazo", nombre: "Brazo Barroso", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "gardevoir",
    nombre: "Gardevoir",
    tipos: ["Psíquico", "Hada"],
    hp: 105,
    sprite: "/sprites/gardevoir.png",
    ataques: [
      {
        id: "gardevoir-sincrobrindis",
        nombre: "Sincrobrindis",
        danio: 20,
        bebida: { modo: "fija", tragos: 0, chupitos: 1, objetivo: "todos" },
      },
      { id: "gardevoir-onda", nombre: "Onda Mental", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "aggron",
    nombre: "Aggron",
    tipos: ["Acero", "Roca"],
    hp: 130,
    sprite: "/sprites/aggron.png",
    ataques: [
      {
        id: "aggron-cabezazo",
        nombre: "Cabezazo de Hierro",
        danio: 50,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "atacante" },
      },
      { id: "aggron-cornada", nombre: "Cornada Rústica", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "salamence",
    nombre: "Salamence",
    tipos: ["Dragón", "Volador"],
    hp: 115,
    sprite: "/sprites/salamence.png",
    ataques: [
      {
        id: "salamence-furia",
        nombre: "Furia Alada",
        danio: 45,
        bebida: { modo: "fija", tragos: 3, chupitos: 0, objetivo: "rival" },
      },
      { id: "salamence-aletazo", nombre: "Aletazo Turbulento", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "milotic",
    nombre: "Milotic",
    tipos: ["Agua"],
    hp: 115,
    sprite: "/sprites/milotic.png",
    ataques: [
      {
        id: "milotic-bendicion",
        nombre: "Bendición Marina",
        danio: 15,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "rival" },
        curacion: 25,
      },
      { id: "milotic-onda", nombre: "Onda Serpenteante", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "flygon",
    nombre: "Flygon",
    tipos: ["Tierra", "Dragón"],
    hp: 110,
    sprite: "/sprites/flygon.png",
    ataques: [
      {
        id: "flygon-tormenta",
        nombre: "Tormenta de Arena",
        danio: 25,
        bebida: { modo: "dado" },
        saltarTurnoRival: true,
      },
      {
        id: "flygon-zarpazo",
        nombre: "Zarpazo del Desierto",
        danio: 35,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "rival" },
      },
    ],
  },
  {
    id: "manectric",
    nombre: "Manectric",
    tipos: ["Eléctrico"],
    hp: 100,
    sprite: "/sprites/manectric.png",
    ataques: [
      {
        id: "manectric-chispa",
        nombre: "Chispa Doble",
        danio: 30,
        bebida: { modo: "fija", tragos: 1, chupitos: 1, objetivo: "rival" },
      },
      { id: "manectric-cola", nombre: "Cola Voltio", danio: 25, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "banette",
    nombre: "Banette",
    tipos: ["Fantasma"],
    hp: 95,
    sprite: "/sprites/banette.png",
    ataques: [
      {
        id: "banette-maldicion",
        nombre: "Maldición del Reto",
        danio: 0,
        bebida: { modo: "fija", tragos: 0, chupitos: 0, objetivo: "rival" },
        fuerzaReto: true,
      },
      { id: "banette-sombra", nombre: "Sombra Burlona", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "slaking",
    nombre: "Slaking",
    tipos: ["Normal"],
    hp: 140,
    sprite: "/sprites/slaking.png",
    ataques: [
      {
        id: "slaking-perezazo",
        nombre: "Perezazo Brutal",
        danio: 55,
        bebida: { modo: "fija", tragos: 2, chupitos: 0, objetivo: "rival" },
        saltarTurnoPropio: true,
      },
      { id: "slaking-bostezo", nombre: "Bostezo Sísmico", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "sharpedo",
    nombre: "Sharpedo",
    tipos: ["Agua", "Siniestro"],
    hp: 95,
    sprite: "/sprites/sharpedo.png",
    ataques: [
      {
        id: "sharpedo-embestida",
        nombre: "Embestida Tiburón",
        danio: 40,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "atacante" },
      },
      { id: "sharpedo-filo", nombre: "Filo de Coral", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "altaria",
    nombre: "Altaria",
    tipos: ["Dragón", "Volador"],
    hp: 105,
    sprite: "/sprites/altaria.png",
    ataques: [
      {
        id: "altaria-canto",
        nombre: "Canto Nuboso",
        danio: 25,
        bebida: { modo: "fija", tragos: 0, chupitos: 1, objetivo: "rival" },
      },
      { id: "altaria-viento", nombre: "Viento Algodonoso", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "metagross",
    nombre: "Metagross",
    tipos: ["Acero", "Psíquico"],
    hp: 125,
    sprite: "/sprites/metagross.png",
    ataques: [
      {
        id: "metagross-meteoro",
        nombre: "Puño Meteoro",
        danio: 45,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "atacante" },
      },
      { id: "metagross-calculo", nombre: "Cálculo Frío", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "breloom",
    nombre: "Breloom",
    tipos: ["Planta", "Lucha"],
    hp: 100,
    sprite: "/sprites/breloom.png",
    ataques: [
      {
        id: "breloom-patada",
        nombre: "Patada Espora",
        danio: 35,
        bebida: { modo: "fija", tragos: 2, chupitos: 0, objetivo: "rival" },
      },
      { id: "breloom-puno", nombre: "Puño Hongo", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "crawdaunt",
    nombre: "Crawdaunt",
    tipos: ["Agua", "Siniestro"],
    hp: 100,
    sprite: "/sprites/crawdaunt.png",
    ataques: [
      {
        id: "crawdaunt-pinza",
        nombre: "Pinza Bandolera",
        danio: 35,
        bebida: { modo: "fija", tragos: 0, chupitos: 1, objetivo: "rival" },
      },
      { id: "crawdaunt-garra", nombre: "Garra Pirata", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "shiftry",
    nombre: "Shiftry",
    tipos: ["Planta", "Siniestro"],
    hp: 105,
    sprite: "/sprites/shiftry.png",
    ataques: [
      {
        id: "shiftry-risa",
        nombre: "Risa Burlona",
        danio: 25,
        bebida: { modo: "fija", tragos: 0, chupitos: 1, objetivo: "rival" },
      },
      { id: "shiftry-abanico", nombre: "Abanico Hoja", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "camerupt",
    nombre: "Camerupt",
    tipos: ["Tierra", "Fuego"],
    hp: 115,
    sprite: "/sprites/camerupt.png",
    ataques: [
      {
        id: "camerupt-erupcion",
        nombre: "Erupción Espumosa",
        danio: 40,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "todos" },
      },
      { id: "camerupt-lanzacolas", nombre: "Lanzacolas", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "wailord",
    nombre: "Wailord",
    tipos: ["Agua"],
    hp: 140,
    sprite: "/sprites/wailord.png",
    ataques: [
      {
        id: "wailord-salto",
        nombre: "Salto Colosal",
        danio: 45,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "todos" },
      },
      { id: "wailord-chorro", nombre: "Chorro Gigante", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "walrein",
    nombre: "Walrein",
    tipos: ["Agua", "Hielo"],
    hp: 125,
    sprite: "/sprites/walrein.png",
    ataques: [
      {
        id: "walrein-colmillo",
        nombre: "Colmillo Polar",
        danio: 40,
        bebida: { modo: "fija", tragos: 2, chupitos: 0, objetivo: "rival" },
      },
      { id: "walrein-mordisco", nombre: "Mordisco Helado", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "glalie",
    nombre: "Glalie",
    tipos: ["Hielo"],
    hp: 100,
    sprite: "/sprites/glalie.png",
    ataques: [
      {
        id: "glalie-carcajada",
        nombre: "Carcajada Helada",
        danio: 30,
        bebida: { modo: "fija", tragos: 0, chupitos: 1, objetivo: "rival" },
      },
      { id: "glalie-ventisca", nombre: "Ventisca Gélida", danio: 35, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "claydol",
    nombre: "Claydol",
    tipos: ["Tierra", "Psíquico"],
    hp: 110,
    sprite: "/sprites/claydol.png",
    ataques: [
      {
        id: "claydol-ojo",
        nombre: "Ojo Hipnótico",
        danio: 20,
        bebida: { modo: "fija", tragos: 0, chupitos: 1, objetivo: "rival" },
      },
      { id: "claydol-telequinesis", nombre: "Telequinesis Turbia", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "cradily",
    nombre: "Cradily",
    tipos: ["Roca", "Planta"],
    hp: 115,
    sprite: "/sprites/cradily.png",
    ataques: [
      {
        id: "cradily-sorbo",
        nombre: "Sorbo Ácido",
        danio: 25,
        bebida: { modo: "fija", tragos: 2, chupitos: 0, objetivo: "rival" },
      },
      { id: "cradily-latigo", nombre: "Látigo Kelp", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "armaldo",
    nombre: "Armaldo",
    tipos: ["Roca", "Bicho"],
    hp: 115,
    sprite: "/sprites/armaldo.png",
    ataques: [
      {
        id: "armaldo-garra",
        nombre: "Garra Fósil",
        danio: 40,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "atacante" },
      },
      { id: "armaldo-pinza", nombre: "Pinza Prehistórica", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "zangoose",
    nombre: "Zangoose",
    tipos: ["Normal"],
    hp: 100,
    sprite: "/sprites/zangoose.png",
    ataques: [
      {
        id: "zangoose-garra",
        nombre: "Garra Caterva",
        danio: 35,
        bebida: { modo: "fija", tragos: 2, chupitos: 0, objetivo: "rival" },
      },
      { id: "zangoose-cuchillada", nombre: "Cuchillada Veloz", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "seviper",
    nombre: "Seviper",
    tipos: ["Veneno"],
    hp: 100,
    sprite: "/sprites/seviper.png",
    ataques: [
      {
        id: "seviper-colmillo",
        nombre: "Colmillo Ponzoña",
        danio: 30,
        bebida: { modo: "fija", tragos: 0, chupitos: 1, objetivo: "rival" },
      },
      { id: "seviper-pliegue", nombre: "Pliegue Víbora", danio: 25, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "absol",
    nombre: "Absol",
    tipos: ["Siniestro"],
    hp: 100,
    sprite: "/sprites/absol.png",
    ataques: [
      {
        id: "absol-cuchilla",
        nombre: "Cuchilla del Destino",
        danio: 45,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "atacante" },
      },
      { id: "absol-zarpazo", nombre: "Zarpazo Sombrío", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "ludicolo",
    nombre: "Ludicolo",
    tipos: ["Agua", "Planta"],
    hp: 105,
    sprite: "/sprites/ludicolo.png",
    ataques: [
      {
        id: "ludicolo-fiesta",
        nombre: "Fiesta Tropical",
        danio: 25,
        bebida: { modo: "fija", tragos: 1, chupitos: 0, objetivo: "todos" },
      },
      { id: "ludicolo-hoja", nombre: "Hoja Bailarina", danio: 30, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "shedinja",
    nombre: "Shedinja",
    tipos: ["Bicho", "Fantasma"],
    hp: 60,
    sprite: "/sprites/shedinja.png",
    ataques: [
      {
        id: "shedinja-hueco",
        nombre: "Hueco Espectral",
        danio: 35,
        bebida: { modo: "fija", tragos: 0, chupitos: 1, objetivo: "rival" },
      },
      { id: "shedinja-aura", nombre: "Aura Vacía", danio: 25, bebida: { modo: "dado" } },
    ],
  },
  {
    id: "dusclops",
    nombre: "Dusclops",
    tipos: ["Fantasma"],
    hp: 115,
    sprite: "/sprites/dusclops.png",
    ataques: [
      {
        id: "dusclops-puno",
        nombre: "Puño Umbrío",
        danio: 35,
        bebida: { modo: "fija", tragos: 2, chupitos: 0, objetivo: "rival" },
      },
      { id: "dusclops-mirada", nombre: "Mirada Tenebrosa", danio: 25, bebida: { modo: "dado" } },
    ],
  },
];

/** Mapa id → datos del Pokémon, para búsquedas rápidas del motor. */
export const POKEMON_POR_ID: Record<string, DatosPokemon> = Object.fromEntries(
  CATALOGO_POKEMON.map((p) => [p.id, p])
);
