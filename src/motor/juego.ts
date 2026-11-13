/**
 * ──────────────────────────────────────────────────────────────────────────
 *  MOTOR DEL JUEGO (autoritativo, solo servidor)
 * ──────────────────────────────────────────────────────────────────────────
 *
 *  Toda la lógica de reglas vive aquí y NUNCA confía en el cliente:
 *  el cliente solo envía acciones y el motor valida cada una contra el
 *  estado real de la sala antes de aplicarla.
 *
 *  Las funciones mutan el estado de la sala y lanzan ErrorDeJuego con
 *  mensajes en español listos para mostrar al jugador si la acción no es válida.
 */

import { randomBytes } from "node:crypto";
import { VALORES } from "../config/valores";
import type { CartaEfecto, EntradaRegistro, EfectoCarta, NombreMazo } from "./tipos";
import { POKEMON_POR_ID } from "../datos/pokemon";
import { construirMazos, descartarCarta, mezclar, robarCarta } from "./mazos";
import {
  ErrorDeJuego,
  datosActivo,
  obtenerJugador,
  obtenerRival,
  type Jugador,
  type Sala,
} from "../servidor/tipos-internos";

let contadorIds = 0;

/** Genera un id único para pendientes, registro, cartas instanciadas, etc. */
function nuevoId(prefijo: string): string {
  contadorIds += 1;
  return `${prefijo}-${Date.now().toString(36)}-${contadorIds}`;
}

/** Añade una entrada al registro en vivo de la sala. */
function registrar(sala: Sala, tipo: EntradaRegistro["tipo"], texto: string): void {
  sala.registro.push({ id: nuevoId("reg"), momento: Date.now(), tipo, texto });
  if (sala.registro.length > VALORES.registroMaximo) {
    sala.registro = sala.registro.slice(-VALORES.registroMaximo);
  }
  sala.ultimaActividad = Date.now();
}

/* ────────────────────────── SALA: CREAR Y UNIRSE ───────────────────────── */

/** Crea un jugador con el perfil mínimo (apodo y color de avatar). */
export function crearJugador(apodo: string, color: string, socketId: string): Jugador {
  const apodoLimpio = apodo.trim().slice(0, 12);
  if (!apodoLimpio) {
    throw new ErrorDeJuego("Escribe un apodo para entrar.", "apodo-vacio");
  }
  return {
    id: nuevoId("jug"),
    // Token secreto: sin él nadie puede reconectarse a este asiento.
    tokenSecreto: randomBytes(24).toString("hex"),
    apodo: apodoLimpio,
    color,
    socketId,
    desconectadoDesde: null,
    listo: false,
    seleccion: [],
    equipo: [],
    activo: 0,
    mano: { tragos: [], defensa: [], retos: [] },
    pendientes: [],
    tragosConfirmados: 0,
    chupitosConfirmados: 0,
    regeneracionUsos: 0,
    saltarProximoTurno: false,
    ataquesEsteTurno: 0,
    robosEsteTurno: 0,
    retosEsteTurno: 0,
  };
}

/** Crea una sala nueva con su primer jugador (el creador). */
export function crearSala(codigo: string, jugador: Jugador): Sala {
  const sala: Sala = {
    codigo,
    estadoSala: "esperando",
    jugadores: [jugador],
    turnoDe: null,
    faseTurno: "accion",
    jugadorCambiando: null,
    reto: null,
    pausadaDesde: null,
    mazos: construirMazos(),
    registro: [],
    ganador: null,
    motivoFin: null,
    ultimoDado: null,
    creadaEn: Date.now(),
    ultimaActividad: Date.now(),
  };
  registrar(sala, "sistema", `${jugador.apodo} ha creado la sala. Esperando rival…`);
  return sala;
}

/** Une a un nuevo jugador a una sala existente. */
export function unirJugador(sala: Sala, jugador: Jugador): void {
  if (sala.jugadores.length >= 2) {
    throw new ErrorDeJuego("La sala está completa.", "sala-llena");
  }
  if (sala.estadoSala !== "esperando" && sala.estadoSala !== "eligiendo") {
    throw new ErrorDeJuego("La partida ya ha empezado.", "sala-en-juego");
  }
  sala.jugadores.push(jugador);
  sala.estadoSala = "eligiendo";
  registrar(sala, "sistema", `${jugador.apodo} se ha unido a la sala. ¡A elegir equipo!`);
}

