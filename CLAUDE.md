# CLAUDE.md — Roleros

App de la campaña de rol de Dan (Pathfinder 1e, Ustalav), con 3 jugadores. UI en **español de España**, mobile-first, 480 px de ancho máximo.

> ⚠️ **El repo es público** (GitHub Pages gratis lo exige) y **la campaña tiene un secreto**.
> - `HANDOFF.md` y `master/` están en `.gitignore`: ahí va la premisa y el material de máster.
> - En el código, los commits, los seeds y las migraciones **no puede aparecer nada de la trama**. Este mismo fichero es público: no la describas aquí.
> - Fichas, cartas y secretos viven **solo en la base de datos**.

## Estructura (calcada de RPGym, `F:\Proyectos\forja-habito-app`)

- **Web estática**: Vite 6 + React 19 + TypeScript, con TanStack Router (**hash history**) y TanStack Query. `base: "./"`.
  - El mismo `dist/` sirve en el APK (`file://`) y en GitHub Pages (`/Roleros/`).
  - **Nada de SSR ni de server functions**: los dos destinos son estáticos.
- **Android**: Capacitor 7 (`npm run apk`). AGP 8.7.2, SDK 35 y JDK 21 del JBR de Android Studio (`org.gradle.java.home` en `android/gradle.properties`). APK → `android/app/build/outputs/apk/debug/app-debug.apk`. Se reparten como GitHub Release, sin versionarlos.
- **iPhone**: [web.yml](.github/workflows/web.yml) publica en Pages en cada push a `main`. Desde Safari, *Añadir a pantalla de inicio*.
- **Datos**: Supabase. Puesta en marcha en [supabase/README.md](supabase/README.md).
- **Wakeup**: [despertar.yml](.github/workflows/despertar.yml) hace una consulta real cada 2 días.

```
src/
  main.tsx            QueryClient + Router + service worker (solo web)
  router.tsx          rutas: / · /j/$jugadorId · /j/$jugadorId/cuestionario · /master · /master/$jugadorId
  lib/supabase.ts     cliente; nubeConfigurada = hay .env
  lib/api.ts          TODAS las llamadas a Supabase, tipadas
  lib/ficha.ts        secciones, etiquetas, rutasDe(), PLANTILLA
  lib/sesion.ts       useSesion(): sesión + es_master()
  lib/jugador.ts      jugador elegido en localStorage
  views/              Inicio, Ficha, Cuestionario, Master, MasterJugador
supabase/migrations/  esquema y RLS
```

## Reglas que no se rompen

- **El jugador nunca recibe la ficha completa.**
  - `fichas` y `ficha_revelado` no tienen políticas para `anon`.
  - El jugador lee solo con la RPC `get_ficha_revelada`.
  - No añadas un `select` a `fichas` en código del jugador, ni una política para `anon` en esas tablas.
- **Escrituras de `anon` solo por funciones `security definer` con validación** (`enviar_respuesta`). Nada de políticas de `insert` para `anon`.
- **Máster = sesión + fila en `masters`.** `es_master()` es la puerta de todas las políticas. El registro público está cerrado en Supabase.
- **Ficha = JSON libre, sin motor de reglas de PF1e.**
  - Las listas van como objetos con clave (`dotes.soltura-espada`), nunca arrays.
  - Las claves van en minúsculas ascii, con `-` o `_`. Lo exige el `CHECK` de `campo_path`.
- **Los PG se ven siempre** (los fuerza `get_ficha_revelada`). Revelar un padre revela todo lo que cuelga de él.
- **El service worker nunca cachea Supabase.**

## Comandos

```bash
npm run dev       # navegador (host: true → se abre desde el móvil por la IP local)
npm run build     # tsc + vite. Ejecútalo tras cada bloque de cambios
npm run apk       # build + cap sync + assembleDebug
python scripts/generar-iconos.py   # iconos provisionales de la PWA
```
