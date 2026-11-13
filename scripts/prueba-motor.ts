/**
 * Prueba determinista del motor de juego (sin sockets ni servidor).
 * Comprueba las reglas con estados preparados a mano:
 *
 *   poción en tu turno · poción como respuesta (−1 trago) · regeneración
 *   (uso único) · confirmar bebida «cuenta la mitad» · turnos · robos ·
 *   validaciones que deben fallar.
 *
 * Uso:  npm run prueba-motor   (no necesita servidor arrancado)
 */

import * as juego from "../src/motor/juego";
import { CARTAS_DEFENSA } from "../src/datos/mazo-defensa";
import { CARTAS_TRAGOS } from "../src/datos/mazo-tragos";
import type { Sala } from "../src/servidor/tipos-internos";

let aciertos = 0;
let fallos = 0;

function comprobar(descripcion: string, condicion: boolean): void {
  if (condicion) {
    aciertos += 1;
    console.log(`  ✓ ${descripcion}`);
  } else {
    fallos += 1;
    console.error(`  ✗ FALLO: ${descripcion}`);
  }
}

/** Comprueba que una acción del motor lanza error (la validación funciona). */
function comprobarError(descripcion: string, accion: () => void): void {
  try {
    accion();
    comprobar(`${descripcion} (debería fallar)`, false);
  } catch {
    comprobar(descripcion, true);
  }
}

/** Crea una sala ya iniciada con Ana y Bruno (equipos personalizables). */
function salaDePrueba(equipoAna = ["blaziken", "sceptile", "swampert"]): {
  sala: Sala;
  anaId: string;
  brunoId: string;
} {
  const ana = juego.crearJugador("Ana", "#E3350D", "socket-ana");
  const sala = juego.crearSala("PRUEB", ana);
  const bruno = juego.crearJugador("Bruno", "#0EA5E9", "socket-bruno");
  juego.unirJugador(sala, bruno);
  juego.seleccionarEquipo(sala, ana.id, equipoAna);
  juego.seleccionarEquipo(sala, bruno.id, ["sharpedo", "absol", "shedinja"]);
  juego.marcarListo(sala, ana.id, true);
  juego.marcarListo(sala, bruno.id, true);
  return { sala, anaId: ana.id, brunoId: bruno.id };
}

