/**
 * Mazo 4: retos.
 * El atacante juega una carta de reto; el rival tiene un tiempo límite
 * (src/config/valores.ts) para cumplirlo. Si lo cumple no bebe; si no lo
 * cumple, bebe el castigo de la carta (3 tragos o 1 chupito).
 *
 * Todos los retos son divertidos y seguros: nada peligroso, ilegal
 * o excesivamente vergonzante. Añadir más retos aquí es suficiente
 * para ampliar el mazo.
 */

import type { CartaEfecto } from "../motor/tipos";

function reto(
  id: string,
  nombre: string,
  texto: string,
  castigoTragos: number,
  castigoChupitos: number
): CartaEfecto {
  return {
    id,
    mazo: "retos",
    nombre,
    descripcion: texto,
    efecto: { tipo: "reto", castigoTragos, castigoChupitos },
  };
}

export const CARTAS_RETOS: CartaEfecto[] = [
  reto(
    "reto-imitar",
    "Copia Perfecta",
    "Imita a tu Pokémon activo: pose y sonido incluidos.",
    3,
    0
  ),
  reto(
    "reto-cancion",
    "Melodía de Hoenn",
    "Canta el estribillo de la apertura de Pokémon en voz alta.",
    3,
    0
  ),
  reto(
    "reto-memory",
    "Memoria de Entrenador",
    "Di 5 nombres de Pokémon de Hoenn en 10 segundos.",
    3,
    0
  ),
  reto(
    "reto-yoga",
    "Pose de Meditite",
    "Haz una pose de yoga digna de Meditite durante 15 segundos.",
    0,
    1
  ),
  reto(
    "reto-movil",
    "Móvil Bocabajo",
    "Deja tu móvil bocabajo y cuenta hasta 20 sin mirarlo.",
    0,
    1
  ),
  reto(
    "reto-sentadillas",
    "Entrenamiento Silph",
    "Haz 10 sentadillas mientras gritas el nombre de tu ataque.",
    3,
    0
  ),
  reto(
    "reto-respiracion",
    "Pulmón de Wailord",
    "Aguanta la respiración 15 segundos.",
    0,
    1
  ),
  reto(
    "reto-chiste",
    "Comedia de Ludicolo",
    "Cuenta el peor chiste que conozcas con talento de estrella.",
    3,
    0
  ),
  reto(
    "reto-rival",
    "¿Quién es quién?",
    "Recita el nombre de los 3 Pokémon del rival sin mirar la pantalla.",
    0,
    1
  ),
  reto(
    "reto-ash",
    "Yo soy Ash",
    "Haz tu mejor imitación de Ash pidiendo un combate al rival.",
    3,
    0
  ),
  reto(
    "reto-baile",
    "Baile de Sable",
    "Tira un baile de 10 segundos sin parar.",
    3,
    0
  ),
  reto(
    "reto-trabalenguas",
    "Trabalenguas de Blaziken",
    "Di «tres tragos tristes tragaban traguitos» 3 veces seguidas sin equivocarte.",
    0,
    1
  ),
  reto(
    "reto-peinado",
    "Estilista de Gym",
    "Deja que el rival te haga un peinado nuevo con los dedos (10 segundos).",
    0,
    1
  ),
  reto(
    "reto-sirena",
    "Llamado de Wailord",
    "Imita la llamada de sirena de Wailord: un grito agudo y largo.",
    0,
    1
  ),
  reto(
    "reto-cine",
    "Noche de Estreno",
    "Nombra 3 películas y su actor principal en 15 segundos.",
    3,
    0
  ),
  reto(
    "reto-plancha",
    "Plancha de Machoke",
    "Aguanta en plancha 20 segundos.",
    3,
    0
  ),
  reto(
    "reto-cumplidos",
    "Amistad Pokémon",
    "Di 3 cumplidos sinceros al rival.",
    0,
    1
  ),
  reto(
    "reto-selfie",
    "Portada de Novela",
    "Haz una selfie dramática estilo portada de novela y enséñasela al rival.",
    0,
    1
  ),
  reto(
    "reto-tiempo",
    "Informe del Tiempo",
    "Presenta el tiempo en la tele: hoy llueven cubatas sobre Hoenn.",
    3,
    0
  ),
  reto(
    "reto-caminar",
    "Pasarela Pokémon",
    "Imita cómo caminaría tu Pokémon activo por la sala.",
    0,
    1
  ),
  reto(
    "reto-color",
    "Color Favorito",
    "Adivina el color favorito del rival; tienes 2 intentos.",
    0,
    1
  ),
  reto(
    "reto-oscar",
    "Discurso del Óscar",
    "Da las gracias al rival por el cubata como si ganaras un Óscar.",
    3,
    0
  ),
];
