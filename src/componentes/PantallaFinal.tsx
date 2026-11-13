"use client";

/**
 * Pantalla 4 — Final: ganador, resumen de tragos bebidos por cada uno,
 * registro completo de la partida y botón de «Nueva partida».
 */

import type { VistaEstado } from "@/motor/tipos";
import type { EnviarAccion } from "@/lib/cliente/usarSala";
import { ImagenPokemon } from "./ImagenPokemon";
import { RegistroJugadas } from "./RegistroJugadas";
import { BolaIcono } from "./BolaIcono";

export function PantallaFinal({
  estado,
  enviar,
}: {
  estado: VistaEstado;
  enviar: EnviarAccion;
}) {
  const yo = estado.tu!;
  const rival = estado.rival!;
  const gane = estado.ganador === yo.id;
  const ganador = gane ? yo : rival;
  const perdedor = gane ? rival : yo;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 px-5 py-8">
      {/* Ganador */}
      <header className="text-center">
        <div className="mb-2 flex justify-center animate-latido">
          <BolaIcono tamano={64} />
        </div>
        <h1 className="text-3xl font-black text-poke-amarillo">
          ¡{ganador.apodo} gana!
        </h1>
        <p className="mt-1 text-sm text-white/80">{estado.motivoFin}</p>
        <p className="mt-2 rounded-xl bg-poke-rojo/30 border border-poke-rojo px-3 py-2 text-base font-bold">
          🍻 {perdedor.apodo}, termina tu cubata…
        </p>
      </header>

      {/* Resumen de tragos */}
      <section className="tarjeta-panel p-4">
        <h2 className="mb-3 text-center text-sm font-bold uppercase tracking-widest text-white/70">
          Resumen de la partida
        </h2>
        <div className="grid grid-cols-2 gap-3 text-center">
          <ResumenJugador
            apodo={yo.apodo}
            color={yo.color}
            tragos={yo.tragosConfirmados}
            chupitos={yo.chupitosConfirmados}
            etiqueta="Tú"
          />
          <ResumenJugador
            apodo={rival.apodo}
            color={rival.color}
            tragos={rival.tragosConfirmados}
            chupitos={rival.chupitosConfirmados}
            etiqueta="Rival"
          />
        </div>

        {/* Equipo vencedor */}
        <div className="mt-4 flex items-end justify-center gap-3">
          {ganador.equipo.map((pokemon) => (
            <div key={pokemon.id} className="text-center">
              <ImagenPokemon sprite={pokemon.sprite} nombre={pokemon.nombre} tipos={pokemon.tipos} tamano={44} />
              <p className="text-[10px] font-bold text-white/70">
                {pokemon.debilitado ? "💀" : "❤️"} {pokemon.hpActual}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Registro completo */}
      <section>
        <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-white/70">
          Todas las jugadas
        </h2>
        <RegistroJugadas registro={estado.registro} completo />
      </section>

      <button className="btn-rojo text-xl" onClick={() => enviar("juego:nuevaPartida")}>
        🔄 Nueva partida
      </button>

      <p className="text-center text-xs text-white/50">
        Al pulsar «Nueva partida» los dos volvéis a elegir equipo.
      </p>
    </main>
  );
}

function ResumenJugador({
  apodo,
  color,
  tragos,
  chupitos,
  etiqueta,
}: {
  apodo: string;
  color: string;
  tragos: number;
  chupitos: number;
  etiqueta: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-3">
      <div className="mb-1 flex items-center justify-center gap-2">
        <span className="h-4 w-4 rounded-full border border-white/40" style={{ backgroundColor: color }} />
        <span className="text-sm font-extrabold">{apodo}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{etiqueta}</p>
      <p className="mt-2 text-lg font-black">🍺 {tragos}</p>
      <p className="text-sm font-bold text-white/80">🥃 {chupitos}</p>
    </div>
  );
}
