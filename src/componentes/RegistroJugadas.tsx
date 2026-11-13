"use client";

/**
 * Registro de jugadas en vivo: lista de lo que ha pasado en la partida,
 * con un emoji por tipo de jugada. Se muestra plegado en la partida
 * y completo en la pantalla final.
 */

import { useState } from "react";
import type { EntradaRegistro } from "@/motor/tipos";

const EMOJIS: Record<EntradaRegistro["tipo"], string> = {
  sistema: "📣",
  ataque: "⚔️",
  dado: "🎲",
  bebida: "🍺",
  defensa: "🛡️",
  reto: "🎯",
  cambio: "🔄",
  turno: "⏱️",
  fin: "🏁",
};

export function RegistroJugadas({
  registro,
  completo = false,
}: {
  registro: EntradaRegistro[];
  completo?: boolean;
}) {
  const [expandido, setExpandido] = useState(completo);
  // Lo más reciente arriba
  const entradas = [...registro].reverse();
  const visibles = expandido ? entradas : entradas.slice(0, 3);

  return (
    <div className="tarjeta-panel p-2">
      <div className="scroll-fino max-h-40 space-y-1 overflow-y-auto pr-1 text-sm">
        {visibles.map((entrada) => (
          <p key={entrada.id} className="animate-aparece leading-snug text-white/90">
            <span className="mr-1">{EMOJIS[entrada.tipo]}</span>
            {entrada.texto}
          </p>
        ))}
        {visibles.length === 0 && (
          <p className="text-white/50">Todavía no ha pasado nada…</p>
        )}
      </div>
      {!completo && registro.length > 3 && (
        <button
          className="mt-1 text-xs font-bold uppercase tracking-wide text-poke-amarillo"
          onClick={() => setExpandido(!expandido)}
        >
          {expandido ? "Ver menos" : `Ver todo (${registro.length})`}
        </button>
      )}
    </div>
  );
}