/** Reenlaza un socket a un jugador que se reconecta (exige su token secreto). */
export function reconectarJugador(
  sala: Sala,
  jugadorId: string,
  token: string,
  socketId: string
): Jugador {
  const jugador = obtenerJugador(sala, jugadorId);
  if (!token || token !== jugador.tokenSecreto) {
    throw new ErrorDeJuego("Tu sesión ya no es válida en esta sala.", "sesion-invalida");
  }
  jugador.socketId = socketId;
  const estabaPausada = sala.estadoSala === "pausada";
  jugador.desconectadoDesde = null;
  registrar(sala, "sistema", `${jugador.apodo} se ha reconectado.`);
  if (estabaPausada && sala.jugadores.every((j) => j.socketId !== null)) {
    reanudarTrasPausa(sala);
  }
  return jugador;
}

/** Pausa la sala si alguien lleva demasiado tiempo desconectado. Devuelve true si se ha pausado. */
export function pausarSiDesconectado(sala: Sala, segundosDesconexion: number): boolean {
  if (sala.estadoSala !== "jugando") return false;
  const caido = sala.jugadores.find((j) => j.desconectadoDesde !== null);
  if (caido && Date.now() - caido.desconectadoDesde! > segundosDesconexion * 1000) {
    sala.estadoSala = "pausada";
    sala.pausadaDesde = Date.now();
    registrar(sala, "sistema", `Partida en pausa: esperando a que ${caido.apodo} vuelva…`);
    return true;
  }
  return false;
}

function reanudarTrasPausa(sala: Sala): void {
  sala.estadoSala = "jugando";
  // El plazo de un reto en curso se extiende por el tiempo REAL de pausa.
  const duracionPausa = sala.pausadaDesde ? Date.now() - sala.pausadaDesde : 0;
  if (sala.reto) {
    sala.reto.terminaEn += duracionPausa;
  }
  sala.pausadaDesde = null;
  registrar(sala, "sistema", "¡La partida continúa!");
}

/* ─────────────────────── SALA: ELECCIÓN DE EQUIPO ──────────────────────── */

/** Guarda la elección de equipo: 1 Pokémon activo y 2 de reserva. */
export function seleccionarEquipo(sala: Sala, jugadorId: string, pokemonIds: string[]): void {
  const jugador = obtenerJugador(sala, jugadorId);
  if (sala.estadoSala !== "eligiendo" && sala.estadoSala !== "esperando") {
    throw new ErrorDeJuego("Solo puedes elegir equipo antes de empezar.");
  }
  // La UI puede enviar una lista vacía al montar (selección borrada): se acepta.
  if (pokemonIds.length !== 0 && (pokemonIds.length !== 3 || new Set(pokemonIds).size !== 3)) {
    throw new ErrorDeJuego("Elige 1 Pokémon activo y 2 de reserva (3 distintos).");
  }
  for (const id of pokemonIds) {
    if (!POKEMON_POR_ID[id]) {
      throw new ErrorDeJuego("Has elegido un Pokémon que no existe.");
    }
  }
  // Selección idéntica (misma posición): no-op total, sin desmarcar el «Listo».
  // Evita el eco UI↔servidor y las carreras que deshacían el Listo.
  const identica =
    jugador.seleccion.length === pokemonIds.length &&
    jugador.seleccion.every((id, i) => id === pokemonIds[i]);
  if (identica) {
    return;
  }
  jugador.seleccion = pokemonIds;
  jugador.listo = false;
  sala.ultimaActividad = Date.now();
}

/** Marca al jugador como listo; si los dos lo están, empieza la partida. */
export function marcarListo(sala: Sala, jugadorId: string, listo: boolean): void {
  const jugador = obtenerJugador(sala, jugadorId);
  if (sala.estadoSala !== "eligiendo") {
    throw new ErrorDeJuego("La sala no está en fase de elección.");
  }
  if (listo && jugador.seleccion.length !== 3) {
    throw new ErrorDeJuego("Elige tu equipo antes de pulsar Listo.");
  }
  jugador.listo = listo;
  if (sala.jugadores.length === 2 && sala.jugadores.every((j) => j.listo)) {
    iniciarPartida(sala);
  }
}

