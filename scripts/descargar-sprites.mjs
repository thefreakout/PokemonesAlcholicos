#!/usr/bin/env node
/**
 * Descarga los sprites (imágenes) de los 30 Pokémon de Hoenn desde PokeAPI
 * (https://pokeapi.co) y guarda una copia local en public/sprites/.
 *
 * Uso:  npm run sprites
 * (Solo hace falta ejecutarlo una vez con conexión a internet;
 *  los sprites ya vienen incluidos en el repositorio.)
 */

import { writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const API = "https://pokeapi.co/api/v2/pokemon";
const DESTINO = path.join(process.cwd(), "public", "sprites");

// Los 30 Pokémon del catálogo (ids en inglés, como los usa PokeAPI)
const POKEMON = [
  "sceptile", "blaziken", "swampert", "gardevoir", "aggron",
  "salamence", "milotic", "flygon", "manectric", "banette",
  "slaking", "sharpedo", "altaria", "metagross", "breloom",
  "crawdaunt", "shiftry", "camerupt", "wailord", "walrein",
  "glalie", "claydol", "cradily", "armaldo", "zangoose",
  "seviper", "absol", "ludicolo", "shedinja", "dusclops",
];

async function principal() {
  await mkdir(DESTINO, { recursive: true });
  const yaDescargados = new Set(await readdir(DESTINO));

  let nuevas = 0;
  for (const nombre of POKEMON) {
    const archivo = `${nombre}.png`;
    if (yaDescargados.has(archivo)) {
      console.log(`· ${nombre}: ya está descargado`);
      continue;
    }

    const respuesta = await fetch(`${API}/${nombre}`);
    if (!respuesta.ok) {
      console.error(`✗ ${nombre}: PokeAPI respondió ${respuesta.status}`);
      continue;
    }
    const datos = await respuesta.json();

    // Se prefiere el arte oficial (más bonito para las cartas) y,
    // si no lo hay, el sprite clásico del juego.
    const urlSprite =
      datos.sprites?.other?.["official-artwork"]?.front_default ??
      datos.sprites?.front_default;

    if (!urlSprite) {
      console.error(`✗ ${nombre}: PokeAPI no devuelve sprite`);
      continue;
    }

    const respuestaImagen = await fetch(urlSprite);
    if (!respuestaImagen.ok) {
      console.error(`✗ ${nombre}: no se pudo descargar la imagen (${respuestaImagen.status})`);
      continue;
    }
    const bufer = Buffer.from(await respuestaImagen.arrayBuffer());
    const ruta = path.join(DESTINO, archivo);
    await writeFile(ruta, bufer);

    // Reducción de tamaño (si está disponible la herramienta sips de macOS)
    try {
      execFileSync("sips", ["-Z", "256", ruta], { stdio: "ignore" });
    } catch {
      // En otros sistemas se queda el tamaño original; no pasa nada.
    }

    nuevas += 1;
    console.log(`✓ ${nombre} (#${datos.id}) guardado en public/sprites/${archivo}`);
  }

  console.log(`\nListo: ${nuevas} sprites nuevos. Total esperado: ${POKEMON.length}.`);
  if (!existsSync(DESTINO) || nuevas === 0 && yaDescargados.size === 0) {
    console.error("No se descargó ninguno: revisa tu conexión a internet.");
    process.exit(1);
  }
}

principal().catch((error) => {
  console.error("Error al descargar sprites:", error);
  process.exit(1);
});
