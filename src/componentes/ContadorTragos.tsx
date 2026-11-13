"use client";

/**
 * Contador manual de bebida de un jugador.
 * La app solo cuenta: cada jugador confirma lo que bebe de verdad desde la
 * hoja de tragos pendientes («Los bebo» / «Cuenta la mitad»).
 */

import { useEffect, useRef, useState } from "react";

export function ContadorTragos({
  apodo,
  color,
  tragos,
  chupitos,
  esMiJugador,
}: {
  apodo: string;
  color: string;
  tragos: number;
  chupitos: number;
  esMiJugador: boolean;
}) {
  // Anima el vaso cuando aumenta la cuenta confirmada
  const [llenando, setLlenando] = useState(false);
  const tragosAntes = useRef(tragos);

  useEffect(() => {
    if (tragos > tragosAntes.current) {
      setLlenando(true);
      const temporizador = setTimeout(() => setLlenando(false), 900);
      tragosAntes.current = tragos;
      return () => clearTimeout(temporizador);
    }
    tragosAntes.current = tragos;
  }, [tragos]);

  return (
    <div className="tarjeta-panel flex items-center gap-3 px-3 py-2">
      {/* Vaso con relleno animado */}
      <div
        className="relative h-9 w-7 overflow-hidden rounded-b-lg rounded-t-sm border-2 border-white/60"
        aria-hidden="true"
      >
        <div
          className={`absolute bottom-0 left-0 w-full bg-amber-300 ${llenando ? "animate-relleno-vaso" : ""}`}
          style={{ height: llenando ? "100%" : `${Math.min(100, tragos * 10)}%` }}
        />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full border border-white/40"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-extrabold">
            {apodo}
            {esMiJugador ? " (tú)" : ""}
          </span>
        </div>
        <p className="text-xs text-white/80" data-prueba="contador">
          🍺 {tragos} tragos · 🥃 {chupitos} chupitos
        </p>
      </div>
    </div>
  );
}

/** Etiqueta pequeña con los tragos pendientes de confirmar de un jugador. */
export function EtiquetaPendientes({ tragos, chupitos }: { tragos: number; chupitos: number }) {
  if (tragos <= 0 && chupitos <= 0) return null;
  const partes: string[] = [];
  if (tragos > 0) partes.push(`🍺 ${tragos}`);
  if (chupitos > 0) partes.push(`🥃 ${chupitos}`);
  return (
    <span className="animate-latido rounded-full bg-poke-amarillo px-2 py-0.5 text-xs font-extrabold text-poke-noche">
      Pendiente: {partes.join(" + ")}
    </span>
  );
}