/** Prepara la partida: equipos, mazos, manos iniciales y primer turno al azar. */
function iniciarPartida(sala: Sala): void {
  sala.estadoSala = "jugando";
  sala.mazos = construirMazos();
  sala.ganador = null;
  sala.motivoFin = null;
  sala.reto = null;
  sala.jugadorCambiando = null;
  sala.registro = [];

  for (const jugador of sala.jugadores) {
    jugador.equipo = jugador.seleccion.map((datosId) => ({ datosId, hpActual: POKEMON_POR_ID[datosId].hp }));
    jugador.activo = 0;
    jugador.mano = { tragos: [], defensa: [], retos: [] };
    jugador.pendientes = [];
    jugador.tragosConfirmados = 0;
    jugador.chupitosConfirmados = 0;
    jugador.regeneracionUsos = 0;
    jugador.saltarProximoTurno = false;
    jugador.ataquesEsteTurno = 0;
    jugador.robosEsteTurno = 0;
    jugador.retosEsteTurno = 0;

    // Cartas iniciales de los mazos comunes
    for (let i = 0; i < VALORES.cartasIniciales.tragos; i++) robarEnMano(sala, jugador, "tragos");
    for (let i = 0; i < VALORES.cartasIniciales.defensa; i++) robarEnMano(sala, jugador, "defensa");
    for (let i = 0; i < VALORES.cartasIniciales.retos; i++) robarEnMano(sala, jugador, "retos");
  }

  // El primer turno se sortea al azar
  const [a, b] = mezclar(sala.jugadores);
  sala.turnoDe = a.id;
  registrar(sala, "sistema", "¡Empieza la partida! Cada uno con su cubata delante.");
  registrar(sala, "turno", `El azar decide: ${a.apodo} juega primero.`);
}

/** Roba una carta de un mazo común y la mete en la mano del jugador. */
function robarEnMano(sala: Sala, jugador: Jugador, mazo: "tragos" | "defensa" | "retos"): void {
  const carta = robarCarta(sala.mazos, mazo);
  if (carta) {
    jugador.mano[mazo].push(carta);
  }
}

/* ────────────────────────────── ACCIONES ───────────────────────────────── */

/** Comprueba que es el turno del jugador y que está en fase de acción. */
function exigirTurnoYFaseAccion(sala: Sala, jugador: Jugador): void {
  if (sala.estadoSala !== "jugando") {
    throw new ErrorDeJuego("La partida no está en curso.");
  }
  if (sala.turnoDe !== jugador.id) {
    throw new ErrorDeJuego("No es tu turno.");
  }
  if (sala.faseTurno !== "accion") {
    throw new ErrorDeJuego("Ahora mismo no puedes jugar cartas.");
  }
}

/** Descripción legible de una bebida: «2 tragos y 1 chupito». */
export function textoBebida(tragos: number, chupitos: number): string {
  const partes: string[] = [];
  if (tragos > 0) partes.push(`${tragos} trago${tragos === 1 ? "" : "s"}`);
  if (chupitos > 0) partes.push(`${chupitos} chupito${chupitos === 1 ? "" : "s"}`);
  return partes.length > 0 ? partes.join(" y ") : "nada";
}

/** Crea (o acumula) los tragos pendientes de confirmar de un jugador. */
function asignarBebida(
  jugador: Jugador,
  tragos: number,
  chupitos: number,
  motivo: string,
  origen: "ataque" | "otro"
): void {
  if (tragos <= 0 && chupitos <= 0) return;
  jugador.pendientes.push({ id: nuevoId("pend"), tragos, chupitos, motivo, origen });
}

/* ······························ MAZO 1: ATAQUE ··························· */

/**
 * Juega una carta de ataque del Pokémon activo y lanza el dado de 6 caras.
 * Decisión de diseño («cartas con carácter»): el daño total es el daño base
 * de la carta más el daño de la tabla del dado; la bebida sale de la tabla
 * del dado o de la propia carta si trae una fija. La tirada 6 es fallo:
 * 0 de daño y bebe el atacante.
 *
 * `tiradaForzada` existe solo para las pruebas automáticas del motor.
 */
