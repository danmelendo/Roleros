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
  router.tsx            /  ·  /instalar  ·  /j/$id (ficha, petate, acciones, diario, cuestionario)  ·  /master  ·  /master/acciones  ·  /master/combate  ·  /master/$id
  lib/instalar.ts       plataforma, ¿ya instalada?, botón de instalar de Chrome (beforeinstallprompt)
  lib/api.ts            TODAS las llamadas a Supabase, tipadas
  lib/ficha.ts          ESQUEMA de la ficha (lo usan el biombo y el jugador), PLANTILLA, estaVisible()
  lib/formato.ts        tipos de acción, oro, fechas relativas
  lib/sesion.ts         useSesion(): sesión + es_master()
  lib/jugador.ts        jugador elegido en localStorage
  lib/reglas/           datos del Manual básico de PF1e (razas, clases 1-5, conjuros 0-3) y aplicar() del asistente
  components/Asistente.tsx  asistente de raza/clase y selector de conjuros (lazy: solo se descarga en el biombo)
  components/Ojo.tsx    interruptor de revelado
  components/Retrato.tsx  retrato redondo; reduce la foto en el cliente antes de subirla
  views/Jugador.tsx     cabecera y pestañas del jugador (+ punto de "el máster te ha contestado")
  views/                Ficha (con pantalla de espera), Petate, Acciones, Diario, Cuestionario · Master, MasterAcciones, MasterJugador, MasterCombate
  combate/              mesa de combate del máster (portátil): mesa.ts (motor), bloque.ts (lee bloques de d20pfsrd), datos.ts (estados y conjuros), mesa.css
supabase/migrations/    esquema, RLS y funciones
supabase/seeds/         cuestionario (las preguntas, sin trama)
```

## Reglas que no se rompen

- **El jugador nunca recibe datos ocultos.**
  - Las tablas privadas no tienen políticas para `anon`.
  - El jugador lee por RPC (`get_ficha_revelada`, `get_mi_petate`, `get_mis_acciones`, `get_mis_respuestas`, `get_mi_diario`, `get_retrato`).
  - No añadas `select` a `fichas`, `inventario`, `acciones_offrol`, `diario` ni `retratos` en código del jugador.
- **Jugadores:** el máster los da de alta desde el biombo (`crearJugador`). El id es un slug del nombre (`maria-jose`) y no se cambia nunca: todas las tablas cuelgan de él.
  - Nombre y color se editan en la página del jugador (`cambiarJugador`).
  - Dar de baja es `activo = false`, nunca borrar: desaparece de la portada, las RPC del jugador le rechazan y el móvil que lo tenía elegido vuelve a la portada.
- **Primero el cuestionario:** mientras el jugador no haya respondido todas las preguntas activas, `JugadorLayout` solo enseña el cuestionario (sin pestañas ni retrato) y redirige ahí cualquier otra ruta. Ojo: añadir una pregunta nueva vuelve a cerrar la app a quien no la haya respondido.
- **La ficha tiene puerta:** `get_ficha_revelada` devuelve `null` mientras el jugador no haya respondido todas las preguntas activas o la ficha no tenga `asignada = true` (el tick del biombo). El cliente solo decide qué mensaje de espera enseña; la puerta es del servidor.
- **Escrituras de `anon` solo por funciones `security definer` que validan lo que reciben:** `enviar_respuesta`, `crear_accion` (máximo 10 pendientes), `retirar_accion` (solo si está pendiente), `escribir_diario` / `borrar_diario` (máximo 300 entradas) y `poner_retrato` (data URL de imagen, ≤ 400 KB). Ninguna política de `insert` para `anon`.
- **Máster = sesión + fila en `masters`.** `es_master()` es la puerta de todas las políticas. El registro público está cerrado. El login acepta `Dan`, que se traduce a `dan@roleros.local`.
- **`resolver_accion` es atómica:** responde, mueve el oro (sin dejarlo en negativo) y mete objetos en `inventario`, todo en una transacción. No lo repartas en llamadas sueltas desde el cliente.
- **Mesa de combate (`/master/combate`):**
  - Es una isla imperativa (`src/combate/mesa.ts`) montada en un Shadow DOM: sus estilos no se mezclan con los de la app. Pinta con plantillas de texto; escapa todo con `esc()`.
  - Su estado vive en el `localStorage` del portátil (`roleros:mesa-combate`), no en Supabase.
  - **No tira dados.** Dan tira con dados físicos en la mesa: la mesa solo apunta (iniciativas, daño, estados, efectos y sus rondas). Nada de botones de tirar ataques, salvaciones ni iniciativas.
  - Los PJ se añaden a la mesa a mano desde la pestaña Grupo, que relee las fichas cada vez que se abre.
  - PNJ con bando: enemigo, aliado de paso o **compañero del grupo** (espadas de alquiler que lleva Dan). Los compañeros, como los PJ, se quedan entre combates con sus PG; el resto se va al terminar. Las fichas de PNJ guardadas también viven solo en el portátil.
  - Los PJ salen de las fichas (`pjsParaCombate`). PG máx., CA, iniciativa, salvaciones, etc. mandan siempre las fichas; los PG actuales solo fuera de combate.
  - Solo escribe en las fichas cuando el máster lo pide, y solo `pg.actual`, con `poner_pg` (nunca un `guardarFicha` desde la mesa).
- **Ficha = JSON libre, sin motor de reglas de PF1e.** Se edita con formulario, nunca en JSON.
  - El **asistente PF1e** del biombo escribe una vez lo que dan raza y clase (atributos, rasgos, habilidades de clase, ataque base, salvaciones, PG, conjuros al día) y todo sigue siendo editable. Para poder repetirlo sin duplicar, apunta en `asistente` (clave oculta) lo que sumó, y sus rasgos llevan `origen` ("raza" / "clase").
  - Las listas se pintan con `ordenados()` (por `orden`), porque jsonb reordena las claves.
  - Las listas van como objetos con clave estable (`dotes.dote-1`), nunca arrays.
  - Las claves van en minúsculas ascii (lo exige el `CHECK` de `campo_path`).
  - Las claves que no están en `ESQUEMA` se conservan al guardar.
- **Habilidades = catálogo fijo de PF1e** (`HABILIDADES` en `ficha.ts`, con clave estable por habilidad: `habilidades.percepcion`).
  - Se rellenan rangos, «de clase» y otros; `conTotales()` calcula el total (rangos + atributo + 3 de clase con rangos + otros + `penalizador_armadura`) y **se guarda con la ficha**, para que el jugador vea el total sin tener revelados los atributos. `total = null`: solo entrenada y sin rangos.
  - Artesanía, Interpretar y Profesión admiten copias (`artesania-2`, con `base`).
  - La mesa de combate lee la Percepción de `habilidades.percepcion.total`.
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
- **Márgenes seguros:** `.shell` deja `--hueco-abajo` (zona segura + 88 px) bajo el último botón, porque la barra flotante de Safari y la de gestos de Android tapan la página sin contar como zona segura. Lo fijo abajo usa `var(--sb)`.
- **Todas las tarjetas pesan lo mismo:** lo no revelado se marca con "?" dentro, sin apagar la tarjeta. Dan pidió que ninguna destaque sobre las demás y que todo sea compacto.

## Comandos

```bash
npm run dev       # navegador (host: true → se abre desde el móvil por la IP local)
npm run build     # tsc + vite. Ejecútalo tras cada bloque de cambios
npm run sql -- supabase/seeds/cuestionario.sql
```
