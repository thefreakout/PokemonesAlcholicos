#!/usr/bin/env node
/**
 * Genera los iconos PNG de la PWA (192, 512, maskable y apple-touch)
 * dibujando una Pokéball píxel a píxel, sin dependencias externas.
 *
 * Uso:  npm run iconos
 */

import { deflateSync } from "node:zlib";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DESTINO = path.join(process.cwd(), "public", "iconos");

/* ─────────── Codificación PNG mínima (IHDR + IDAT + IEND) ─────────── */

let tablaCRC = null;
function crc32(bufer) {
  if (!tablaCRC) {
    tablaCRC = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tablaCRC[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (const byte of bufer) crc = tablaCRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function trozoPNG(tipo, datos) {
  const longitud = Buffer.alloc(4);
  longitud.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([longitud, cuerpo, crc]);
}

/** Escribe un PNG RGBA desde una matriz de píxeles [r, g, b, a]. */
function escribirPNG(ruta, tamano, pixeles) {
  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(tamano, 0);
  cabecera.writeUInt32BE(tamano, 4);
  cabecera[8] = 8; // profundidad de bits
  cabecera[9] = 6; // color RGBA
  const scanlines = Buffer.alloc(tamano * (tamano * 4 + 1));
  let indice = 0;
  for (let y = 0; y < tamano; y++) {
    scanlines[indice++] = 0; // filtro: ninguno
    for (let x = 0; x < tamano; x++) {
      const [r, g, b, a] = pixeles[y * tamano + x];
      scanlines[indice++] = r;
      scanlines[indice++] = g;
      scanlines[indice++] = b;
      scanlines[indice++] = a;
    }
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozoPNG("IHDR", cabecera),
    trozoPNG("IDAT", deflateSync(scanlines)),
    trozoPNG("IEND", Buffer.alloc(0)),
  ]);
  return writeFile(ruta, png);
}

/* ─────────────── Dibujo de la Pokéball píxel a píxel ─────────────── */

const ROJO = [227, 53, 13, 255];
const BLANCO = [255, 255, 255, 255];
const NEGRO = [31, 41, 55, 255]; // gris muy oscuro con borde
const GRIS = [229, 231, 235, 255];
const TRANSPARENTE = [0, 0, 0, 0];

/**
 * Dibuja una Pokéball. `escala` es el tamaño relativo de la bola dentro
 * del lienzo (los iconos «maskable» la hacen más pequeña y con fondo).
 */
function dibujarPokaball(tamano, escala, fondo) {
  const pixeles = new Array(tamano * tamano);
  const centro = tamano / 2;
  const radio = (tamano / 2) * escala;
  const radioBoton = radio * 0.32;

  for (let y = 0; y < tamano; y++) {
    for (let x = 0; x < tamano; x++) {
      const distancia = Math.hypot(x + 0.5 - centro, y + 0.5 - centro);
      let color = TRANSPARENTE;

      if (distancia <= radio) {
        if (distancia > radio - tamano * 0.025) {
          color = NEGRO; // borde exterior
        } else if (distancia <= radioBoton) {
          color = distancia > radioBoton - tamano * 0.015 ? NEGRO : GRIS; // botón central
        } else if (Math.abs(y + 0.5 - centro) <= tamano * 0.03) {
          color = NEGRO; // banda horizontal
        } else if (y < centro) {
          color = ROJO; // mitad superior
        } else {
          color = BLANCO; // mitad inferior
        }
      } else if (fondo) {
        color = fondo; // icono maskable: fondo opaco fuera de la bola
      }
      pixeles[y * tamano + x] = color;
    }
  }
  return pixeles;
}

async function principal() {
  await mkdir(DESTINO, { recursive: true });
  const fondoRojo = [158, 35, 10, 255]; // fondo opaco para el icono maskable

  await escribirPNG(path.join(DESTINO, "icono-192.png"), 192, dibujarPokaball(192, 0.94, null));
  await escribirPNG(path.join(DESTINO, "icono-512.png"), 512, dibujarPokaball(512, 0.94, null));
  await escribirPNG(path.join(DESTINO, "maskable-512.png"), 512, dibujarPokaball(512, 0.66, fondoRojo));
  await escribirPNG(path.join(DESTINO, "apple-touch-icon.png"), 180, dibujarPokaball(180, 0.94, fondoRojo));

  console.log("✓ Iconos generados en public/iconos/ (192, 512, maskable y apple-touch)");
}

principal().catch((error) => {
  console.error("Error al generar iconos:", error);
  process.exit(1);
});
