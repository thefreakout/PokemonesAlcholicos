"use client";

/**
 * Pantalla 3 — Partida:
 *  - Los dos Pokémon enfrentados con sus barras de HP.
 *  - La mano separada por los 4 mazos (pestañas/bolsillos).
 *  - El dado animado, el contador de tragos de cada jugador
 *    y el registro de jugadas en vivo.
 *
 * Todo lo que se muestra llega del servidor (vista autoritativa).
 */

import { useEffect, useRef, useState } from "react";
import type { CartaAtaque, CartaEfecto, VistaEstado } from "@/motor/tipos";
import { VALORES } from "@/config/valores";
import { descripcionAtaque } from "@/motor/vista";
import type { EnviarAccion } from "@/lib/cliente/usarSala";
import { ImagenPokemon, EtiquetasTipo } from "./ImagenPokemon";
import { BarraHP } from "./BarraHP";
import { ContadorTragos, EtiquetaPendientes } from "./ContadorTragos";
import { RegistroJugadas } from "./RegistroJugadas";
import { AnimacionDado, DadoCaras } from "./DadoAnimado";
import { BolaIcono } from "./BolaIcono";

type MazoMano = "ataque" | "tragos" | "defensa" | "retos";

const NOMBRES_MAZO: Record<MazoMano, string> = {
  ataque: "⚔️ Ataque",
  tragos: "🍺 Tragos",
  defensa: "🛡️ Defensa",
  retos: "🎯 Retos",
};

/** Suma los tragos/chupitos pendientes de una lista. */
function sumarPendientes(pendientes: { tragos: number; chupitos: number }[]) {
  return pendientes.reduce(
    (total, pendiente) => ({
      tragos: total.tragos + pendiente.tragos,
      chupitos: total.chupitos + pendiente.chupitos,
    }),
    { tragos: 0, chupitos: 0 }
  );
}

