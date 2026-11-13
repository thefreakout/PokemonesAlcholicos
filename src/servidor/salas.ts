/**
 * Almacén de salas EN MEMORIA (sin base de datos en esta fase).
 *
 * La persistencia está preparada para añadirse después: cualquier otro
 * almacén (Redis, SQLite, Prisma…) solo tiene que implementar la interfaz
 * `AlmacenSalas` y sustituir a `almacenEnMemoria` en src/servidor/comunicacion.ts.
 */

import type { Sala } from "./tipos-internos";
import { VALORES } from "../config/valores";
import { ErrorDeJuego } from "./tipos-internos";

/** Contrato mínimo que cumplirá un futuro almacén persistente. */
export interface AlmacenSalas {
  obtener(codigo: string): Sala | undefined;
  guardar(sala: Sala): void;
  eliminar(codigo: string): void;
  todas(): Sala[];
}

/** Implementación en memoria. */
export class AlmacenEnMemoria implements AlmacenSalas {
  private salas = new Map<string, Sala>();

  obtener(codigo: string): Sala | undefined {
    return this.salas.get(codigo);
  }

  guardar(sala: Sala): void {
    this.salas.set(sala.codigo, sala);
  }

  eliminar(codigo: string): void {
    this.salas.delete(codigo);
  }

  todas(): Sala[] {
    return [...this.salas.values()];
  }
}

/** Instancia única del almacén para el proceso del servidor. */
export const almacenEnMemoria: AlmacenSalas = new AlmacenEnMemoria();

// Sin vocales (ni 0 ni 1) para evitar códigos ambiguos o poco legibles
// y para que ninguna sala pueda generarse con el código reservado «CREAR».
const ALFABETO_CODIGO = "BCDFGHJKLMNPQRSTVWXYZ23456789";

/** Genera un código de sala aleatorio (p. ej. "K7R2M") sin letras ambiguas. */
export function generarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < VALORES.codigoSalaLongitud; i++) {
    codigo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  }
  return codigo;
}

/** Crea un código nuevo que no choque con las salas existentes (con tope de salas). */
export function generarCodigoLibre(): string {
  if (almacenEnMemoria.todas().length >= VALORES.maxSalasActivas) {
    throw new ErrorDeJuego(
      "El servidor está lleno ahora mismo. Inténtalo de nuevo en unos minutos.",
      "servidor-lleno"
    );
  }
  let codigo = "";
  do {
    codigo = generarCodigo();
  } while (almacenEnMemoria.obtener(codigo));
  return codigo;
}

/**
 * Limpieza periódica: borra salas inactivas para que la memoria no crezca
 * sin control. Se llama desde el temporizador global del servidor.
 */
export function limpiarSalasAntiguas(): void {
  const limite = Date.now() - VALORES.limpiezaSalaMinutos * 60 * 1000;
  for (const sala of almacenEnMemoria.todas()) {
    if (sala.ultimaActividad < limite) {
      almacenEnMemoria.eliminar(sala.codigo);
    }
  }
}