function principal() {
  console.log("🧪 Prueba del motor de juego (reglas)\n");

  /* ── Poción como respuesta y regeneración ── */
  {
    const { sala, anaId } = salaDePrueba();
    const ana = sala.jugadores.find((j) => j.id === anaId)!;
    sala.turnoDe = anaId; // forzamos el turno de Ana para las pruebas
    const pocion = CARTAS_DEFENSA.find((c) => c.efecto.tipo === "pocion")!;
    const regeneracion = CARTAS_DEFENSA.find((c) => c.efecto.tipo === "regeneracion")!;
    const fatalidad = CARTAS_TRAGOS.find((c) => c.id === "fatalidad-absol")!;
    ana.mano.defensa.push(pocion, regeneracion);
    ana.mano.tragos.push(fatalidad);

    // Carta «yo bebo»: Ana se asigna 1 chupito a sí misma
    juego.jugarCarta(sala, anaId, fatalidad.id);
    comprobar("La carta «Fatalidad de Absol» deja 1 chupito pendiente", ana.pendientes.length === 1);

    // Castigo simulado de 3 tragos DE UN ATAQUE: la poción como respuesta reduce 1
    ana.pendientes.push({ id: "prueba-tragos", tragos: 3, chupitos: 0, motivo: "prueba", origen: "ataque" });
    // Una bebida que NO viene de un ataque (p. ej. un reto) no se puede reducir con Poción
    ana.pendientes.push({ id: "prueba-reto", tragos: 3, chupitos: 0, motivo: "reto", origen: "otro" });
    const pocionesAntes = ana.mano.defensa.filter((c) => c.efecto.tipo === "pocion").length;
    juego.responderPocion(sala, anaId);
    comprobar(
      "Responder con Poción reduce 1 trago del castigo del ataque",
      ana.pendientes.find((p) => p.id === "prueba-tragos")?.tragos === 2
    );
    comprobar(
      "La poción de respuesta NO reduce bebidas que no vienen de un ataque",
      ana.pendientes.find((p) => p.id === "prueba-reto")?.tragos === 3
    );
    comprobar(
      "La poción usada como respuesta sale de la mano",
      ana.mano.defensa.filter((c) => c.efecto.tipo === "pocion").length === pocionesAntes - 1
    );

    // Regeneración: anula todo lo pendiente y solo vale una vez
    juego.jugarCarta(sala, anaId, regeneracion.id);
    comprobar("La Regeneración anula todos los tragos pendientes", ana.pendientes.length === 0);
    comprobar(
      "La Regeneración queda contabilizada como usada (límite desde valores.ts)",
      ana.regeneracionUsos === 1
    );
    comprobarError("Segunda Regeneración rechazada", () => {
      ana.mano.defensa.push({ ...regeneracion, id: "regeneracion-prueba" });
      juego.jugarCarta(sala, anaId, "regeneracion-prueba");
    });
  }

  /* ── El fallo del dado (tirada 6) NO hace daño ── */
  {
    const { sala, anaId, brunoId } = salaDePrueba();
    const ana = sala.jugadores.find((j) => j.id === anaId)!;
    const bruno = sala.jugadores.find((j) => j.id === brunoId)!;
    sala.turnoDe = anaId;
    sala.estadoSala = "jugando";
    sala.faseTurno = "accion";
    const hpAntes = bruno.equipo[bruno.activo].hpActual;

    // Ana juega Blaziken: Patada Ígnea (40 de daño). Con tirada 6 = fallo.
    juego.atacar(sala, anaId, "blaziken-patada", 6);
    comprobar(
      "La tirada 6 (fallo) causa 0 de daño al rival",
      bruno.equipo[bruno.activo].hpActual === hpAntes
    );
    comprobar(
      "El fallo asigna al atacante 1 trago pendiente de origen «ataque»",
      ana.pendientes.length === 1 &&
        ana.pendientes[0].tragos === 1 &&
        ana.pendientes[0].origen === "ataque"
    );

    // Contraste: tirada normal de Bruno con Sharpedo (Filo de Coral, 30, modo dado)
    juego.terminarTurno(sala, anaId);
    sala.faseTurno = "accion";
    juego.atacar(sala, brunoId, "sharpedo-filo", 4);
    comprobar(
      "Una tirada normal suma daño de carta + daño de la tabla del dado",
      ana.equipo[ana.activo].hpActual === 115 - 30 - 35
    );
  }

  /* ── Selección de equipo idéntica no desmarca el «Listo» ── */
  {
    const ana = juego.crearJugador("Ana", "#E3350D", "socket-ana");
    const sala = juego.crearSala("PRUE2", ana);
    const bruno = juego.crearJugador("Bruno", "#0EA5E9", "socket-bruno");
    juego.unirJugador(sala, bruno);
    juego.seleccionarEquipo(sala, ana.id, ["ludicolo", "seviper", "glalie"]);
    juego.marcarListo(sala, ana.id, true);
    juego.seleccionarEquipo(sala, ana.id, ["ludicolo", "seviper", "glalie"]); // eco idéntico
    comprobar(
      "Un envío idéntico de selección no deshace el «Listo»",
      ana.listo === true
    );
    juego.seleccionarEquipo(sala, ana.id, ["glalie", "seviper", "ludicolo"]); // distinto orden
    comprobar("Un envío distinto sí permite volver a editar", ana.listo === false);
  }

  /* ── Poción en tu propio turno (cura HP) ── */
  {
    const { sala, anaId } = salaDePrueba();
    const ana = sala.jugadores.find((j) => j.id === anaId)!;
    sala.turnoDe = anaId;
    const pocion = { ...CARTAS_DEFENSA.find((c) => c.efecto.tipo === "pocion")!, id: "pocion-prueba" };
    ana.mano.defensa.push(pocion);
    ana.equipo[ana.activo].hpActual = 50; // Blaziken (110) herido

    juego.jugarCarta(sala, anaId, pocion.id);
    comprobar(
      "La Poción restaura 30 HP en tu turno (50 → 80)",
      ana.equipo[ana.activo].hpActual === 80
    );

    // Con la vida al máximo (Blaziken tiene 115 HP), la poción se rechaza
    ana.equipo[ana.activo].hpActual = 115;
    comprobarError("La poción rechaza curar un Pokémon con la vida llena", () => {
      const pocionLlena = { ...pocion, id: "pocion-prueba-2" };
      ana.mano.defensa.push(pocionLlena);
      juego.jugarCarta(sala, anaId, pocionLlena.id);
    });
  }

  /* ── Confirmación manual «cuenta la mitad» ── */
  {
    const { sala, anaId } = salaDePrueba();
    const ana = sala.jugadores.find((j) => j.id === anaId)!;
    ana.pendientes.push({ id: "mitad", tragos: 3, chupitos: 1, motivo: "prueba", origen: "otro" });
    juego.confirmarBebida(sala, anaId, "mitad");
    comprobar(
      "«Cuenta la mitad» confirma 2 tragos y 1 chupito (redondeo hacia arriba)",
      ana.tragosConfirmados === 2 && ana.chupitosConfirmados === 1 && ana.pendientes.length === 0
    );
  }

  /* ── Turnos y robos ── */
  {
    const { sala, anaId, brunoId } = salaDePrueba();
    const ana = sala.jugadores.find((j) => j.id === anaId)!;
    sala.turnoDe = anaId;

    comprobarError("Atacando fuera de tu turno se rechaza", () =>
      juego.atacar(sala, brunoId, "sharpedo-embestida")
    );

    juego.robarDeMazo(sala, anaId, "retos");
    comprobar("Robar carta del mazo de retos funciona en tu turno", ana.mano.retos.length > 0);
    comprobarError("Un segundo robo en el mismo turno se rechaza", () =>
      juego.robarDeMazo(sala, anaId, "retos")
    );

    juego.terminarTurno(sala, anaId);
    comprobar("Terminar el turno lo pasa al rival", sala.turnoDe === brunoId);
    comprobarError("Terminar el turno dos veces se rechaza", () => juego.terminarTurno(sala, anaId));
  }

  /* ── Saltar turno (Tormenta de Arena de Flygon) ── */
  {
    const { sala, anaId, brunoId } = salaDePrueba(["flygon", "sceptile", "swampert"]);
    const ana = sala.jugadores.find((j) => j.id === anaId)!;
    sala.turnoDe = anaId;
    sala.estadoSala = "jugando";
    sala.faseTurno = "accion";

    juego.atacar(sala, anaId, "flygon-tormenta");
    const bruno = sala.jugadores.find((j) => j.id === brunoId)!;
    comprobar("Tormenta de Arena marca «pierde el próximo turno» al rival", bruno.saltarProximoTurno);

    juego.terminarTurno(sala, anaId);
    comprobar("Tras el salto, el turno vuelve al atacante", sala.turnoDe === anaId);
    comprobar("La marca de salto se consume", !bruno.saltarProximoTurno);
  }

  /* ── Rendirse y nueva partida ── */
  {
    const { sala, anaId, brunoId } = salaDePrueba();
    juego.rendirse(sala, brunoId);
    comprobar("Rendirse acaba la partida", sala.estadoSala === "finalizada");
    comprobar("Gana el que no se rinde", sala.ganador === anaId);

    juego.nuevaPartida(sala);
    comprobar("Nueva partida vuelve a la elección de equipo", sala.estadoSala === "eligiendo");
    comprobar("Los contadores de bebida se reinician", sala.jugadores.every((j) => j.tragosConfirmados === 0));
  }

  console.log(`\nResultado: ${aciertos} comprobaciones correctas, ${fallos} fallos.`);
  if (fallos > 0) process.exit(1);
}

principal();
