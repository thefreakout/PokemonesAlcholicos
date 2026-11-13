# 🍻 PokéCubata Hoenn

Juego de beber con cartas Pokémon inventadas de la **tercera generación (Hoenn)**.
Partidas **1 contra 1 online**, cada jugador desde su propio móvil, con su cubata real
delante: la app no sustituye la bebida, la controla y la cuenta.

> 🎮 Juego para adultos (18+). Bebe con cabeza y con responsabilidad.

---

## 🧰 Tecnología

| Pieza | Elección |
|---|---|
| Interfaz | Next.js 14 (React 18) + TypeScript + Tailwind CSS |
| Tiempo real | Socket.IO (WebSockets) |
| Estado del juego | **Autoritativo en el servidor** (el cliente solo muestra y envía acciones) |
| Persistencia | Ninguna en esta fase: salas en memoria (interfaz `AlmacenSalas` lista para una BBDD) |
| PWA | Manifest + Service Worker propios (instalable desde el navegador, sin tiendas) |

Se puede desarrollar con **Visual Studio Code** o con **Visual Studio 2022**
(carga de trabajo de Node.js).

---

## 🚀 Instalación y arranque local

Requisitos: **Node.js 18.17 o superior** (probado con Node 26).

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Ya puedes crear una sala desde un navegador y
unirte desde otro (o desde una pestaña normal y otra de incógnito).

Otros comandos útiles:

```bash
npm run build      # compila la app para producción
npm start          # arranca en producción (antes: npm run build)
npm run sprites    # vuelve a descargar los sprites desde PokeAPI (ya incluidos)
npm run iconos     # regenera los iconos PNG de la PWA (ya incluidos)
npm run prueba-motor  # prueba de reglas sin servidor (21 comprobaciones)
npm run prueba        # simula una partida completa con 2 jugadores (necesita el servidor arrancado)
```

---

## 📱 Cómo probar con dos móviles en la misma WiFi

1. Averigua la IP local de tu ordenador:
   - **macOS/Linux:** `ipconfig getifaddr en0` (o `hostname -I` en Linux).
   - **Windows:** `ipconfig` → «Dirección IPv4».
2. Arranca el servidor aceptando conexiones externas (Next ya escucha en todas las interfaces):
   `npm run dev`
3. Desde el móvil (misma WiFi) abre `http://<IP-DEL-PC>:3000`.
4. Un móvil pulsa **«Crear sala»**: se muestra el código de 5 caracteres y un **código QR**.
5. El otro móvil pulsa **«Unirse con código»**: escanea el QR (o escribe el código) y entra.
6. ¡A jugar! El primer turno se sortea al azar.

> 💡 En la misma red local no hay que configurar nada. Si el móvil no conecta,
> revisa que el firewall del ordenador permita el puerto 3000.

---

## 🌐 Despliegue

### Railway (recomendado: soporta WebSockets de larga duración)

1. Sube el proyecto a un repositorio de GitHub.
2. En Railway: **New Project → Deploy from GitHub repo**.
3. Railway detecta Node.js automáticamente:
   - **Build command:** `npm run build`
   - **Start command:** `npm start` (Railway define `NODE_ENV=production` solo)
4. Genera un dominio público (Settings → Networking) y listo: crea la sala
   desde un móvil y el rival se une con el QR aunque esté en otra red.

### Vercel (solo interfaz)

Next.js despliega en Vercel sin cambios, **pero** el servidor personalizado de
`server.ts` (Socket.IO) no se ejecuta ahí: Vercel no mantiene WebSockets de larga
duración en su plataforma de funciones. Para jugar con sockets en Vercel haría
falta un servicio aparte (p. ej. un pequeño servidor en Railway solo para la API
de sockets). **Para este juego, usa Railway (o Render/Fly.io) y tendrás todo en
una sola pieza.**

---

## 🎲 Reglas resumidas

- **Preparación:** cada jugador elige **1 Pokémon activo y 2 de reserva** del
  catálogo de Hoenn (30 Pokémon con valores inventados). Cada Pokémon tiene HP
  y 2 cartas de ataque propias.
- **Mazo 1 · Ataque con dado (decisión de diseño «cartas con carácter»):**
  en tu turno juegas una carta de tu Pokémon activo y el servidor lanza el dado
  (animado en pantalla). El **daño total = daño de la carta + daño de la tabla
  del dado**, y la bebida sale de la tabla del dado o de la propia carta si trae
  una fija (al rival, al atacante o a todos). La **tirada 6 es fallo: 0 de daño
  y bebe el atacante 1 trago**. Algunas cartas traen efectos especiales que
  siguen los ejemplos de la sección 4.7 del documento fuente: curar HP (Milotic),
  saltarse el turno (Slaking, Flygon) o forzar un reto (Banette). Quien prefiera
  la interpretación estricta (solo tabla del dado) tiene el motor preparado para
  ajustarlo en un único punto: `atacar()` en `src/motor/juego.ts`.
- **Mazo 2 · Tragos y chupitos:** cartas de azar que reparten bebida según su texto
  (a ti, al rival, a todos o «elige quién bebe»).
- **Mazo 3 · Defensa:** la **Poción** cura 30 HP en tu turno y, como respuesta a
  un ataque recibido, reduce 1 trago del castigo (solo de bebidas originadas por
  un ataque). La **Regeneración** («rellenas el cubata») anula los tragos
  pendientes; usos por jugador y partida configurables en `valores.ts` (1 por defecto).
