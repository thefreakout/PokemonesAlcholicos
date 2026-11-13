/**
 * Icono de Pokéball en SVG, usado en el título y detalles de la interfaz.
 */
export function BolaIcono({ tamano = 40 }: { tamano?: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="inline-block drop-shadow"
    >
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#1F2937" strokeWidth="6" />
      <path d="M4 50a46 46 0 0 1 92 0Z" fill="#E3350D" />
      <rect x="4" y="45" width="92" height="10" fill="#1F2937" />
      <circle cx="50" cy="50" r="16" fill="#fff" stroke="#1F2937" strokeWidth="6" />
      <circle cx="50" cy="50" r="7" fill="#E5E7EB" stroke="#1F2937" strokeWidth="3" />
    </svg>
  );
}
