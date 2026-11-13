"use client";

/**
 * Pantalla 2 — Sala:
 *  - Esperando: código y QR bien grandes para que el rival se una.
 *  - Eligiendo: elección del Pokémon activo (⭐) y los 2 de reserva + botón «Listo».
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { CATALOGO_POKEMON } from "@/datos/pokemon";
import type { VistaEstado } from "@/motor/tipos";
import type { EnviarAccion } from "@/lib/cliente/usarSala";
import { ImagenPokemon, EtiquetasTipo } from "./ImagenPokemon";

/** Código QR grande que apunta al enlace para unirse a la sala. */
function CodigoQR({ codigo }: { codigo: string }) {
  const [imagen, setImagen] = useState<string | null>(null);

  useEffect(() => {
    const enlace = `${window.location.origin}/?sala=${codigo}`;
    QRCode.toDataURL(enlace, {
      width: 520,
      margin: 2,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    })
      .then(setImagen)
      .catch(() => setImagen(null));
  }, [codigo]);

  return (
    <div className="rounded-2xl bg-white p-3 shadow-lg">
      {imagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagen} alt={`Código QR para unirse a la sala ${codigo}`} className="h-52 w-52" />
      ) : (
        <div className="flex h-52 w-52 items-center justify-center text-sm text-poke-noche/60">
          Generando QR…
        </div>
      )}
    </div>
  );
}

/** Estado mientras el rival todavía no se ha unido. */
function VistaEsperando({ estado }: { estado: VistaEstado }) {
  const yo = estado.tu!;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-5 py-8 text-center">
      <header>
        <h1 className="text-2xl font-black text-poke-amarillo">Sala creada</h1>
        <p className="mt-1 text-sm text-white/80">
          Tu rival debe escanear este QR o escribir el código.
        </p>
      </header>

      {/* Código bien grande */}
      <div className="w-full tarjeta-panel py-6">
        <p className="text-xs font-bold uppercase tracking-widest text-white/60">Código de sala</p>
        <p
          className="mt-2 text-5xl font-black tracking-[0.3em] text-white"
          data-prueba="codigo-sala"
        >
          {estado.codigo}
        </p>
      </div>

      <CodigoQR codigo={estado.codigo} />

      {/* Estado de los jugadores */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="tarjeta-panel flex w-full items-center gap-3 px-4 py-3">
          <span className="h-5 w-5 rounded-full border-2 border-white/60" style={{ backgroundColor: yo.color }} />
          <span className="font-extrabold">{yo.apodo} (tú)</span>
          <span className="ml-auto text-xs font-bold uppercase text-green-400">Conectado</span>
        </div>
        <div className="tarjeta-panel flex w-full items-center gap-3 px-4 py-3">
          <span className="h-5 w-5 rounded-full border-2 border-dashed border-white/40" />
          <span className="font-bold text-white/60">Esperando al rival…</span>
          <span className="ml-auto animate-latido text-lg">⏳</span>
        </div>
      </div>
    </main>
  );
}