export function atacar(
  sala: Sala,
  jugadorId: string,
  cartaId: string,
  tiradaForzada?: number
): void {
  const atacante = obtenerJugador(sala, jugadorId);
  exigirTurnoYFaseAccion(sala, atacante);

  if (atacante.ataquesEsteTurno >= VALORES.ataquesPorTurno) {
    throw new ErrorDeJuego("Ya has usado tus ataques de este turno.");
  }

  const miActivo = datosActivo(atacante);
  const carta = miActivo.ataques.find((a) => a.id === cartaId);
  if (!carta) {
    throw new ErrorDeJuego("Esa carta de ataque no es de tu Pokémon activo.");
  }

  const rival = obtenerRival(sala, atacante);
  const rivalActivo = datosActivo(rival);

  // El servidor lanza el dado (el cliente solo lo anima)
  const tirada = tiradaForzada ?? 1 + Math.floor(Math.random() * VALORES.dado.length);
  const filaDado = VALORES.dado[tirada - 1];
  // Un fallo (tirada 6) no hace daño ninguno, como marca la tabla del encargo.
  const danioTotal = filaDado.fallo ? 0 : carta.danio + filaDado.danio;

  atacante.ataquesEsteTurno += 1;

  // Daño al Pokémon activo del rival
  let debilitado = false;
  if (danioTotal > 0) {
    rivalActivo.enJuego.hpActual = Math.max(0, rivalActivo.enJuego.hpActual - danioTotal);
    debilitado = rivalActivo.enJuego.hpActual === 0;
  }

  registrar(
    sala,
    "ataque",
    `${atacante.apodo} lanza ${carta.nombre}: ${danioTotal} de daño a ${rivalActivo.nombre}.`
  );

  // Bebida de la carta: según la tabla del dado o fija (siempre origen «ataque»,
  // porque responde al ataque recibido y permite jugar la Poción como respuesta).
  if (filaDado.fallo) {
    asignarBebida(atacante, filaDado.tragos, filaDado.chupitos, "Fallo del dado", "ataque");
    registrar(sala, "dado", `El dado saca ${tirada}: ¡fallo total! ${atacante.apodo} bebe ${textoBebida(filaDado.tragos, filaDado.chupitos)}.`);
  } else if (carta.bebida.modo === "dado") {
    asignarBebida(rival, filaDado.tragos, filaDado.chupitos, `Dado ${tirada}`, "ataque");
    registrar(sala, "dado", `El dado saca ${tirada}: ${rival.apodo} bebe ${textoBebida(filaDado.tragos, filaDado.chupitos)}.`);
  } else {
    const bebida = carta.bebida;
    const objetivos =
      bebida.objetivo === "rival"
        ? [rival]
        : bebida.objetivo === "atacante"
          ? [atacante]
          : [atacante, rival];
    for (const objetivo of objetivos) {
      asignarBebida(objetivo, bebida.tragos, bebida.chupitos, carta.nombre, "ataque");
    }
    const quien = bebida.objetivo === "rival" ? `${rival.apodo} bebe` : bebida.objetivo === "atacante" ? `${atacante.apodo} bebe` : "Todos beben";
    registrar(sala, "bebida", `${quien} ${textoBebida(bebida.tragos, bebida.chupitos)} por ${carta.nombre}.`);
  }

  sala.ultimoDado = {
    valor: tirada,
    texto: `${carta.nombre} · dado ${tirada} · ${danioTotal} de daño`,
    momento: Date.now(),
  };

  // Efectos extra de la carta (decisión de diseño «cartas con carácter»)
  if (carta.curacion && miActivo.enJuego.hpActual > 0) {
    miActivo.enJuego.hpActual = Math.min(miActivo.hpMax, miActivo.enJuego.hpActual + carta.curacion);
    registrar(sala, "defensa", `${miActivo.nombre} recupera ${carta.curacion} HP.`);
  }
  if (carta.saltarTurnoPropio) {
    atacante.saltarProximoTurno = true;
    registrar(sala, "sistema", `${atacante.apodo} pierde su próximo turno (aguanta el golpe).`);
  }
  if (carta.saltarTurnoRival) {
    rival.saltarProximoTurno = true;
    registrar(sala, "sistema", `${rival.apodo} pierde su próximo turno.`);
  }

  // Reto integrado en la carta (p. ej. Maldición de Banette)
  if (carta.fuerzaReto) {
    lanzarReto(sala, atacante, true);
  }

  // ¿Se ha debilitado el Pokémon rival?
  if (debilitado) {
    gestionarDebilitado(sala, rival, rivalActivo.nombre);
  }
}

/** Gestiona la caída de un Pokémon: cambio de activo o fin de la partida. */
function gestionarDebilitado(sala: Sala, jugadorAfectado: Jugador, nombrePokemon: string): void {
  registrar(sala, "cambio", `${nombrePokemon} se ha debilitado.`);
  // Si había un reto en curso (p. ej. por una Maldición de Banette), se cancela:
  // quien debía resolverlo acaba de perder su Pokémon.
  if (sala.reto) {
    sala.reto = null;
    registrar(sala, "reto", "El reto se cancela: el Pokémon del retado se ha debilitado.");
  }
  const quedanVivos = jugadorAfectado.equipo.some((p) => p.hpActual > 0);
  if (!quedanVivos) {
    const rivalDelAfectado = sala.jugadores.find((j) => j.id !== jugadorAfectado.id)!;
    finalizarPartida(sala, rivalDelAfectado.id, `${jugadorAfectado.apodo} se queda sin Pokémon. ¡Debe terminarse su cubata!`);
  } else {
    sala.faseTurno = "cambio";
    sala.jugadorCambiando = jugadorAfectado.id;
    registrar(sala, "cambio", `${jugadorAfectado.apodo} debe elegir un Pokémon de reserva.`);
  }
}

