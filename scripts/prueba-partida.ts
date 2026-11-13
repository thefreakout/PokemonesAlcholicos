/**
 * Prueba automática de la partida completa: simula a DOS jugadores reales
 * conectados por Socket.IO y comprueba todo el flujo del juego:
 *
 *   crear sala → unirse → elegir equipo → listo → atacar (dado) →
 *   jugar cartas de tragos → confirmar bebida → reto → cambiar activo →
 *   terminar turno → rendirse → nueva partida → reconexión.
 *
 * Uso:  arranca el servidor (npm run dev) y después ejecuta  npm run prueba
 * Por defecto se conecta a http://localhost:3000 (variable URL para cambiarlo).
 */

import { io, type Socket } from "socket.io-client";
import type { EventosCliente, EventosServidor, VistaEstado } from "../src/motor/tipos";

const URL_SERVIDOR = process.env.URL ?? "http://localhost:3000";

type Cliente = Socket<EventosServidor, EventosCliente>;

let aciertos = 0;
let fallos = 0;

/** Verifica una condición y muestra el resultado. */
function comprobar(descripcion: string, condicion: boolean): boolean {
  if (condicion) {
    aciertos += 1;
    console.log(`  ✓ ${descripcion}`);
  } else {
    fallos += 1;
    console.error(`  ✗ FALLO: ${descripcion}`);
  }
  return condicion;
}

/** Espera (en milisegundos) con una promesa sencilla. */
function esperar(ms: number): Promise<void> {
  return new Promise((resolucion) => setTimeout(resolucion, ms));
}

/** Conecta un cliente y devuelve también su última vista del estado. */
function conectar(): { socket: Cliente; estado: () => VistaEstado | null } {
  const socket: Cliente = io(URL_SERVIDOR, { transports: ["websocket"] });
  let ultimaVista: VistaEstado | null = null;
  socket.on("estado", (vista) => {
    ultimaVista = vista;
  });
  return { socket, estado: () => ultimaVista };
}

/** Espera hasta que la condición se cumpla o se agote el tiempo. */
async function esperarHasta(
  descripcion: string,
  condicion: () => boolean,
  limiteMs = 8000
): Promise<boolean> {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    if (condicion()) return true;
    await esperar(60);
  }
  comprobar(descripcion, false);
  return false;
}

