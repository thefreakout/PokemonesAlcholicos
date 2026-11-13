"use client";

/**
 * Ruta de la pantalla de inicio. `useSearchParams` necesita un límite
 * de Suspense cuando la página se genera de forma estática.
 */

import { Suspense } from "react";
import { PantallaInicio } from "@/componentes/PantallaInicio";

export default function Inicio() {
  return (
    <Suspense>
      <PantallaInicio />
    </Suspense>
  );
}