/** Termina la partida con un ganador y su motivo. */
function finalizarPartida(sala: Sala, ganadorId: string, motivo: string): void {
  sala.estadoSala = "finalizada";
  sala.ganador = ganadorId;
  sala.motivoFin = motivo;
  sala.reto = null;
  registrar(sala, "fin", `¡Fin de la partida! ${motivo}`);
}

/* ······················· ROBAR CARTA DE MAZO COMÚN ······················· */

/** Roba 1 carta de uno de los mazos comunes (límite por turno). */
export function robarDeMazo(sala: Sala, jugadorId: string, mazo: "tragos" | "defensa" | "retos"): void {
  const jugador = obtenerJugador(sala, jugadorId);
  exigirTurnoYFaseAccion(sala, jugador);
  if (jugador.robosEsteTurno >= VALORES.robosPorTurno) {
    throw new ErrorDeJuego("Ya has robado carta este turno.");
  }
  const totalMano = jugador.mano.tragos.length + jugador.mano.defensa.length + jugador.mano.retos.length;
  if (totalMano >= VALORES.tamanoMaximoMano) {
    throw new ErrorDeJuego("Tu mano está llena.");
  }
  const carta = robarCarta(sala.mazos, mazo);
  if (!carta) {
    throw new ErrorDeJuego("Ese mazo está vacío.");
  }
  jugador.mano[mazo].push(carta);
  jugador.robosEsteTurno += 1;
  registrar(sala, "sistema", `${jugador.apodo} roba una carta del mazo ${nombreMazoBonito(mazo)}.`);
}

function nombreMazoBonito(mazo: NombreMazo): string {
  switch (mazo) {
    case "tragos":
      return "de tragos y chupitos";
    case "defensa":
      return "de defensa";
    case "retos":
      return "de retos";
    default:
      return "de ataque";
  }
}

/* ····················· MAZOS 2, 3 Y 4: JUGAR CARTAS ······················ */

/** Juega una carta de la mano (tragos, defensa o retos). */
export function jugarCarta(
  sala: Sala,
  jugadorId: string,
  cartaId: string,
  objetivoId?: string
): void {
  const jugador = obtenerJugador(sala, jugadorId);
  exigirTurnoYFaseAccion(sala, jugador);

  let carta: CartaEfecto | undefined;
  let mazoCarta: "tragos" | "defensa" | "retos" | undefined;
  for (const mazo of ["tragos", "defensa", "retos"] as const) {
    const encontrada = jugador.mano[mazo].find((c) => c.id === cartaId);
    if (encontrada) {
      carta = encontrada;
      mazoCarta = mazo;
      break;
    }
  }
  if (!carta || !mazoCarta) {
    throw new ErrorDeJuego("No tienes esa carta en la mano.");
  }

  const rival = obtenerRival(sala, jugador);

  switch (carta.efecto.tipo) {
    case "bebida":
      jugarCartaBebida(sala, jugador, rival, carta, objetivoId);
      break;
    case "pocion":
      jugarPocionEnTurno(sala, jugador, carta);
      break;
    case "regeneracion":
      jugarRegeneracion(sala, jugador, carta);
      break;
    case "reto":
      jugarCartaReto(sala, jugador, rival, carta);
      break;
  }

  // La carta deja la mano y va al descarte
  jugador.mano[mazoCarta] = jugador.mano[mazoCarta].filter((c) => c.id !== cartaId);
  descartarCarta(sala.mazos, carta);
}

/** Mazo 2: carta de tragos y chupitos. */
function jugarCartaBebida(
  sala: Sala,
  jugador: Jugador,
  rival: Jugador,
  carta: CartaEfecto,
  objetivoId?: string
): void {
  const efecto = carta.efecto as Extract<EfectoCarta, { tipo: "bebida" }>;

  let objetivos: Jugador[];
  if (efecto.objetivo === "rival") {
    objetivos = [rival];
  } else if (efecto.objetivo === "yo") {
    objetivos = [jugador];
  } else if (efecto.objetivo === "todos") {
    objetivos = [jugador, rival];
  } else {
    // La carta «elige» requiere decidir a quién va la bebida
    if (objetivoId !== jugador.id && objetivoId !== rival.id) {
      throw new ErrorDeJuego("Elige quién bebe antes de jugar la carta.");
    }
    objetivos = [objetivoId === jugador.id ? jugador : rival];
  }

  for (const objetivo of objetivos) {
    asignarBebida(objetivo, efecto.tragos, efecto.chupitos, carta.nombre, "otro");
  }
  registrar(
    sala,
    "bebida",
    `${jugador.apodo} juega ${carta.nombre}: ${objetivos.map((o) => `${o.apodo} bebe ${textoBebida(efecto.tragos, efecto.chupitos)}`).join("; ")}.`
  );
}