/** Estado de elección de equipo: 1 activo + 2 reservas. */
function VistaEligiendo({ estado, enviar }: { estado: VistaEstado; enviar: EnviarAccion }) {
  const yo = estado.tu!;
  const rival = estado.rival;
  const [seleccion, setSeleccion] = useState<string[]>(yo.seleccion);
  // Contenido de la última selección enviada (evita ecos UI↔servidor)
  const ultimoEnviado = useRef<string>("");

  // Si el servidor sabe una selección distinta (p. ej. tras «Cambiar mi equipo»),
  // se muestra; la comparación es por CONTENIDO para no provocar bucles de render.
  useEffect(() => {
    if (yo.listo) return;
    const misma = seleccion.length === yo.seleccion.length &&
      seleccion.every((id, i) => id === yo.seleccion[i]);
    if (!misma) {
      setSeleccion([...yo.seleccion]);
    }
  }, [yo.listo, yo.seleccion, seleccion]);

  function alternarPokemon(id: string) {
    if (yo.listo) return; // bloqueado hasta pulsar «Editar»
    setSeleccion((actual) => {
      if (actual.includes(id)) {
        return actual.filter((p) => p !== id);
      }
      if (actual.length >= 3) {
        return actual; // máximo 3: quita uno antes de añadir otro
      }
      return [...actual, id];
    });
  }

  // Cada cambio real de selección se envía al servidor (fuente autoritativa):
  // solo se envía si el contenido difiere de lo último enviado.
  useEffect(() => {
    if (yo.listo) return;
    const contenido = seleccion.join(",");
    if (contenido === ultimoEnviado.current) return;
    ultimoEnviado.current = contenido;
    enviar("sala:seleccionarEquipo", { pokemonIds: seleccion });
  }, [seleccion, yo.listo, enviar]);

  const slots = [
    { titulo: "Activo ⭐", id: seleccion[0] },
    { titulo: "Reserva 1", id: seleccion[1] },
    { titulo: "Reserva 2", id: seleccion[2] },
  ];

  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <header className="text-center">
        <h1 className="text-2xl font-black text-poke-amarillo">Elige tu equipo</h1>
        <p className="mt-1 text-sm text-white/80">
          Toca 3 Pokémon: el primero será tu <strong>activo</strong> y los otros 2 de reserva.
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/50">
          Sala {estado.codigo}
        </p>
      </header>

      {/* Estado de los dos jugadores */}
      <div className="grid grid-cols-2 gap-2">
        <div className="tarjeta-panel px-3 py-2 text-center text-sm">
          <span className="font-extrabold">{yo.apodo}</span>
          <p className="text-xs text-white/70">
            {yo.listo ? "✅ ¡Listo!" : `Elegidos: ${seleccion.length}/3`}
          </p>
        </div>
        <div className="tarjeta-panel px-3 py-2 text-center text-sm">
          <span className="font-extrabold">{rival?.apodo ?? "Rival"}</span>
          <p className="text-xs text-white/70">
            {rival?.listo
              ? "✅ ¡Listo!"
              : rival
                ? `Elegidos: ${rival.seleccionCount}/3`
                : "Sin rival"}
          </p>
        </div>
      </div>

      {/* Ranuras elegidas */}
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const datos = slot.id ? CATALOGO_POKEMON.find((p) => p.id === slot.id) : null;
          return (
            <div key={slot.titulo} className="tarjeta-panel flex flex-col items-center p-2 text-center">
              {datos ? (
                <>
                  <ImagenPokemon sprite={datos.sprite} nombre={datos.nombre} tipos={datos.tipos} tamano={48} />
                  <p className="mt-1 text-xs font-bold leading-tight">{datos.nombre}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-poke-amarillo">
                    {slot.titulo}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/30 text-xl">
                    +
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/60">
                    {slot.titulo}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Botones Listo / Editar */}
      {yo.listo ? (
        <div className="space-y-2 text-center">
          <p className="animate-latido text-sm font-bold text-poke-amarillo">
            ¡Listo! Esperando a que el rival acabe…
          </p>
          <button className="btn-secundario" onClick={() => enviar("sala:listo", { listo: false })}>
            ✏️ Cambiar mi equipo
          </button>
        </div>
      ) : (
        <button
          className="btn-rojo"
          disabled={seleccion.length !== 3}
          onClick={() => enviar("sala:listo", { listo: true })}
        >
          ✅ Listo
        </button>
      )}

      {/* Catálogo de Hoenn */}
      <div className="grid grid-cols-3 gap-2">
        {CATALOGO_POKEMON.map((pokemon) => {
          const indice = seleccion.indexOf(pokemon.id);
          const esActivo = indice === 0;
          const elegido = indice >= 0;
          return (
            <button
              key={pokemon.id}
              onClick={() => alternarPokemon(pokemon.id)}
              className={`tarjeta-panel flex flex-col items-center p-2 text-center transition active:scale-95 ${
                elegido ? (esActivo ? "ring-4 ring-poke-amarillo" : "ring-2 ring-poke-azul") : "opacity-90"
              }`}
            >
              <ImagenPokemon sprite={pokemon.sprite} nombre={pokemon.nombre} tipos={pokemon.tipos} tamano={56} />
              <p className="mt-1 text-xs font-extrabold leading-tight">{pokemon.nombre}</p>
              <div className="mt-1">
                <EtiquetasTipo tipos={pokemon.tipos} pequenas />
              </div>
              <p className="mt-0.5 text-[10px] font-bold text-white/70">❤️ {pokemon.hp}</p>
              {elegido && (
                <span className="mt-0.5 rounded-full bg-poke-amarillo px-1.5 text-[10px] font-black text-poke-noche">
                  {esActivo ? "ACTIVO" : `RESERVA ${indice}`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}

/** Pantalla de sala completa: decide entre espera y elección. */
export function PantallaSala({ estado, enviar }: { estado: VistaEstado; enviar: EnviarAccion }) {
  if (estado.estadoSala === "esperando") {
    return <VistaEsperando estado={estado} />;
  }
  return <VistaEligiendo estado={estado} enviar={enviar} />;
}
