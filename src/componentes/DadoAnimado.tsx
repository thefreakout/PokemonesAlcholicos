"use client";

/**
 * Dado de 6 caras con animación: puntos dibujados en CSS y una superposición
 * que gira el dado mientras «tira» el resultado que ha decidido el servidor.
 */

const CARAS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [26, 26],
    [50, 50],
    [74, 74],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 26],
    [72, 26],
    [28, 50],
    [72, 50],
    [28, 74],
    [72, 74],
  ],
};

export function DadoCaras({ valor, tamano = 56, girando = false }: { valor: number; tamano?: number; girando?: boolean }) {
  const puntos = CARAS[valor] ?? CARAS[1];
  return (
    <div
      className={`relative rounded-2xl border-4 border-poke-noche bg-white shadow-lg ${girando ? "animate-dado-gira" : ""}`}
      style={{ width: tamano, height: tamano }}
      aria-label={`Dado: ${valor}`}
      role="img"
    >
      {puntos.map(([x, y], indice) => (
        <span
          key={indice}
          className="absolute rounded-full bg-poke-rojo"
          style={{
            width: tamano * 0.16,
            height: tamano * 0.16,
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

/** Superposición a pantalla completa con la animación del dado y su resultado. */
export function AnimacionDado({
  valor,
  texto,
  alTerminar,
}: {
  valor: number;
  texto: string;
  alTerminar: () => void;
}) {
  // Fase 1: girando (0.9 s) · Fase 2: resultado visible (1.2 s)
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm"
      onClick={alTerminar}
      role="presentation"
    >
      <div className="animate-golpe">
        <DadoCaras valor={valor} tamano={110} girando />
      </div>
      <div className="animate-aparece text-center">
        <p className="text-3xl font-extrabold text-poke-amarillo">{valor}</p>
        <p className="mt-1 text-base font-bold text-white">{texto}</p>
      </div>
    </div>
  );
}