/** Mazo 3: poción jugada en tu propio turno (restaura HP). */
function jugarPocionEnTurno(sala: Sala, jugador: Jugador, carta: CartaEfecto): void {
  const activo = datosActivo(jugador);
  if (activo.enJuego.hpActual <= 0) {
    throw new ErrorDeJuego("Tu Pokémon activo está debilitado.");
  }
  if (activo.enJuego.hpActual >= activo.hpMax) {
    throw new ErrorDeJuego("Tu Pokémon ya tiene toda la vida.");
  }
  activo.enJuego.hpActual = Math.min(activo.hpMax, activo.enJuego.hpActual + VALORES.pocionHP);
  registrar(
    sala,
    "defensa",
    `${jugador.apodo} juega ${carta.nombre}: ${activo.nombre} recupera HP (hasta ${activo.enJuego.hpActual}/${activo.hpMax}).`
  );
}

/** Mazo 3: regeneración (rellenas el cubata). Usos limitados por partida (config). */
function jugarRegeneracion(sala: Sala, jugador: Jugador, carta: CartaEfecto): void {
  if (jugador.regeneracionUsos >= VALORES.regeneracionUsosPorPartida) {
    throw new ErrorDeJuego("Ya has usado la Regeneración en esta partida.");
  }
  const totalPendientes = jugador.pendientes.reduce((suma, p) => suma + p.tragos + p.chupitos, 0);
  if (jugador.pendientes.length === 0 || totalPendientes === 0) {
    throw new ErrorDeJuego("No tienes tragos pendientes que anular.");
  }
  jugador.regeneracionUsos += 1;
  jugador.pendientes = [];
  registrar(
    sala,
    "defensa",
    `${jugador.apodo} juega ${carta.nombre}: «relleno el cubata». Se anulan ${totalPendientes} bebidas pendientes.`
  );
}

/** Mazo 4: carta de reto para el rival. */
function jugarCartaReto(
  sala: Sala,
  jugador: Jugador,
  rival: Jugador,
  carta: CartaEfecto
): void {
  lanzarReto(sala, jugador, false, carta, rival);
}

/**
 * Activa un reto sobre el rival (desde carta del mazo 4 o desde un ataque
 * como la Maldición de Banette). Roba una carta del mazo de retos si hace falta.
 */
function lanzarReto(
  sala: Sala,
  lanzador: Jugador,
  desdeAtaque: boolean,
  cartaReto?: CartaEfecto,
  rivalPreCalculado?: Jugador
): void {
  const rival = rivalPreCalculado ?? obtenerRival(sala, lanzador);
  if (sala.faseTurno === "reto") {
    throw new ErrorDeJuego("Ya hay un reto en curso.");
  }
  if (!desdeAtaque) {
    if (lanzador.retosEsteTurno >= VALORES.retosPorTurno) {
      throw new ErrorDeJuego("Solo puedes lanzar un reto por turno.");
    }
    lanzador.retosEsteTurno += 1;
  }

  let carta = cartaReto;
  if (!carta) {
    carta = robarCarta(sala.mazos, "retos") ?? undefined;
    if (!carta) {
      throw new ErrorDeJuego("El mazo de retos está vacío.");
    }
    descartarCarta(sala.mazos, carta);
  }

  sala.reto = {
    carta,
    terminaEn: Date.now() + VALORES.retoSegundos * 1000,
    lanzadoPor: lanzador.id,
    objetivo: rival.id,
  };
  sala.faseTurno = "reto";
  registrar(
    sala,
    "reto",
    `${lanzador.apodo} lanza el reto «${carta.nombre}» a ${rival.apodo}: ${carta.descripcion}`
  );
}