export function PantallaPartida({
  estado,
  conectado,
  enviar,
}: {
  estado: VistaEstado;
  conectado: boolean;
  enviar: EnviarAccion;
}) {
  const yo = estado.tu!;
  const rival = estado.rival!;
  const esMiTurno = estado.estadoSala === "jugando" && estado.turnoDe === yo.id;
  const enAccion = esMiTurno && estado.faseTurno === "accion";
  const miActivo = yo.equipo[yo.activo];
  const rivalActivo = rival.equipo[rival.activo];

  const [mazoAbierto, setMazoAbierto] = useState<MazoMano>("ataque");
  const [cartaPorJugar, setCartaPorJugar] = useState<CartaEfecto | null>(null); // para cartas «elige quién bebe»
  const [confirmandoRendicion, setConfirmandoRendicion] = useState(false);

  /* ── Animación del dado: se dispara cuando el servidor lanza una tirada NUEVA.
     El efecto depende solo del momento de la tirada (no del objeto del estado),
     para que las difusiones de estado del rival no congelen la animación. ── */
  const [animacionDado, setAnimacionDado] = useState<{ valor: number; texto: string } | null>(null);
  const momentoDadoVisto = useRef<number | null>(null);
  const momentoDado = estado.ultimoDado?.momento ?? 0;
  useEffect(() => {
    const dado = estado.ultimoDado;
    if (!dado) return;
    // Tras recargar la página, el último dado ya no se re-anima.
    if (momentoDadoVisto.current === null) {
      momentoDadoVisto.current = dado.momento;
      return;
    }
    if (dado.momento === momentoDadoVisto.current) return;
    momentoDadoVisto.current = dado.momento;
    setAnimacionDado({ valor: dado.valor, texto: dado.texto });
    const temporizador = setTimeout(() => setAnimacionDado(null), 2000);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [momentoDado]);

  /* ── Sacudida de sprite cuando un Pokémon recibe daño ── */
  const [sacudidaMia, setSacudidaMia] = useState(false);
  const [sacudidaRival, setSacudidaRival] = useState(false);
  const hpMioAntes = useRef<number | null>(null);
  const hpRivalAntes = useRef<number | null>(null);
  useEffect(() => {
    const hpMio = miActivo?.hpActual ?? null;
    const hpRival = rivalActivo?.hpActual ?? null;
    if (hpMioAntes.current !== null && hpMio !== null && hpMio < hpMioAntes.current) {
      setSacudidaMia(true);
      setTimeout(() => setSacudidaMia(false), 600);
    }
    if (hpRivalAntes.current !== null && hpRival !== null && hpRival < hpRivalAntes.current) {
      setSacudidaRival(true);
      setTimeout(() => setSacudidaRival(false), 600);
    }
    hpMioAntes.current = hpMio;
    hpRivalAntes.current = hpRival;
  }, [miActivo?.hpActual, rivalActivo?.hpActual]);

  const pendientesMios = sumarPendientes(yo.pendientes);
  const pendientesRival = sumarPendientes(rival.pendientes);
  const tienePocion = yo.mano.defensa.some((c) => c.efecto.tipo === "pocion");
  // La Poción de respuesta solo reduce tragos que vienen de un ATAQUE recibido.
  const puedeResponderPocion =
    tienePocion && yo.pendientes.some((p) => p.origen === "ataque" && p.tragos > 0);

  const totalMano = yo.mano.tragos.length + yo.mano.defensa.length + yo.mano.retos.length;

  return (
    <main
      className="mx-auto w-full max-w-md space-y-3 px-3 py-3"
      // Con la hoja de tragos abierta, se deja hueco para que no tape botones
      style={pendientesMios.tragos + pendientesMios.chupitos > 0 ? { paddingBottom: 170 } : undefined}
    >
      {/* ── Cabecera: sala, conexión y rendirse ── */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BolaIcono tamano={24} />
          <span className="text-xs font-bold uppercase tracking-widest text-white/60">
            Sala {estado.codigo}
          </span>
          {!conectado && <span className="text-xs font-bold text-poke-amarillo">Reconectando…</span>}
        </div>
        {confirmandoRendicion ? (
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold">¿Rendirse?</span>
            <button
              className="btn-secundario !px-2 !py-1 bg-poke-rojo"
              onClick={() => {
                enviar("juego:rendirse");
                setConfirmandoRendicion(false);
              }}
            >
              Sí
            </button>
            <button className="btn-secundario !px-2 !py-1" onClick={() => setConfirmandoRendicion(false)}>
              No
            </button>
          </div>
        ) : (
          <button className="btn-secundario !px-2 !py-1" onClick={() => setConfirmandoRendicion(true)}>
            🏳️ Rendirse
          </button>
        )}
      </header>

      {/* ── Zona del rival ── */}
      <section className="tarjeta-panel space-y-2 p-3">
        <div className="flex items-center justify-between">
          <ContadorTragos
            apodo={rival.apodo}
            color={rival.color}
            tragos={rival.tragosConfirmados}
            chupitos={rival.chupitosConfirmados}
            esMiJugador={false}
          />
          <div className="flex flex-col items-end gap-1">
            <EtiquetaPendientes tragos={pendientesRival.tragos} chupitos={pendientesRival.chupitos} />
            {rival.saltarProximoTurno && (
              <span className="rounded-full bg-poke-azul px-2 py-0.5 text-xs font-bold">⏭️ Pierde su turno</span>
            )}
          </div>
        </div>

        {rivalActivo && (
          <div className={`flex items-center gap-3 ${sacudidaRival ? "animate-golpe" : ""}`}>
            <ImagenPokemon sprite={rivalActivo.sprite} nombre={rivalActivo.nombre} tipos={rivalActivo.tipos} tamano={72} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-lg font-black">{rivalActivo.nombre}</p>
                <EtiquetasTipo tipos={rivalActivo.tipos} pequenas />
              </div>
              <BarraHP hpActual={rivalActivo.hpActual} hpMax={rivalActivo.hpMax} />
            </div>
          </div>
        )}

        <p className="text-center text-[11px] font-bold uppercase tracking-wide text-white/50">
          Mano del rival: 🎯 {rival.manoCuentas.retos} · 🛡️ {rival.manoCuentas.defensa} · 🍺 {rival.manoCuentas.tragos}
        </p>
      </section>

      {/* ── Centro: turno, fase y registro ── */}
      <section className="space-y-2 text-center">
        {estado.estadoSala === "jugando" && (
          <div
            className={`rounded-2xl py-2 text-lg font-black uppercase tracking-widest ${
              enAccion ? "bg-poke-amarillo text-poke-noche animate-latido" : "bg-white/10 text-white/90"
            }`}
            data-prueba="turno"
          >
            {esMiTurno ? "Tu turno" : `Turno de ${rival.apodo}`}
          </div>
        )}

        {estado.faseTurno === "cambio" && estado.jugadorCambiando === rival.id && (
          <p className="rounded-xl bg-poke-azul/40 border border-poke-azul px-3 py-2 text-sm font-bold">
            🔄 {rival.apodo} está eligiendo su Pokémon de reserva…
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <DadoCaras valor={estado.ultimoDado?.valor ?? 6} tamano={44} />
          <p className="text-xs font-bold text-white/70">{estado.ultimoDado?.texto ?? "El dado aún no ha salido"}</p>
        </div>

        <RegistroJugadas registro={estado.registro} />
      </section>

      {/* ── Mi zona ── */}
      <section className="tarjeta-panel space-y-2 p-3">
        {miActivo && (
          <div className={`flex items-center gap-3 ${sacudidaMia ? "animate-golpe" : ""}`}>
            <ImagenPokemon sprite={miActivo.sprite} nombre={miActivo.nombre} tipos={miActivo.tipos} tamano={72} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-lg font-black">{miActivo.nombre}</p>
                <EtiquetasTipo tipos={miActivo.tipos} pequenas />
              </div>
              <BarraHP hpActual={miActivo.hpActual} hpMax={miActivo.hpMax} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <ContadorTragos
            apodo={yo.apodo}
            color={yo.color}
            tragos={yo.tragosConfirmados}
            chupitos={yo.chupitosConfirmados}
            esMiJugador
          />
          <div className="flex flex-col items-end gap-1">
            {yo.saltarProximoTurno && (
              <span className="rounded-full bg-poke-azul px-2 py-0.5 text-xs font-bold">⏭️ Pierdes tu turno</span>
            )}
            {yo.regeneracionUsada && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">Regeneración usada</span>
            )}
          </div>
        </div>

        {/* Mi equipo completo (activo + reservas) */}
        <div className="flex justify-center gap-2">
          {yo.equipo.map((pokemon, indice) => (
            <div
              key={pokemon.id}
              className={`rounded-xl border px-2 py-1 text-center ${
                indice === yo.activo ? "border-poke-amarillo" : pokemon.debilitado ? "border-red-500/60 opacity-50" : "border-white/15"
              }`}
            >
              <ImagenPokemon sprite={pokemon.sprite} nombre={pokemon.nombre} tipos={pokemon.tipos} tamano={34} />
              <p className="text-[10px] font-bold">{indice === yo.activo ? "⭐ " : ""}{pokemon.hpActual} HP</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mano con 4 bolsillos ── */}
      <section className="tarjeta-panel p-2">
        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(NOMBRES_MAZO) as MazoMano[]).map((mazo) => {
            const cartas = yo.mano[mazo];
            return (
              <button
                key={mazo}
                onClick={() => setMazoAbierto(mazo)}
                className={`rounded-xl px-1 py-2 text-xs font-extrabold transition ${
                  mazoAbierto === mazo ? "bg-poke-amarillo text-poke-noche" : "bg-white/10 text-white/80"
                }`}
              >
                {NOMBRES_MAZO[mazo]}
                <span className="ml-1 rounded-full bg-black/20 px-1.5 text-[10px]">{cartas.length}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 space-y-2">
          {mazoAbierto === "ataque" &&
            yo.mano.ataque.map((carta) => (
              <CartaAtaquePanel
                key={carta.id}
                carta={carta}
                jugable={enAccion && !yo.atacoEsteTurno && !miActivo?.debilitado}
                onJugar={() => enviar("juego:atacar", { cartaId: carta.id })}
              />
            ))}

          {mazoAbierto === "tragos" &&
            yo.mano.tragos.map((carta) => (
              <CartaEfectoPanel
                key={carta.id}
                carta={carta}
                etiquetaBoton="🍺 Jugar"
                jugable={enAccion}
                onJugar={() => {
                  if (carta.efecto.tipo === "bebida" && carta.efecto.objetivo === "elegir") {
                    setCartaPorJugar(carta); // pedir quién bebe
                  } else {
                    enviar("juego:jugarCarta", { cartaId: carta.id });
                  }
                }}
              />
            ))}

          {mazoAbierto === "defensa" &&
            yo.mano.defensa.map((carta) => (
              <CartaEfectoPanel
                key={carta.id}
                carta={carta}
                etiquetaBoton={carta.efecto.tipo === "pocion" ? "🧪 Usar" : "🥤 Rellenar cubata"}
                jugable={
                  enAccion &&
                  (carta.efecto.tipo === "pocion"
                    ? !miActivo?.debilitado
                    : !yo.regeneracionUsada && pendientesMios.tragos + pendientesMios.chupitos > 0)
                }
                onJugar={() => enviar("juego:jugarCarta", { cartaId: carta.id })}
              />
            ))}

          {mazoAbierto === "retos" &&
            yo.mano.retos.map((carta) => (
              <CartaEfectoPanel
                key={carta.id}
                carta={carta}
                etiquetaBoton="🎯 Lanzar reto"
                jugable={enAccion && !yo.retoJugadoEsteTurno}
                onJugar={() => enviar("juego:jugarCarta", { cartaId: carta.id })}
              />
            ))}
        </div>

        {/* Robar cartas de los mazos comunes (1 por turno) */}
        <div className="mt-2 border-t border-white/10 pt-2">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/60">
            Robar carta ({yo.roboEsteTurno ? "ya has robado este turno" : "1 por turno"})
          </p>
          <div className="grid grid-cols-3 gap-1">
            {(["tragos", "defensa", "retos"] as const).map((mazo) => (
              <button
                key={mazo}
                className="btn-secundario !py-1.5 text-xs"
                disabled={!enAccion || yo.roboEsteTurno || totalMano >= VALORES.tamanoMaximoMano}
                onClick={() => enviar("juego:robar", { mazo })}
              >
                🃏 {NOMBRES_MAZO[mazo].split(" ")[1]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Terminar turno ── */}
      <button
        className="btn-amarillo mb-2"
        disabled={!enAccion}
        onClick={() => enviar("juego:terminarTurno")}
        data-prueba="terminar-turno"
      >
        Terminar turno ⏭️
      </button>

      {/* ── Superposiciones ── */}
      {animacionDado && (
        <AnimacionDado valor={animacionDado.valor} texto={animacionDado.texto} alTerminar={() => setAnimacionDado(null)} />
      )}

      {estado.reto && <SuperposicionReto estado={estado} enviar={enviar} />}

      {estado.faseTurno === "cambio" && estado.jugadorCambiando === yo.id && (
        <SuperposicionCambio estado={estado} enviar={enviar} />
      )}

      {estado.estadoSala === "pausada" && (
        <SuperposicionPausa estado={estado} />
      )}

      {cartaPorJugar && (
        <SuperposicionElegirObjetivo
          carta={cartaPorJugar}
          yo={yo.apodo}
          rival={rival.apodo}
          onElegir={(quien) => {
            const objetivoId = quien === "yo" ? yo.id : rival.id;
            enviar("juego:jugarCarta", { cartaId: cartaPorJugar.id, objetivoId });
            setCartaPorJugar(null);
          }}
          onCancelar={() => setCartaPorJugar(null)}
        />
      )}

      {/* ── Hoja inferior: tragos pendientes de confirmar ── */}
      {pendientesMios.tragos + pendientesMios.chupitos > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md animate-aparece p-2 pb-4">
          <div className="rounded-2xl border-2 border-poke-amarillo bg-poke-nocheClara p-3 shadow-2xl">
            <p className="text-center text-lg font-black text-poke-amarillo">
              Te tocan: {pendientesMios.tragos > 0 ? `${pendientesMios.tragos} trago(s)` : ""}
              {pendientesMios.tragos > 0 && pendientesMios.chupitos > 0 ? " y " : ""}
              {pendientesMios.chupitos > 0 ? `${pendientesMios.chupitos} chupito(s)` : ""} 🍹
            </p>
            <p className="mt-1 text-center text-xs text-white/70">
              Bebe de verdad y confirma la cantidad que bebes.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn-rojo !py-3" onClick={() => enviar("juego:confirmarBebida", { modo: "todo" })}>
                Los bebo ✅
              </button>
              <button className="btn-azul !py-3" onClick={() => enviar("juego:confirmarBebida", { modo: "mitad" })}>
                Cuenta la mitad 🙏
              </button>
            </div>
            {puedeResponderPocion && (
              <button
                className="btn-secundario mt-2 w-full !py-2"
                onClick={() => enviar("juego:responderPocion")}
              >
                🛡️ Responder con Poción (−{VALORES.pocionRespuestaReduceTragos} trago)
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* ─────────────────────── Tarjetas de la mano ─────────────────────── */

function CartaAtaquePanel({
  carta,
  jugable,
  onJugar,
}: {
  carta: CartaAtaque;
  jugable: boolean;
  onJugar: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-extrabold">{carta.nombre}</p>
        <span className="rounded-full bg-poke-rojo px-2 py-0.5 text-xs font-black">{carta.danio} ⚔️</span>
      </div>
      <p className="mt-1 text-xs leading-snug text-white/75">{descripcionAtaque(carta)}</p>
      <button className="btn-rojo mt-2 !py-2.5 text-base" disabled={!jugable} onClick={onJugar}>
        ⚔️ ¡Atacar y tirar el dado!
      </button>
    </div>
  );
}

function CartaEfectoPanel({
  carta,
  etiquetaBoton,
  jugable,
  onJugar,
}: {
  carta: CartaEfecto;
  etiquetaBoton: string;
  jugable: boolean;
  onJugar: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-3">
      <p className="font-extrabold">{carta.nombre}</p>
      <p className="mt-1 text-xs leading-snug text-white/75">{carta.descripcion}</p>
      <button className="btn-azul mt-2 !py-2.5 text-base" disabled={!jugable} onClick={onJugar}>
        {etiquetaBoton}
      </button>
    </div>
  );
}

/* ─────────────────────── Superposiciones ─────────────────────── */

/** Reto en curso: cronómetro de 30 s y veredicto del rival. */
function SuperposicionReto({ estado, enviar }: { estado: VistaEstado; enviar: EnviarAccion }) {
  const reto = estado.reto!;
  const yo = estado.tu!;
  const soyObjetivo = reto.objetivo === yo.id;
  // El plazo lo fija el reloj del SERVIDOR, pero la cuenta atrás corre con el
  // reloj local (se calcula una sola vez al montar y decrece cada segundo):
  // así el desfase de reloj del móvil no distorsiona el cronómetro.
  const [restante, setRestante] = useState(() =>
    Math.max(0, Math.ceil((reto.terminaEn - Date.now()) / 1000))
  );

  useEffect(() => {
    const intervalo = setInterval(() => {
      setRestante((actual) => Math.max(0, actual - 1));
    }, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const porcentaje = Math.min(100, (restante / VALORES.retoSegundos) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border-2 border-poke-amarillo bg-poke-nocheClara p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-poke-amarillo">Reto lanzado</p>
        <p className="mt-2 text-xl font-black leading-snug">{reto.carta.descripcion}</p>

        <div className="mx-auto mt-4 h-4 w-full overflow-hidden rounded-full bg-black/50">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              restante <= 5 ? "bg-red-500" : "bg-poke-amarillo"
            }`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="mt-1 text-3xl font-black">{restante}s</p>

        {soyObjetivo ? (
          <div className="mt-4 space-y-2">
            <button className="btn-rojo !text-xl" onClick={() => enviar("juego:resolverReto", { cumplido: true })}>
              ✅ ¡Lo he cumplido!
            </button>
            <button className="btn-secundario w-full !py-3" onClick={() => enviar("juego:resolverReto", { cumplido: false })}>
              ❌ No lo he cumplido
            </button>
          </div>
        ) : (
          <p className="mt-4 animate-latido text-sm font-bold text-white/80">
            Esperando la respuesta del rival…
          </p>
        )}
      </div>
    </div>
  );
}

/** Cambio de Pokémon activo tras una caída. */
function SuperposicionCambio({ estado, enviar }: { estado: VistaEstado; enviar: EnviarAccion }) {
  const yo = estado.tu!;
  const vivos = yo.equipo
    .map((pokemon, indice) => ({ pokemon, indice }))
    .filter(({ pokemon, indice }) => pokemon.hpActual > 0 && indice !== yo.activo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border-2 border-poke-rojo bg-poke-nocheClara p-5 text-center">
        <p className="text-2xl font-black text-poke-amarillo">¡Tu Pokémon se ha debilitado!</p>
        <p className="mt-1 text-sm text-white/80">Elige cuál de tus reservas entra ahora.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {vivos.map(({ pokemon, indice }) => (
            <button
              key={pokemon.id}
              className="tarjeta-panel flex flex-col items-center p-3 transition active:scale-95"
              onClick={() => enviar("juego:cambiarActivo", { indice })}
            >
              <ImagenPokemon sprite={pokemon.sprite} nombre={pokemon.nombre} tipos={pokemon.tipos} tamano={64} />
              <p className="mt-1 text-sm font-black">{pokemon.nombre}</p>
              <p className="text-xs font-bold text-white/70">{pokemon.hpActual} HP</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Sala en pausa porque alguien lleva demasiado tiempo sin conexión. */
function SuperposicionPausa({ estado }: { estado: VistaEstado }) {
  const yo = estado.tu!;
  const rival = estado.rival!;
  const quien =
    !yo.conectado ? `${yo.apodo} (tú)` : !rival.conectado ? rival.apodo : "alguien";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-5">
      <div className="w-full max-w-sm rounded-3xl border-2 border-white/30 bg-poke-nocheClara p-5 text-center">
        <p className="text-3xl">⏸️</p>
        <p className="mt-2 text-xl font-black">Partida en pausa</p>
        <p className="mt-1 text-sm text-white/80">
          Esperando a que {quien} recupere la conexión.
        </p>
        <p className="mt-2 text-xs text-white/50">
          La partida se reanudará sola cuando vuelva.
        </p>
      </div>
    </div>
  );
}

/** Cartas «elige quién bebe»: pregunta rápida de objetivo. */
function SuperposicionElegirObjetivo({
  carta,
  yo,
  rival,
  onElegir,
  onCancelar,
}: {
  carta: CartaEfecto;
  yo: string;
  rival: string;
  onElegir: (quien: "yo" | "rival") => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
      <div className="w-full max-w-sm rounded-3xl border-2 border-poke-amarillo bg-poke-nocheClara p-5 text-center">
        <p className="text-lg font-black">{carta.nombre}</p>
        <p className="mt-1 text-sm text-white/80">¿Quién bebe?</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-rojo" onClick={() => onElegir("rival")}>
            {rival}
          </button>
          <button className="btn-azul" onClick={() => onElegir("yo")}>
            Yo ({yo})
          </button>
        </div>
        <button className="btn-secundario mt-3" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
