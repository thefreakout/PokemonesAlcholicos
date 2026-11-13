"use client";

/**
 * Barra de vida (HP) de un Pokémon, con color según la vida restante
 * y transición suave al perder o recuperar vida.
 */
export function BarraHP({ hpActual, hpMax }: { hpActual: number; hpMax: number }) {
  const porcentaje = hpMax > 0 ? Math.max(0, Math.min(100, (hpActual / hpMax) * 100)) : 0;
  const color =
    porcentaje > 50 ? "bg-green-500" : porcentaje > 25 ? "bg-yellow-400" : "bg-red-500";

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/80">
        <span>HP</span>
        <span>
          {hpActual}/{hpMax}
        </span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-black/40 border border-white/20">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