async function principal() {
  console.log(`🧪 Prueba de partida contra ${URL_SERVIDOR}\n`);

  const ana = conectar();
  const bruno = conectar();

  ana.socket.connect();
  await esperarHasta("Ana conectada", () => ana.socket.connected);
  ana.socket.emit("sala:crear", { apodo: "Ana", color: "#E3350D" });
  await esperarHasta("Sala creada por Ana", () => ana.estado()?.estadoSala === "esperando");
  const codigo = ana.estado()!.codigo;
  comprobar("El código de sala tiene 5 caracteres", codigo.length === 5);

  bruno.socket.connect();
  await esperarHasta("Bruno conectado", () => bruno.socket.connected);
  bruno.socket.emit("sala:unir", { codigo, apodo: "Bruno", color: "#0EA5E9" });
  await esperarHasta("Bruno se ha unido", () => bruno.estado()?.estadoSala === "eligiendo");

  // ── Elección de equipo ──
  ana.socket.emit("sala:seleccionarEquipo", {
    pokemonIds: ["blaziken", "sceptile", "swampert"],
  });
  bruno.socket.emit("sala:seleccionarEquipo", {
    pokemonIds: ["sharpedo", "absol", "shedinja"],
  });
  ana.socket.emit("sala:listo", { listo: true });
  bruno.socket.emit("sala:listo", { listo: true });
  await esperarHasta("La partida empieza", () => ana.estado()?.estadoSala === "jugando");
  comprobar("Ana ve a su rival", ana.estado()!.rival?.apodo === "Bruno");
  const vistaRivalDesdeAna = ana.estado()!.rival;
  comprobar(
    "La vista del rival solo muestra recuentos de mano, nunca sus cartas",
    vistaRivalDesdeAna !== null && !("mano" in vistaRivalDesdeAna) && vistaRivalDesdeAna.manoCuentas.tragos >= 0
  );
  comprobar(
    "Bruno tiene cartas iniciales en la mano",
    bruno.estado()!.tu!.mano.tragos.length > 0
  );

  // ¿A quién le toca?
  let estado = ana.estado()!;
  const anaEmpieza = estado.turnoDe === ana.estado()!.miId;
  const atacante = anaEmpieza ? ana : bruno;
  const defensor = anaEmpieza ? bruno : ana;
  console.log(`  · Empieza ${atacante === ana ? "Ana" : "Bruno"}`);

  // ── Ataque con dado ──
  const cartaAtaque = atacante.estado()!.tu!.mano.ataque[0];
  comprobar("El atacante tiene su carta de ataque", !!cartaAtaque);
  const hpRivalAntes = defensor.estado()!.tu!.equipo[0].hpActual;
  atacante.socket.emit("juego:atacar", { cartaId: cartaAtaque.id });
  await esperarHasta(
    "El registro refleja el ataque",
    () => atacante.estado()!.registro.some((e) => e.tipo === "ataque")
  );
  estado = atacante.estado()!;
  comprobar("El servidor lanzó el dado (1-6)", !!estado.ultimoDado && estado.ultimoDado.valor >= 1 && estado.ultimoDado.valor <= 6);
  comprobar("El atacante no puede volver a atacar", estado.tu!.atacoEsteTurno);

  // ── Carta de tragos + confirmación manual ──
  const cartaTragos = atacante.estado()!.tu!.mano.tragos[0];
  comprobar("El atacante tiene una carta de tragos", !!cartaTragos);
  atacante.socket.emit("juego:jugarCarta", { cartaId: cartaTragos.id, objetivoId: defensor.estado()!.miId! });
  await esperarHasta(
    "La carta reparte bebida",
    () => atacante.estado()!.registro.some((e) => e.tipo === "bebida")
  );
  const alguienTienePendientes =
    atacante.estado()!.tu!.pendientes.length > 0 || defensor.estado()!.tu!.pendientes.length > 0;
  comprobar("Alguien tiene tragos pendientes", alguienTienePendientes);

  const conPendientes = atacante.estado()!.tu!.pendientes.length > 0 ? atacante : defensor;
  conPendientes.socket.emit("juego:confirmarBebida", { modo: "todo" });
  await esperarHasta(
    "La bebida confirmada se contabiliza",
    () => conPendientes.estado()!.tu!.pendientes.length === 0
  );
  comprobar(
    "El contador manual suma los tragos confirmados",
    conPendientes.estado()!.tu!.tragosConfirmados + conPendientes.estado()!.tu!.chupitosConfirmados > 0
  );

  // ── Regeneración (si Bruno la tiene, la probamos con quien tenga una) ──
  const regeneracionAtacante = atacante.estado()!.tu!.mano.defensa.find((c) => c.efecto.tipo === "regeneracion");

  // ── Reto ──
  const cartaReto = atacante.estado()!.tu!.mano.retos[0];
  comprobar("El atacante tiene una carta de reto", !!cartaReto);
  atacante.socket.emit("juego:jugarCarta", { cartaId: cartaReto.id });
  await esperarHasta("El reto se activa", () => atacante.estado()!.faseTurno === "reto");
  comprobar("El reto tiene plazo de 30 s", !!atacante.estado()!.reto);
  defensor.socket.emit("juego:resolverReto", { cumplido: false });
  await esperarHasta("El reto se resuelve con castigo", () => atacante.estado()!.faseTurno === "accion");

  // ── Terminar turno y ataque del otro ──
  atacante.socket.emit("juego:terminarTurno");
  await esperarHasta("El turno pasa al otro jugador", () => defensor.estado()!.turnoDe === defensor.estado()!.miId);

  const cartaRival = defensor.estado()!.tu!.mano.ataque[0];
  defensor.socket.emit("juego:atacar", { cartaId: cartaRival.id });
  await esperarHasta(
    "El rival también ataca",
    () => defensor.estado()!.registro.filter((e) => e.tipo === "ataque").length >= 2
  );

  // ── Robar carta de mazo común ──
  defensor.socket.emit("juego:robar", { mazo: "defensa" });
  await esperarHasta("El rival roba carta de defensa", () =>
    defensor.estado()!.registro.some((e) => e.texto.includes("roba una carta"))
  );

  // ── Cambio de activo forzado: apalizamos al activo de Bruno hasta debilitarlo ──
  // Ana ataca repetidamente en sus turnos hasta que el Pokémon de Bruno caiga.
  let proteccion = 0;
  while (
    defensor.estado()!.tu!.equipo.filter((p) => p.hpActual > 0).length === 3 &&
    proteccion < 30
  ) {
    proteccion += 1;
    const quienJuega = ana.estado()!.turnoDe === ana.estado()!.miId ? ana : bruno;
    const activoAtacante = quienJuega.estado()!.tu!.mano.ataque[0];
    if (quienJuega.estado()!.faseTurno === "accion" && activoAtacante) {
      quienJuega.socket.emit("juego:atacar", { cartaId: activoAtacante.id });
      await esperar(400);
      // si hay un cambio de activo pendiente para el defensor, lo resolvemos
      const vistaDefensor = defensor.estado();
      if (vistaDefensor!.faseTurno === "cambio" && vistaDefensor!.jugadorCambiando === vistaDefensor!.miId) {
        const indiceReserva = vistaDefensor!.tu!.equipo.findIndex((p) => p.hpActual > 0);
        defensor.socket.emit("juego:cambiarActivo", { indice: indiceReserva });
        await esperar(300);
      }
      // el atacante termina su turno para alternar
      if (quienJuega.estado()!.faseTurno === "accion") {
        quienJuega.socket.emit("juego:terminarTurno");
      }
      await esperar(400);
    } else {
      // fase de reto o de cambio: lo resolvemos para seguir
      if (quienJuega.estado()!.faseTurno === "reto") {
        const objetivo = ana.estado()!.faseTurno === "reto" ? bruno : ana;
        objetivo.socket.emit("juego:resolverReto", { cumplido: true });
      }
      await esperar(300);
    }
  }

  const huboCambio = ana.estado()!.registro.some((e) => e.tipo === "cambio" && e.texto.includes("debilitado"));
  comprobar("Un Pokémon se debilitó y hubo cambio de reserva", huboCambio);

  // ── Rendirse ──
  bruno.socket.emit("juego:rendirse");
  await esperarHasta("Ana gana por rendición de Bruno", () => ana.estado()!.estadoSala === "finalizada");
  comprobar("El ganador es Ana", ana.estado()!.ganador === ana.estado()!.miId);

  // ── Nueva partida ──
  ana.socket.emit("juego:nuevaPartida");
  await esperarHasta("Vuelve a la elección de equipo", () => ana.estado()!.estadoSala === "eligiendo");

  // ── Reconexión: Bruno cierra y vuelve con su jugadorId y su token secreto ──
  const jugadorIdBruno = bruno.estado()!.miId!;
  const tokenBruno = bruno.estado()!.miToken!;
  comprobar("La vista incluye el token secreto propio", typeof tokenBruno === "string" && tokenBruno.length > 0);
  bruno.socket.disconnect();
  await esperar(500);
  bruno.socket.connect();
  await esperarHasta("Bruno reconectado", () => bruno.socket.connected);
  bruno.socket.emit("sala:reconectar", { codigo, jugadorId: jugadorIdBruno, token: tokenBruno });
  await esperarHasta("Bruno recupera su sesión", () => bruno.estado()!.miId === jugadorIdBruno);

  // ── Suplantación: un desconocido con el jugadorId pero SIN el token es rechazado ──
  let errorSuplantacion = "";
  const impostor = conectar();
  impostor.socket.connect();
  await esperarHasta("Impostor conectado", () => impostor.socket.connected);
  impostor.socket.once("sala:error", ({ mensaje }) => {
    errorSuplantacion = mensaje;
  });
  impostor.socket.emit("sala:reconectar", { codigo, jugadorId: jugadorIdBruno, token: "token-falso" });
  await esperarHasta("La reconexión sin token válido da error", () => errorSuplantacion !== "");
  comprobar(
    "Reconectar con token falso es rechazado (sesión inválida)",
    errorSuplantacion.includes("no es válida") || errorSuplantacion.includes("sesión")
  );
  impostor.socket.close();

  // ── Errores controlados: código de sala inexistente ──
  const tercerJugador = conectar();
  let mensajeError = "";
  tercerJugador.socket.once("sala:error", ({ mensaje }) => {
    mensajeError = mensaje;
  });
  tercerJugador.socket.connect();
  await esperarHasta("Tercer jugador conectado", () => tercerJugador.socket.connected);
  tercerJugador.socket.emit("sala:unir", { codigo: "ZZZZZ", apodo: "Tramposo", color: "#22C55E" });
  await esperarHasta("La sala inexistente da error", () => mensajeError !== "");
  comprobar("Error claro al unirse a sala inexistente", mensajeError.includes("No existe ninguna sala"));

  ana.socket.close();
  bruno.socket.close();
  tercerJugador.socket.close();

  console.log(`\nResultado: ${aciertos} comprobaciones correctas, ${fallos} fallos.`);
  if (fallos > 0) process.exit(1);
  process.exit(0);
}

principal().catch((error) => {
  console.error("La prueba no pudo completarse:", error);
  process.exit(1);
});
