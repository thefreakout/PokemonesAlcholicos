"use client";

/**
 * Enrutador de la sala: conecta con el servidor y decide qué pantalla
 * mostrar según el estado autoritativo (sala → partida → final).
 *
 * La URL es /sala/[codigo], o /sala/crear cuando quien entra va a crear
 * la sala nueva (el código real lo genera el servidor).
 */

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { usarSala } from "@/lib/cliente/usarSala";
import { PantallaSala } from "@/componentes/PantallaSala";
import { PantallaPartida } from "@/componentes/PantallaPartida";
import { PantallaFinal } from "@/componentes/PantallaFinal";

export default function PaginaSala() {
  const parametros = useParams<{ codigo: string }>();
  const codigoParametro = Array.isArray(parametros.codigo) ? parametros.codigo[0] : parametros.codigo;
  const modo = codigoParametro?.toUpperCase() === "CREAR" ? "crear" : "unir";
  const codigo = modo === "crear" ? "" : (codigoParametro ?? "").toUpperCase();

  const router = useRouter();
  const { estado, conectado, error, expulsado, enviar } = usarSala(codigo, modo);

  // El creador entra por /sala/crear: en cuanto el servidor asigna el código
  // real, pasamos a /sala/<código> para que una recarga reconecte sin problemas.
  useEffect(() => {
    if (modo === "crear" && estado?.codigo) {
      router.replace(`/sala/${estado.codigo}?modo=unir`);
    }
  }, [modo, estado?.codigo, router]);

  // Si el servidor rechaza el acceso (sala inexistente o completa), al inicio
  useEffect(() => {
    if (expulsado) {
      router.replace("/");
    }
  }, [expulsado, router]);

  // Pantalla de espera mientras llega la primera vista del servidor
  if (!estado) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <p className="animate-latido text-4xl">🍖</p>
          <p className="mt-2 text-sm font-bold text-white/70">
            {conectado ? "Preparando la sala…" : "Conectando con el servidor…"}
          </p>
          {error && <p className="mt-2 text-sm font-bold text-poke-amarillo">{error}</p>}
        </div>
      </main>
    );
  }

  switch (estado.estadoSala) {
    case "esperando":
    case "eligiendo":
      return (
        <>
          {error && <AvisoError mensaje={error} />}
          <PantallaSala estado={estado} enviar={enviar} />
        </>
      );
    case "finalizada":
      return (
        <>
          {error && <AvisoError mensaje={error} />}
          <PantallaFinal estado={estado} enviar={enviar} />
        </>
      );
    default:
      // jugando y pausada usan la misma pantalla (la pausa es una superposición)
      return (
        <>
          {error && <AvisoError mensaje={error} />}
          <PantallaPartida estado={estado} conectado={conectado} enviar={enviar} />
        </>
      );
  }
}

function AvisoError({ mensaje }: { mensaje: string }) {
  return (
    <div className="fixed left-1/2 top-3 z-[60] w-[92%] max-w-md -translate-x-1/2 animate-aparece rounded-xl border border-poke-rojo bg-poke-rojo/90 px-3 py-2 text-center text-sm font-bold shadow-lg">
      {mensaje}
    </div>
  );
}
