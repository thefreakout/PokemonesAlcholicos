"use client";

/**
 * Pantalla 1 — Inicio: título, campo de apodo, color de avatar y los botones
 * «Crear sala» y «Unirse con código». Sin registro: solo apodo y color.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VALORES } from "@/config/valores";
import { guardarPerfil, leerAvisoInicio, leerPerfil } from "@/lib/cliente/identidad";
import { BolaIcono } from "./BolaIcono";

// Caracteres válidos en un código de sala (sin vocales ni 0 ni 1 para evitar confusiones)
const LIMPIAR_CODIGO = /[^BCDFGHJKLMNPQRSTVWXYZ2-9]/g;

/** Limpia y normaliza un código de sala introducido a mano o por enlace. */
function limpiarCodigo(bruto: string): string {
  return bruto
    .toUpperCase()
    .replace(LIMPIAR_CODIGO, "")
    .slice(0, VALORES.codigoSalaLongitud);
}

export function PantallaInicio() {
  const router = useRouter();
  const parametros = useSearchParams();
  const codigoEnlace = parametros.get("sala") ?? "";

  const [apodo, setApodo] = useState("");
  const [color, setColor] = useState<string>(VALORES.coloresAvatar[0].valor);
  const [codigo, setCodigo] = useState("");
  const [modoUnirse, setModoUnirse] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Si el enlace llega con ?sala=XXXX (código QR), se rellena el código
  useEffect(() => {
    if (codigoEnlace) {
      setCodigo(limpiarCodigo(codigoEnlace));
      setModoUnirse(true);
    }
  }, [codigoEnlace]);

  // Recupera el último perfil usado y cualquier aviso pendiente (p. ej. «sala llena»)
  useEffect(() => {
    const perfil = leerPerfil();
    if (perfil) {
      setApodo(perfil.apodo);
      setColor(perfil.color);
    }
    const aviso = leerAvisoInicio();
    if (aviso) {
      setAviso(aviso);
    }
  }, []);

  function irASala(destino: "crear" | "unir") {
    if (!apodo.trim()) {
      setAviso("Escribe un apodo para jugar.");
      return;
    }
    if (destino === "unir") {
      const limpio = limpiarCodigo(codigo.trim());
      if (limpio.length !== VALORES.codigoSalaLongitud) {
        setAviso(`El código tiene ${VALORES.codigoSalaLongitud} letras o números.`);
        return;
      }
      guardarPerfil({ apodo: apodo.trim(), color });
      router.push(`/sala/${limpio}?modo=unir`);
      return;
    }
    guardarPerfil({ apodo: apodo.trim(), color });
    router.push("/sala/crear?modo=crear");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-5 py-8">
      {/* Título del juego */}
      <header className="text-center">
        <div className="mb-2 flex justify-center animate-latido">
          <BolaIcono tamano={72} />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-poke-amarillo drop-shadow">
          PokéCubata
        </h1>
        <p className="mt-1 text-2xl font-extrabold uppercase tracking-[0.3em] text-poke-rojo">
          Hoenn
        </p>
        <p className="mt-3 text-sm text-white/80">
          Partida 1 contra 1 · cada uno con su cubata · el que pierde, la termina 🍻
        </p>
      </header>

      {/* Apodo y color de avatar */}
      <section className="tarjeta-panel space-y-4 p-4">
        <div>
          <label htmlFor="apodo" className="mb-1 block text-sm font-bold uppercase tracking-wide text-white/80">
            Tu apodo
          </label>
          <input
            id="apodo"
            className="campo-texto"
            placeholder="Ej.: Maestro Hoenn"
            value={apodo}
            maxLength={12}
            onChange={(evento) => {
              setApodo(evento.target.value);
              setAviso(null);
            }}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-white/80">
            Color de tu avatar
          </p>
          <div className="flex flex-wrap gap-2">
            {VALORES.coloresAvatar.map((opcion) => (
              <button
                key={opcion.valor}
                aria-label={`Color ${opcion.nombre}`}
                onClick={() => setColor(opcion.valor)}
                className={`h-10 w-10 rounded-full border-4 transition ${
                  color === opcion.valor ? "scale-110 border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: opcion.valor }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Acciones principales */}
      <section className="space-y-3">
        <button className="btn-rojo text-xl" onClick={() => irASala("crear")}>
          🏟️ Crear sala
        </button>

        {modoUnirse ? (
          <div className="tarjeta-panel space-y-3 p-4">
            <label htmlFor="codigo" className="block text-sm font-bold uppercase tracking-wide text-white/80">
              Código de la sala
            </label>
            <input
              id="codigo"
              className="campo-texto text-3xl tracking-[0.4em]"
              placeholder="•••••"
              value={codigo}
              maxLength={VALORES.codigoSalaLongitud}
              inputMode="text"
              autoCapitalize="characters"
              onChange={(evento) => {
                setCodigo(limpiarCodigo(evento.target.value));
                setAviso(null);
              }}
            />
            <button className="btn-amarillo" onClick={() => irASala("unir")}>
              🚪 Entrar en la sala
            </button>
            <button
              className="w-full text-xs font-bold uppercase tracking-wide text-white/60"
              onClick={() => setModoUnirse(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button className="btn-azul" onClick={() => setModoUnirse(true)}>
            🔗 Unirse con código
          </button>
        )}

        {aviso && (
          <p className="animate-aparece rounded-xl bg-poke-rojo/30 border border-poke-rojo px-3 py-2 text-center text-sm font-bold">
            {aviso}
          </p>
        )}
      </section>

      <footer className="text-center text-xs text-white/50">
        Juego para adultos (18+). Bebe con cabeza y con responsabilidad.
      </footer>
    </main>
  );
}
