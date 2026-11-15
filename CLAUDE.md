# CLAUDE.md — Roleros

App de la campaña de rol de Dan (Pathfinder 1e, Ustalav), con 3 jugadores. UI en **español de España**, mobile-first, 480 px de ancho máximo (el biombo llega a 720).

> ⚠️ **El repo es público** (GitHub Pages gratis lo exige) y **la campaña tiene un secreto**.
> - `HANDOFF.md` y `master/` están en `.gitignore`: ahí va la premisa y el material de máster.
> - En el código, los commits, los seeds y las migraciones **no puede aparecer nada de la trama**. Este mismo fichero es público: no la describas aquí.
> - Fichas, cartas y secretos viven **solo en la base de datos**.

## Distribución: solo la web

- **Todos usan la web**: <https://danmelendo.github.io/Roleros/>.
  - En iPhone: Safari → *Añadir a pantalla de inicio*.
  - En Android: Chrome → *Instalar app*.
- **[web.yml](.github/workflows/web.yml)** la publica en cada push a `main`.
- **No se generan APK** (decisión de Dan, 2026-11-15).
  - `android/` y las dependencias de Capacitor siguen en el repo por si algún día se retoma, pero no se mantienen. No ejecutes `npm run apk`.

## Estructura

- **Web estática:** Vite 6 + React 19 + TypeScript, con TanStack Router (**hash history**) y TanStack Query. `base: "./"`. Nada de SSR.
- **Datos:** Supabase. Puesta en marcha y estado en [supabase/README.md](supabase/README.md).
  - Para ejecutar SQL sin contraseña: `npm run sql -- fichero.sql`.
- **Wakeup:** [despertar.yml](.github/workflows/despertar.yml) hace una consulta real cada 2 días.

```
src/
  main.tsx              QueryClient + Router + fuentes + service worker
  router.tsx            /  ·  /j/$id (ficha, petate, acciones, cuestionario)  ·  /master  ·  /master/acciones  ·  /master/$id
  lib/api.ts            TODAS las llamadas a Supabase, tipadas
  lib/ficha.ts          ESQUEMA de la ficha (lo usan el biombo y el jugador), PLANTILLA, estaVisible()
  lib/formato.ts        tipos de acción, oro, fechas relativas
  lib/sesion.ts         useSesion(): sesión + es_master()
  lib/jugador.ts        jugador elegido en localStorage
  components/Ojo.tsx    interruptor de revelado
  views/Jugador.tsx     cabecera y pestañas del jugador (+ punto de "el máster te ha contestado")
  views/                Ficha, Petate, Acciones, Cuestionario · Master, MasterAcciones, MasterJugador
supabase/migrations/    esquema, RLS y funciones
supabase/seeds/         cuestionario (las preguntas, sin trama)
```

## Reglas que no se rompen

- **El jugador nunca recibe datos ocultos.**
  - Las tablas privadas no tienen políticas para `anon`.
  - El jugador lee por RPC (`get_ficha_revelada`, `get_mi_petate`, `get_mis_acciones`, `get_mis_respuestas`).
  - No añadas `select` a `fichas`, `inventario` ni `acciones_offrol` en código del jugador.
- **Escrituras de `anon` solo por funciones `security definer` que validan lo que reciben:** `enviar_respuesta`, `crear_accion` (máximo 10 pendientes) y `retirar_accion` (solo si está pendiente). Ninguna política de `insert` para `anon`.
- **Máster = sesión + fila en `masters`.** `es_master()` es la puerta de todas las políticas. El registro público está cerrado. El login acepta `Dan`, que se traduce a `dan@roleros.local`.
- **`resolver_accion` es atómica:** responde, mueve el oro (sin dejarlo en negativo) y mete objetos en `inventario`, todo en una transacción. No lo repartas en llamadas sueltas desde el cliente.
- **Ficha = JSON libre, sin motor de reglas de PF1e.** Se edita con formulario, nunca en JSON.
  - Las listas van como objetos con clave estable (`dotes.dote-1`), nunca arrays.
  - Las claves van en minúsculas ascii (lo exige el `CHECK` de `campo_path`).
  - Las claves que no están en `ESQUEMA` se conservan al guardar.
- **Los objetos no van en la ficha: van en el petate** (`inventario` + `jugadores.oro`). Un objeto con `visible = false` existe, pero el jugador no lo ve.
- **Los PG se ven siempre.** Revelar un padre revela todo lo que cuelga de él.
- **Para comparar fichas usa `canon()`**, que ordena las claves. jsonb las devuelve reordenadas, y un `JSON.stringify` a secas dejaba el aviso de "Cambios sin guardar" encendido tras guardar.
- **El editor no se pinta hasta tener ficha y revelados**: si arrancara con la plantilla y se guardara antes de tiempo, machacaría la ficha.
- **Service worker:**
  - nunca cachea Supabase;
  - la navegación va con `cache: "no-cache"` (GitHub Pages manda `max-age=600` y si no se servía un `index.html` viejo);
  - si cambias su estrategia, sube `VERSION`.

## Aspecto: libro antiguo

- **Fondo de cuero (`--cuero`) y tarjetas de pergamino (`.pagina`)**, con tinta parda y títulos en rojo de rúbrica.
- **Fuentes servidas desde la app** (`@fontsource`, subconjunto latin): Cinzel (títulos, etiquetas y botones), EB Garamond (texto) y UnifrakturMaguntia (solo el título y la capitular del trasfondo). No metas Google Fonts por URL.
- **Todas las tarjetas pesan lo mismo:** lo no revelado se marca con "?" dentro, sin apagar la tarjeta. Dan pidió que ninguna destaque sobre las demás y que todo sea compacto.

## Comandos

```bash
npm run dev       # navegador (host: true → se abre desde el móvil por la IP local)
npm run build     # tsc + vite. Ejecútalo tras cada bloque de cambios
npm run sql -- supabase/seeds/cuestionario.sql
```
