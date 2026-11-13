/**
 * Generación de vistas: cada cliente recibe una versión personalizada del
 * estado de la sala. El contenido de la mano del rival nunca sale del servidor.
 */

import { POKEMON_POR_ID } from "../datos/pokemon";
import { VALORES } from "../config/valores";
import type { CartaAtaque, VistaEstado, VistaPokemon, VistaPropia, VistaRival } from "./tipos";
import type { Jugador, Sala } from "../servidor/tipos-internos";

/** Convierte un Pokémon en juego a su vista pública. */
function vistaPokemon(datosId: string, hpActual: number, incluirAtaques = false): VistaPokemon {
  const datos = POKEMON_POR_ID[datosId];
  const vista: VistaPokemon = {
    id: datos.id,
    nombre: datos.nombre,
    tipos: datos.tipos,
    sprite: datos.sprite,
    hpMax: datos.hp,
    hpActual,
    debilitado: hpActual <= 0,
  };
  if (incluirAtaques) {
    vista.ataques = datos.ataques;
  }
  return vista;
}

/** Datos comunes de un jugador en fase de elección (sala). */
function vistaEquipo(jugador: Jugador): VistaPokemon[] {
  return jugador.equipo.map((p) => vistaPokemon(p.datosId, p.hpActual));
}

/** Vista completa de uno mismo. */
function vistaPropia(jugador: Jugador): VistaPropia {
  const activo = jugador.equipo[jugador.activo];
  const ataquesActivo: CartaAtaque[] = activo ? POKEMON_POR_ID[activo.datosId].ataques : [];
  return {
    id: jugador.id,
    apodo: jugador.apodo,
    color: jugador.color,
    conectado: jugador.socketId !== null,
    listo: jugador.listo,
    seleccion: jugador.seleccion,
    equipo: vistaEquipo(jugador),
    activo: jugador.activo,
    mano: {
      ataque: ataquesActivo,
      tragos: jugador.mano.tragos,
      defensa: jugador.mano.defensa,
      retos: jugador.mano.retos,
    },
    pendientes: jugador.pendientes,
    tragosConfirmados: jugador.tragosConfirmados,
    chupitosConfirmados: jugador.chupitosConfirmados,
    regeneracionUsada: jugador.regeneracionUsos >= VALORES.regeneracionUsosPorPartida,
    saltarProximoTurno: jugador.saltarProximoTurno,
    atacoEsteTurno: jugador.ataquesEsteTurno >= VALORES.ataquesPorTurno,
    roboEsteTurno: jugador.robosEsteTurno >= VALORES.robosPorTurno,
    retoJugadoEsteTurno: jugador.retosEsteTurno >= VALORES.retosPorTurno,
  };
}

/** Vista pública del rival (sin el contenido de su mano). */
function vistaRival(jugador: Jugador): VistaRival {
  return {
    id: jugador.id,
    apodo: jugador.apodo,
    color: jugador.color,
    conectado: jugador.socketId !== null,
    listo: jugador.listo,
    seleccionCount: jugador.seleccion.length,
    equipo: vistaEquipo(jugador),
    activo: jugador.activo,
    manoCuentas: {
      ataque: jugador.equipo[jugador.activo] ? POKEMON_POR_ID[jugador.equipo[jugador.activo].datosId].ataques.length : 0,
      tragos: jugador.mano.tragos.length,
      defensa: jugador.mano.defensa.length,
      retos: jugador.mano.retos.length,
    },
    pendientes: jugador.pendientes,
    tragosConfirmados: jugador.tragosConfirmados,
    chupitosConfirmados: jugador.chupitosConfirmados,
    regeneracionUsada: jugador.regeneracionUsos >= VALORES.regeneracionUsosPorPartida,
    saltarProximoTurno: jugador.saltarProximoTurno,
  };
}

/** Construye la vista personalizada del estado de la sala para un cliente. */
export function vistaPara(sala: Sala, jugadorId: string | null): VistaEstado {
  const propio = jugadorId ? sala.jugadores.find((j) => j.id === jugadorId) : undefined;
  const rival = jugadorId ? sala.jugadores.find((j) => j.id !== jugadorId) : undefined;

  return {
    codigo: sala.codigo,
    estadoSala: sala.estadoSala,
    miId: propio?.id ?? null,
    miToken: propio?.tokenSecreto ?? null,
    turnoDe: sala.turnoDe,
    faseTurno: sala.faseTurno,
    jugadorCambiando: sala.jugadorCambiando,
    reto: sala.reto
      ? {
          carta: sala.reto.carta,
          terminaEn: sala.reto.terminaEn,
          lanzadoPor: sala.reto.lanzadoPor,
          objetivo: sala.reto.objetivo,
        }
      : null,
    ultimoDado: sala.ultimoDado,
    tu: propio ? vistaPropia(propio) : null,
    rival: rival ? vistaRival(rival) : null,
    registro: sala.registro,
    ganador: sala.ganador,
    motivoFin: sala.motivoFin,
  };
}

/** Ayuda para la UI: colores por tipo de Pokémon (paleta clásica). */
export const COLORES_TIPO: Record<string, string> = {
  Planta: "#78C850",
  Fuego: "#F08030",
  Agua: "#6890F0",
  Eléctrico: "#F8D030",
  Psíquico: "#F85888",
  Hada: "#EE99AC",
  Acero: "#B8B8D0",
  Roca: "#B8A038",
  Dragón: "#7038F8",
  Volador: "#A890F0",
  Lucha: "#C03028",
  Fantasma: "#705898",
  Siniestro: "#705848",
  Hielo: "#98D8D8",
  Normal: "#A8A878",
  Veneno: "#A040A0",
  Bicho: "#A8B820",
  Tierra: "#E0C068",
};

/** Descripción legible de una carta de ataque (única fuente de verdad: los datos). */
export function descripcionAtaque(carta: CartaAtaque): string {
  const partes: string[] = [`${carta.danio} de daño`];
  if (carta.bebida.modo === "dado") {
    partes.push("el rival bebe según la tabla del dado");
  } else {
    const bebida = carta.bebida;
    const cantidad: string[] = [];
    if (bebida.tragos > 0) cantidad.push(`${bebida.tragos} trago${bebida.tragos === 1 ? "" : "s"}`);
    if (bebida.chupitos > 0) cantidad.push(`${bebida.chupitos} chupito${bebida.chupitos === 1 ? "" : "s"}`);
    const bebidaTexto = cantidad.length > 0 ? cantidad.join(" y ") : "sin bebida";
    if (bebida.objetivo === "rival") partes.push(`el rival bebe ${bebidaTexto}`);
    else if (bebida.objetivo === "atacante") partes.push(`tú bebes ${bebidaTexto}`);
    else partes.push(`todos beben ${bebidaTexto}`);
  }
  if (carta.curacion) partes.push(`recuperas ${carta.curacion} HP`);
  if (carta.saltarTurnoRival) partes.push("el rival pierde su próximo turno");
  if (carta.saltarTurnoPropio) partes.push("tú pierdes tu próximo turno");
  if (carta.fuerzaReto) partes.push("el rival resuelve una carta de reto");
  const filaFallo = VALORES.dado.find((f) => f.fallo);
  if (carta.bebida.modo === "dado" && filaFallo) {
    partes.push(`si sale ${filaFallo.tirada}, fallo: bebes tú`);
  }
  return partes.join(" · ");
}