- **Mazo 4 · Retos:** el rival tiene 30 segundos para cumplirlo; si lo cumple no
  bebe y si no, bebe el castigo de la carta (3 tragos o 1 chupito).
- **Bebida manual:** la app muestra cuántos tragos tocan y cada jugador confirma
  con **«Los bebo»** o **«Cuenta la mitad»** lo que bebe de verdad (el divisor
  de «la mitad» también está en `valores.ts`).
- **Fin:** cuando los 3 Pokémon de un jugador quedan debilitados, pierde y debe
  terminarse su cubata. También hay botón de **«Rendirse»** y de **«Nueva partida»**.
- **Reconexión:** si un móvil pierde la red unos segundos, vuelve solo (con un
  token secreto de sesión que impide suplantaciones); si tarda más de 60 segundos,
  la sala se pausa hasta que regrese, y el plazo de un reto en curso se extiende
  por el tiempo real de pausa.

Los valores marcados como **[SUGERIDO]** en el documento de especificación
(tabla del dado desde la tirada 3, poción 30 HP, 30 s de reto, reserva de 2
Pokémon, pausa a los 60 s, etc.) están centralizados en `src/config/valores.ts`.

---

## 🗂️ Estructura del proyecto

```
server.ts                      → servidor Node.js: Next.js + Socket.IO en el mismo puerto
src/
  config/valores.ts            → TODOS los números del juego (archivo único editable)
  datos/                       → catálogo y cartas (editable sin tocar el motor)
    pokemon.ts                 →   30 Pokémon de Hoenn con 2 ataques cada uno
    mazo-tragos.ts             →   mazo 2: tragos y chupitos (azar)
    mazo-defensa.ts            →   mazo 3: poción y regeneración
    mazo-retos.ts              →   mazo 4: retos (añadir más = ampliar el mazo)
  motor/                       → MOTOR DEL JUEGO (solo servidor, nunca confía en el cliente)
    tipos.ts                   →   tipos compartidos con el cliente y eventos Socket.IO
    mazos.ts                   →   mezcla, robo y descartes
    juego.ts                   →   todas las reglas y acciones validadas
    vista.ts                   →   vistas filtradas por jugador (el rival nunca ve tu mano)
  servidor/                    → COMUNICACIÓN DEL SERVIDOR
    salas.ts                   →   almacén de salas en memoria (interfaz lista para BBDD)
    comunicacion.ts            →   eventos Socket.IO y difusión del estado
    tipos-internos.ts          →   estado completo y autoritativo de las salas
  app/                         → pantallas (App Router)
    page.tsx                   →   1. Inicio: apodo, color, crear/unirse
    sala/[codigo]/page.tsx     →   enrutador de sala
  componentes/                 → UI: sala (código + QR), partida (HP, mazos, dado, registro), final
  lib/cliente/                 → COMUNICACIÓN DEL CLIENTE (hook useSala, identidad local)
public/
  sprites/                     → copia local de los sprites (descargados de PokeAPI)
  iconos/                      → iconos PNG de la PWA
  manifest.json, sw.js         → PWA instalable
scripts/                       → utilidades (sprites, iconos y pruebas automáticas)
```

---

## ⚙️ Ajustar la intensidad del juego

Todos los números viven en **`src/config/valores.ts`**: tabla del dado, HP de la
poción, duración del reto, cartas iniciales, robos por turno, tamaño de mano,
segundos de pausa por desconexión… Los castigos de los retos están en
`src/datos/mazo-retos.ts` y la vida/daño de cada Pokémon en `src/datos/pokemon.ts`.
Cambia los valores y reinicia: no hay que tocar el motor.

---

## 🔮 Preparado para el futuro (aún sin implementar)

- **Modo por equipos (2 contra 2):** el estado de sala ya separa «jugadores» de
  «lado del equipo» solo parcialmente; ampliar `Sala.jugadores` a más de 2 con
  un campo `equipo` y recorrer en `difundirEstado` por lado es el punto de partida.
- **Mazos personalizados:** las cartas viven en `src/datos/`; basta con permitir
  que una sala reciba listas de cartas alternativas al crearla
  (`construirMazos()` sería el único punto a parametrizar).
- **Persistencia:** implementa la interfaz `AlmacenSalas`
  (src/servidor/salas.ts) con Redis/SQLite/Prisma y sustituye la instancia
  `almacenEnMemoria` en `comunicacion.ts`.

No se ha añadido ninguna otra función fuera del encargo.

---

## ✅ Verificación

- `npm run build` compila sin errores ni avisos.
- `npm run prueba-motor`: 27 comprobaciones de reglas (fallo sin daño, poción en
  turno y como respuesta solo contra ataques, regeneración de usos limitados,
  confirmación «cuenta la mitad», turnos, saltos de turno, rendición…).
- `npm run prueba` (con el servidor arrancado): partida real por sockets con dos
  jugadores — crear/unir, elegir, atacar con dado, cartas, retos, cambio de
  reserva, rendirse, nueva partida, reconexión con token y rechazo de suplantación.

La app fue además revisada por un panel de 13 agentes (cumplimiento del encargo,
motor, servidor, cliente, datos y QA en vivo, con verificación adversaria de
hallazgos); los defectos confirmados por esa revisión están corregidos en esta
versión: fallo del dado sin daño, eco de la selección de equipo, token secreto de
reconexión, límites por turno leídos de `valores.ts`, plazo de reto extendido por
la pausa real, cronómetro de reto sin desfase de reloj, tope de salas en memoria
y CORS cerrado al mismo origen.
