/** @type {import('next').NextConfig} */
const siguienteConfig = {
  // Las imágenes (sprites locales) se sirven sin optimizar para evitar
  // dependencias de procesamiento en el despliegue.
  images: {
    unoptimized: true,
  },
};

export default siguienteConfig;