/** Mazo 3: poción jugada como respuesta a un ataque recibido (−1 trago). */
export function responderPocion(sala: Sala, jugadorId: string): void {
  const jugador = obtenerJugador(sala, jugadorId);
  if (sala.estadoSala !== "jugando") {
    throw new ErrorDeJuego("La partida no está en curso.");
  }
  const pocion = jugador.mano.defensa.find((c) => c.efecto.tipo === "pocion");
  if (!pocion) {
    throw new ErrorDeJuego("No tienes Poción en la mano.");
  }
  // Solo responde a un ATAQUE recibido (la bebida de origen «ataque»), como marca el encargo.
  const pendienteConTragos = jugador.pendientes.find((p) => p.origen === "ataque" && p.tragos > 0);
  if (!pendienteConTragos) {
    throw new ErrorDeJuego("La Poción de respuesta solo reduce tragos de un ataque recibido.");
  }

  pendienteConTragos.tragos -= VALORES.pocionRespuestaReduceTragos;
  if (pendienteConTragos.tragos <= 0 && pendienteConTragos.chupitos <= 0) {
    jugador.pendientes = jugador.pendientes.filter((p) => p.id !== pendienteConTragos.id);
  }
  jugador.mano.defensa = jugador.mano.defensa.filter((c) => c.id !== pocion.id);
  descartarCarta(sala.mazos, pocion);
  registrar(
    sala,
    "defensa",
    `${jugador.apodo} responde con ${pocion.nombre}: reduce ${VALORES.pocionRespuestaReduceTragos} trago del castigo.`
  );
}

/** Resuelve el reto en curso (el rival decide o expira el plazo). */
export function resolverReto(sala: Sala, jugadorId: string, cumplido: boolean, expirado = false): void {
  const jugador = obtenerJugador(sala, jugadorId);
  if (sala.estadoSala !== "jugando" || !sala.reto) {
    throw new ErrorDeJuego("No hay ningún reto en curso.");
  }
  if (jugador.id !== sala.reto.objetivo) {
    throw new ErrorDeJuego("El reto no es para ti.");
  }

  const reto = sala.reto;
  const efecto = reto.carta.efecto as Extract<EfectoCarta, { tipo: "reto" }>;

  if (!cumplido) {
    const motivo = expirado ? "Se acabó el tiempo" : "Reto no cumplido";
    asignarBebida(jugador, efecto.castigoTragos, efecto.castigoChupitos, reto.carta.nombre, "otro");
    registrar(
      sala,
      "reto",
      `${motivo}: ${jugador.apodo} bebe ${textoBebida(efecto.castigoTragos, efecto.castigoChupitos)}.`
    );
  } else {
    registrar(sala, "reto", `¡${jugador.apodo} cumple el reto! No bebe nada.`);
  }

  sala.reto = null;
  reanudarTrasReto(sala);
}

/** Comprueba si el plazo del reto ha expirado (lo llama el temporizador global). */
export function comprobarPlazoReto(sala: Sala): boolean {
  if (sala.estadoSala === "jugando" && sala.reto && Date.now() > sala.reto.terminaEn) {
    resolverReto(sala, sala.reto.objetivo, false, true);
    return true;
  }
  return false;
}

/** Vuelve a la fase que corresponda después de resolver un reto. */
function reanudarTrasReto(sala: Sala): void {
  // Si hay un cambio de Pokémon pendiente, ese paso manda; si no, se sigue jugando.
  sala.faseTurno = sala.jugadorCambiando ? "cambio" : "accion";
}

/* ·························· BEBIDA: CONFIRMAR ···························· */

/**
 * El contador de bebida es manual: el jugador confirma cuánto bebe de verdad
 * («Los bebo» a todo, o «Cuenta la mitad» perdonando la otra mitad).
 */
export function confirmarBebida(sala: Sala, jugadorId: string, modo: "todo" | "mitad"): void {
  const jugador = obtenerJugador(sala, jugadorId);
  if (jugador.pendientes.length === 0) {
    throw new ErrorDeJuego("No tienes tragos pendientes.");
  }

  let tragos = 0;
  let chupitos = 0;
  for (const pendiente of jugador.pendientes) {
    if (modo === "todo") {
      tragos += pendiente.tragos;
      chupitos += pendiente.chupitos;
    } else {
      // «Cuenta la mitad»: se divide (divisor configurable) redondeando hacia arriba.
      tragos += Math.ceil(pendiente.tragos / VALORES.divisorCuentaMitad);
      chupitos += Math.ceil(pendiente.chupitos / VALORES.divisorCuentaMitad);
    }
  }

  jugador.pendientes = [];
  jugador.tragosConfirmados += tragos;
  jugador.chupitosConfirmados += chupitos;

  const etiqueta = modo === "mitad" ? " (cuenta la mitad)" : "";
  registrar(
    sala,
    "bebida",
    `${jugador.apodo} confirma: se bebe ${textoBebida(tragos, chupitos)}${etiqueta}.`
  );
}

/* ····························· CAMBIO DE ACTIVO ·························· */

