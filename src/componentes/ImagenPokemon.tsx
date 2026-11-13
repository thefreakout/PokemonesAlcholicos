"use client";

/**
 * Sprite de un Pokémon con la copia local guardada en /public/sprites.
 * Si el sprite no está descargado todavía, muestra un marcador con la
 * inicial sobre el color del tipo (la partida sigue siendo jugable).
 */

import { COLORES_TIPO } from "@/motor/vista";

export function ImagenPokemon({
  sprite,
  nombre,
  tipos,
  tamano = 96,
  className = "",
}: {
  sprite: string;
  nombre: string;
  tipos: string[];
  tamano?: number;
  className?: string;
}) {
  const colorTipo = COLORES_TIPO[tipos[0]] ?? "#6B7280";

  return (
    <div
      className={`relative shrink-0 rounded-full ${className}`}
      style={{ width: tamano, height: tamano }}
    >
      {/* El sprite local se pide a la ruta pública; onerror muestra el marcador */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sprite}
        alt={`Sprite de ${nombre}`}
        width={tamano}
        height={tamano}
        loading="eager"
        className="relative z-10 h-full w-full object-contain"
        onError={(evento) => {
          const imagen = evento.currentTarget;
          imagen.style.visibility = "hidden";
        }}
      />
      {/* Marcador de respaldo debajo del sprite */}
      <div
        className="absolute inset-0 z-0 flex items-center justify-center rounded-full border-2 border-white/30 font-extrabold text-white"
        style={{ backgroundColor: colorTipo, fontSize: tamano * 0.4 }}
        aria-hidden="true"
      >
        {nombre.charAt(0)}
      </div>
    </div>
  );
}

/** Pequeñas etiquetas de tipo con su color clásico. */
export function EtiquetasTipo({ tipos, pequenas = false }: { tipos: string[]; pequenas?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tipos.map((tipo) => (
        <span
          key={tipo}
          className={`rounded-full font-bold text-white ${pequenas ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"}`}
          style={{ backgroundColor: COLORES_TIPO[tipo] ?? "#6B7280" }}
        >
          {tipo}
        </span>
      ))}
    </div>
  );
}