/** Tras la caída de un Pokémon, el jugador elige cuál de sus reservas sube. */
export function cambiarActivo(sala: Sala, jugadorId: string, indice: number): void {
  const jugador = obtenerJugador(sala, jugadorId);
  if (sala.estadoSala !== "jugando" || sala.faseTurno !== "cambio" || sala.jugadorCambiando !== jugador.id) {
    throw new ErrorDeJuego("No puedes cambiar de Pokémon ahora.");
  }
  const elegido = jugador.equipo[indice];
  if (!elegido) {
    throw new ErrorDeJuego("Ese Pokémon no está en tu equipo.");
  }
  if (elegido.hpActual <= 0) {
    throw new ErrorDeJuego("Ese Pokémon está debilitado; elige otro.");
  }
  jugador.activo = indice;
  sala.jugadorCambiando = null;
  sala.faseTurno = "accion";
  const datos = POKEMON_POR_ID[elegido.datosId];
  registrar(sala, "cambio", `${jugador.apodo} saca a ${datos.nombre}. ¡Al ruedo!`);
}

/* ······························· TURNO ··································· */

/** Pasa el turno al rival (salvo si tiene su turno saltado). */
export function terminarTurno(sala: Sala, jugadorId: string): void {
  const jugador = obtenerJugador(sala, jugadorId);
  if (sala.estadoSala !== "jugando") {
    throw new ErrorDeJuego("La partida no está en curso.");
  }
  if (sala.turnoDe !== jugador.id) {
    throw new ErrorDeJuego("No es tu turno.");
  }
  if (sala.faseTurno !== "accion") {
    throw new ErrorDeJuego("No puedes terminar el turno ahora.");
  }

  // Se limpian los contadores del turno que acaba (por si el mismo jugador
  // vuelve a jugar tras un salto de turno del rival).
  jugador.ataquesEsteTurno = 0;
  jugador.robosEsteTurno = 0;
  jugador.retosEsteTurno = 0;

  const rival = obtenerRival(sala, jugador);
  if (rival.saltarProximoTurno) {
    rival.saltarProximoTurno = false;
    registrar(sala, "turno", `${rival.apodo} pierde su turno. ¡Sigue jugando, ${jugador.apodo}!`);
  } else {
    sala.turnoDe = rival.id;
    registrar(sala, "turno", `Turno de ${rival.apodo}.`);
  }
  // El jugador que entra también empieza con sus contadores a cero.
  const nuevoJugador = obtenerJugador(sala, sala.turnoDe!);
  nuevoJugador.ataquesEsteTurno = 0;
  nuevoJugador.robosEsteTurno = 0;
  nuevoJugador.retosEsteTurno = 0;
  sala.faseTurno = "accion";
}

/* ······················· RENDIRSE Y NUEVA PARTIDA ························ */

/** Un jugador se rinde: pierde y gana el rival. */
export function rendirse(sala: Sala, jugadorId: string): void {
  const jugador = obtenerJugador(sala, jugadorId);
  if (sala.estadoSala !== "jugando" && sala.estadoSala !== "pausada") {
    throw new ErrorDeJuego("La partida no está en curso.");
  }
  const rival = obtenerRival(sala, jugador);
  finalizarPartida(sala, rival.id, `${jugador.apodo} se ha rendido. Debe terminarse su cubata.`);
}

/** Nueva partida: vuelve a la elección de equipo con los mismos jugadores. */
export function nuevaPartida(sala: Sala): void {
  if (sala.estadoSala !== "finalizada") {
    throw new ErrorDeJuego("La partida aún no ha terminado.");
  }
  sala.estadoSala = "eligiendo";
  sala.turnoDe = null;
  sala.faseTurno = "accion";
  sala.jugadorCambiando = null;
  sala.reto = null;
  sala.mazos = construirMazos();
  sala.ganador = null;
  sala.motivoFin = null;
  sala.ultimoDado = null;
  sala.registro = [];
  for (const jugador of sala.jugadores) {
    jugador.listo = false;
    jugador.seleccion = [];
    jugador.equipo = [];
    jugador.activo = 0;
    jugador.mano = { tragos: [], defensa: [], retos: [] };
    jugador.pendientes = [];
    jugador.tragosConfirmados = 0;
    jugador.chupitosConfirmados = 0;
    jugador.regeneracionUsos = 0;
    jugador.saltarProximoTurno = false;
    jugador.ataquesEsteTurno = 0;
    jugador.robosEsteTurno = 0;
    jugador.retosEsteTurno = 0;
  }
  registrar(sala, "sistema", "¡Nueva partida! Elegid equipo de nuevo.");
}
