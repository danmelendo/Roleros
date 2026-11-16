import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "@tanstack/react-router";
import {
  anadirItem,
  asignarFicha,
  cambiarItem,
  cambiarJugador,
  fichaCompleta,
  guardarFicha,
  inventarioDe,
  listarJugadores,
  listarPreguntas,
  ponerOro,
  quitarItem,
  respuestasDe,
  revelar,
  rutasReveladas,
  type FichaDatos,
  type ItemInventario,
  type Pregunta,
  type RespuestaMaster,
} from "../lib/api";
import {
  claveNueva, conSigno, conTotales, copiasDe, CORTO, defHabilidad, ESQUEMA, esObjeto, estaVisible, HABILIDADES, modificador,
  ordenados, PENALIZADOR, PLANTILLA, rutasDe, type Campo, type DatosHabilidad, type DefHabilidad,
} from "../lib/ficha";
import { oro } from "../lib/formato";
import { useSesion } from "../lib/sesion";
import { Ojo } from "../components/Ojo";
import { Retrato } from "../components/Retrato";
import { Colores } from "../components/Colores";

/* Asistente de raza/clase y selector de conjuros: se cargan aparte, solo en el biombo. */
const Asistente = lazy(() => import("../components/Asistente"));
const SelectorConjuros = lazy(() => import("../components/Asistente").then((m) => ({ default: m.SelectorConjuros })));
const SelectorDotes = lazy(() => import("../components/Asistente").then((m) => ({ default: m.SelectorDotes })));

/* ------------------------------------------------------------ utilidades -- */

function conValor(datos: FichaDatos, ruta: string[], valor: unknown): FichaDatos {
  const [k, ...resto] = ruta;
  const copia: Record<string, unknown> = { ...datos };
  if (resto.length === 0) {
    if (valor === undefined) delete copia[k];
    else copia[k] = valor;
  } else {
    copia[k] = conValor(esObjeto(copia[k]) ? (copia[k] as FichaDatos) : {}, resto, valor);
  }
  return copia;
}

const leer = (datos: FichaDatos, ruta: string[]): unknown =>
  ruta.reduce<unknown>((acc, k) => (esObjeto(acc) ? acc[k] : undefined), datos);

/* Comparación sin orden de claves: Postgres (jsonb) devuelve las claves
   reordenadas, y un JSON.stringify directo veía cambios donde no los había
   (el aviso de "Cambios sin guardar" no se iba al guardar). */
const canon = (v: unknown) =>
  JSON.stringify(v, (_k, x) => (esObjeto(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x));

function Entrada({ campo, valor, onCambio }: { campo: Campo; valor: unknown; onCambio: (v: unknown) => void }) {
  if (campo.tipo === "numero") {
    return (
      <input
        className="campo cifra"
        type="number"
        inputMode="numeric"
        aria-label={campo.etiqueta}
        value={typeof valor === "number" ? valor : ""}
        onChange={(e) => onCambio(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }
  return <input className="campo" type="text" aria-label={campo.etiqueta} value={typeof valor === "string" ? valor : ""} onChange={(e) => onCambio(e.target.value)} />;
}

/** Celda de formulario: etiqueta arriba y, en una línea, el campo + extra + ojo. */
function Celda({ etiqueta, titulo, children }: { etiqueta: string; titulo?: string; children: ReactNode }) {
  return (
    <div className="celda-campo">
      <span className="etiqueta" title={titulo}>{etiqueta}</span>
      <div className="control">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------- página ---- */

export function MasterJugador() {
  const { jugadorId } = useParams({ from: "/master/$jugadorId" });
  const { sesion, esMaster, comprobando } = useSesion();

  const jugadores = useQuery({ queryKey: ["jugadores"], queryFn: listarJugadores, enabled: esMaster });
  const ficha = useQuery({ queryKey: ["ficha-completa", jugadorId], queryFn: () => fichaCompleta(jugadorId), enabled: esMaster });
  const reveladas = useQuery({ queryKey: ["reveladas", jugadorId], queryFn: () => rutasReveladas(jugadorId), enabled: esMaster });
  const preguntas = useQuery({ queryKey: ["preguntas"], queryFn: listarPreguntas, enabled: esMaster });
  const respuestas = useQuery({ queryKey: ["respuestas-master", jugadorId], queryFn: () => respuestasDe(jugadorId), enabled: esMaster });

  if (comprobando) return <main className="pantalla"><p className="tenue-claro">Comprobando…</p></main>;
  if (!sesion || !esMaster) return <Navigate to="/master" />;
  /* El formulario NO se pinta hasta tener ficha y revelados: si arrancara con la
     plantilla y se guardara antes de que llegasen los datos, machacaría la ficha. */
  if (!ficha.isSuccess || !reveladas.isSuccess) {
    return <main className="pantalla"><p className="tenue-claro">{ficha.error?.message ?? reveladas.error?.message ?? "Abriendo la ficha…"}</p></main>;
  }

  const jugador = jugadores.data?.find((j) => j.id === jugadorId);
  return (
    <Editor
      jugadorId={jugadorId}
      nombreJugador={jugador?.nombre ?? jugadorId}
      oroJugador={jugador?.oro ?? 0}
      guardada={ficha.data?.datos ?? null}
      asignada={ficha.data?.asignada ?? false}
      reveladas={reveladas.data}
      preguntas={preguntas.data ?? []}
      respuestas={respuestas.data ?? []}
    />
  );
}

function Editor({
  jugadorId, nombreJugador, oroJugador, guardada, asignada, reveladas, preguntas, respuestas,
}: {
  jugadorId: string;
  nombreJugador: string;
  oroJugador: number;
  guardada: FichaDatos | null;
  asignada: boolean;
  reveladas: string[];
  preguntas: Pregunta[];
  respuestas: RespuestaMaster[];
}) {
  const qc = useQueryClient();
  const nueva = guardada === null;
  const original = guardada ?? PLANTILLA;
  const [datos, setDatos] = useState<FichaDatos>(() => structuredClone(original));
  /* Los totales de habilidades se calculan (conTotales) y se guardan con la ficha.
     Una ficha nueva, o una cuyos totales guardados no cuadran, cuenta como "por guardar". */
  const calculada = useMemo(() => conTotales(datos), [datos]);
  const sucio = nueva || canon(calculada) !== canon(original);

  useEffect(() => {
    if (!sucio) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [sucio]);

  const guardar = useMutation({
    mutationFn: (d: FichaDatos) => guardarFicha(jugadorId, d),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ficha-completa", jugadorId] });
      qc.invalidateQueries({ queryKey: ["resumen-master"] });
    },
  });
  const alternar = useMutation({
    mutationFn: ({ ruta, si }: { ruta: string; si: boolean }) => revelar(jugadorId, ruta, si),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reveladas", jugadorId] }),
  });
  const asignar = useMutation({
    mutationFn: (si: boolean) => asignarFicha(jugadorId, si),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ficha-completa", jugadorId] });
      qc.invalidateQueries({ queryKey: ["resumen-master"] });
    },
  });
  const cuestionarioCompleto = preguntas.every((p) => respuestas.some((r) => r.pregunta_id === p.id));

  const setRev = useMemo(() => new Set(reveladas), [reveladas]);
  const ojo = (ruta: string, que: string) => (
    <Ojo estado={estaVisible(ruta, setRev)} que={que} ocupado={alternar.isPending} onCambiar={(si) => alternar.mutate({ ruta, si })} />
  );
  const poner = (ruta: string[], v: unknown) => setDatos((d) => conValor(d, ruta, v));

  const rutasGuardadas = rutasDe(original);
  const huerfanas = nueva ? [] : reveladas.filter((r) => !rutasGuardadas.includes(r));
  const numVisibles = rutasGuardadas.filter((r) => estaVisible(r, setRev) === "propia").length;

  return (
    <main className="pantalla ancha">
      <header className="cabecera">
        <Link to="/master" className="enlace-tenue">← Biombo</Link>
        <div className="quien-soy">
          <Retrato jugadorId={jugadorId} />
          <h1>{nombreJugador}</h1>
        </div>
        <p className="sub">
          {nueva ? "Ficha nueva: rellénala y guarda." : `${numVisibles} ${numVisibles === 1 ? "campo revelado" : "campos revelados"}. El ojo dorado es lo que ve el jugador.`}
        </p>
      </header>

      <DatosJugador jugadorId={jugadorId} />

      <details className="pagina plegable">
        <summary>
          <h2>Cuestionario</h2>
          <span className="tenue">{respuestas.length} de {preguntas.length}</span>
        </summary>
        {respuestas.length === 0 && <p className="tenue">Sin respuestas todavía.</p>}
        {preguntas.map((p) => {
          const r = respuestas.find((x) => x.pregunta_id === p.id);
          return r ? (
            <div key={p.id} className="respuesta">
              <p className="tenue">{p.texto}</p>
              <p>{r.respuesta}</p>
            </div>
          ) : null;
        })}
      </details>

      <section className="pagina">
        <label className={`asignar ${asignada ? "si" : ""}`}>
          <input
            type="checkbox"
            checked={asignada}
            disabled={nueva || asignar.isPending}
            onChange={(e) => asignar.mutate(e.target.checked)}
          />
          <span>
            <span className="jugador-nombre">Ficha asignada</span>
            <span className="nota">
              {nueva
                ? "Guarda la ficha antes de asignarla."
                : !asignada
                  ? "El jugador ve «Te están haciendo la ficha». Márcala cuando esté lista."
                  : cuestionarioCompleto
                    ? "El jugador ya ve su ficha (solo lo revelado y los PG)."
                    : "Asignada, pero no la verá hasta que termine el cuestionario."}
            </span>
          </span>
        </label>
        {asignar.error && <p className="error">{asignar.error.message}</p>}
      </section>

      <section className="pagina">
        <Celda etiqueta="Nombre del personaje">
          <input className="campo nombre" aria-label="Nombre del personaje" value={typeof datos.nombre === "string" ? datos.nombre : ""} onChange={(e) => poner(["nombre"], e.target.value)} />
          {ojo("nombre", "el nombre")}
        </Celda>
      </section>

      <Suspense fallback={null}>
        <Asistente datos={datos} setDatos={setDatos} />
      </Suspense>

      {ESQUEMA.map((s) => {
        if (s.tipo === "identidad") {
          return (
            <section key="identidad" className="pagina">
              <h2>{s.titulo}</h2>
              <div className="rejilla-campos ancha">
                {s.campos.map((c) => (
                  <Celda key={c.clave} etiqueta={c.etiqueta}>
                    <Entrada campo={c} valor={datos[c.clave]} onCambio={(v) => poner([c.clave], v)} />
                    {ojo(c.clave, c.etiqueta.toLowerCase())}
                  </Celda>
                ))}
              </div>
            </section>
          );
        }

        if (s.tipo === "pg") {
          return (
            <section key="pg" className="pagina">
              <div className="titulo-seccion">
                <h2>{s.titulo}</h2>
                <span className="nota">Siempre visibles</span>
              </div>
              <div className="rejilla-campos">
                {(["actual", "max"] as const).map((k) => (
                  <Celda key={k} etiqueta={k === "max" ? "Máximo" : "Actuales"}>
                    <Entrada campo={{ clave: k, etiqueta: k, tipo: "numero" }} valor={leer(datos, ["pg", k])} onCambio={(v) => poner(["pg", k], v)} />
                  </Celda>
                ))}
              </div>
            </section>
          );
        }

        if (s.tipo === "grupo") {
          return (
            <section key={s.clave} className="pagina">
              <div className="titulo-seccion">
                <h2>{s.titulo}</h2>
                {ojo(s.clave, `todo ${s.titulo.toLowerCase()}`)}
              </div>
              <div className="rejilla-campos">
                {s.campos.map((c) => {
                  const v = leer(datos, [s.clave, c.clave]);
                  const m = s.mod ? modificador(v) : null;
                  return (
                    <Celda key={c.clave} etiqueta={c.corta ?? c.etiqueta} titulo={c.etiqueta}>
                      <Entrada campo={c} valor={v} onCambio={(nv) => poner([s.clave, c.clave], nv)} />
                      {m !== null && <span className="mod">{conSigno(m)}</span>}
                      {ojo(`${s.clave}.${c.clave}`, c.etiqueta.toLowerCase())}
                    </Celda>
                  );
                })}
              </div>
            </section>
          );
        }

        if (s.tipo === "habilidades") {
          return (
            <TablaHabilidades
              key={s.clave}
              titulo={s.titulo}
              datos={calculada}
              poner={poner}
              ojo={ojo}
              quitarRevelado={(ruta) => setRev.has(ruta) && alternar.mutate({ ruta, si: false })}
            />
          );
        }

        if (s.tipo === "lista") {
          const entradas = ordenados(datos[s.clave]);
          const claves = entradas.map(([k]) => k);
          return (
            <section key={s.clave} className="pagina">
              <div className="titulo-seccion">
                <h2>{s.titulo}</h2>
                {ojo(s.clave, `la sección ${s.titulo.toLowerCase()}`)}
              </div>
              {entradas.map(([k, it]) => {
                return (
                  <div key={k} className="item">
                    <div className="item-cabeza">
                      <input className="campo" aria-label={`Nombre (${s.singular})`} placeholder="Nombre" value={it.nombre ?? ""} onChange={(e) => poner([s.clave, k, "nombre"], e.target.value)} />
                      {s.conTotal && (
                        <input
                          className="campo cifra total"
                          type="number"
                          inputMode="numeric"
                          aria-label="Total"
                          placeholder="+0"
                          value={typeof it.total === "number" ? it.total : ""}
                          onChange={(e) => poner([s.clave, k, "total"], e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      )}
                      {ojo(`${s.clave}.${k}`, it.nombre || s.singular)}
                      <button
                        type="button"
                        className="quitar"
                        title={`Quitar ${it.nombre || s.singular}`}
                        onClick={() => {
                          poner([s.clave, k], undefined);
                          if (setRev.has(`${s.clave}.${k}`)) alternar.mutate({ ruta: `${s.clave}.${k}`, si: false });
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {!s.conTotal && (
                      <textarea className="campo" rows={1} aria-label="Descripción" placeholder="Descripción (opcional)" value={it.texto ?? ""} onChange={(e) => poner([s.clave, k, "texto"], e.target.value)} />
                    )}
                  </div>
                );
              })}
              <button type="button" className="boton chico secundario" onClick={() => poner([s.clave, claveNueva(s.singular, claves)], { nombre: "" })}>
                + Añadir {s.singular}
              </button>
              {s.clave === "conjuros" && (
                <Suspense fallback={null}>
                  <SelectorConjuros datos={datos} poner={poner} />
                </Suspense>
              )}
              {s.clave === "dotes" && (
                <Suspense fallback={null}>
                  <SelectorDotes datos={datos} poner={poner} />
                </Suspense>
              )}
            </section>
          );
        }

        return (
          <section key={s.clave} className="pagina">
            <div className="titulo-seccion">
              <h2>{s.titulo}</h2>
              {ojo(s.clave, s.titulo.toLowerCase())}
            </div>
            <textarea className="campo" rows={4} aria-label={s.titulo} value={typeof datos[s.clave] === "string" ? (datos[s.clave] as string) : ""} onChange={(e) => poner([s.clave], e.target.value)} />
          </section>
        );
      })}

      <PetateMaster jugadorId={jugadorId} oroActual={oroJugador} />

      {huerfanas.length > 0 && (
        <section className="pagina">
          <h2>Revelados sin campo</h2>
          <p className="tenue">Estaban revelados pero ya no existen en la ficha guardada.</p>
          {huerfanas.map((r) => (
            <p key={r} className="fila">
              <code>{r}</code>
              <button className="boton chico" onClick={() => alternar.mutate({ ruta: r, si: false })}>Quitar</button>
            </p>
          ))}
        </section>
      )}

      {alternar.error && <p className="error-claro">{alternar.error.message}</p>}

      <div className={`barra-guardar ${sucio || guardar.isPending ? "visible" : ""}`} role="status">
        <span>{guardar.error ? `Error: ${guardar.error.message}` : nueva ? "Ficha nueva sin guardar" : "Cambios sin guardar"}</span>
        <div className="fila">
          {!nueva && (
            <button type="button" className="boton chico claro" onClick={() => setDatos(structuredClone(original))} disabled={guardar.isPending}>
              Deshacer
            </button>
          )}
          <button type="button" className="boton chico" onClick={() => guardar.mutate(calculada)} disabled={guardar.isPending}>
            {guardar.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------- habilidades ---- */

/* Todas las habilidades de PF1e: solo se rellenan rangos, "de clase" y, si hace
   falta, otros modificadores. El total lo calcula conTotales() con los atributos. */
function TablaHabilidades({ titulo, datos, poner, ojo, quitarRevelado }: {
  titulo: string;
  datos: FichaDatos;
  poner: (ruta: string[], v: unknown) => void;
  ojo: (ruta: string, que: string) => ReactNode;
  quitarRevelado: (ruta: string) => void;
}) {
  const hab = esObjeto(datos.habilidades) ? datos.habilidades : {};
  const nivel = typeof datos.nivel === "number" ? datos.nivel : null;
  const pen = datos[PENALIZADOR];
  const repartidos = Object.values(hab).reduce<number>((n, h) => n + (esObjeto(h) && typeof h.rangos === "number" ? h.rangos : 0), 0);
  const num = (v: string) => (v === "" ? undefined : Number(v));

  const fila = (k: string, def: DefHabilidad, copia: boolean) => {
    const h = (esObjeto(hab[k]) ? hab[k] : {}) as DatosHabilidad;
    const nombre = def.abierta && h.detalle ? `${def.nombre} (${h.detalle})` : def.nombre;
    const excede = nivel !== null && typeof h.rangos === "number" && h.rangos > nivel;
    return (
      <div key={k} className={`hab ${def.abierta ? "abierta" : ""}`}>
        <div className="hab-nombre">
          <span>{def.nombre}</span>
          <span className="hab-at">{CORTO[def.at]}</span>
          {def.entrenada && <span className="hab-marca" title="Solo entrenada: sin rangos no se puede usar">E</span>}
          {def.armadura && <span className="hab-marca" title="Le afecta el penalizador de armadura">A</span>}
          {typeof h.raza === "number" && <span className="hab-at" title="Bonificador racial (ya sumado al total)">raza {conSigno(h.raza)}</span>}
          {typeof h.rasgo === "number" && <span className="hab-at" title="Bonificador de un rasgo de clase (ya sumado al total)">rasgo {conSigno(h.rasgo)}</span>}
        </div>
        <input type="checkbox" className="hab-clase" aria-label={`${nombre}: habilidad de clase`} title="Habilidad de clase (+3 con algún rango)" checked={!!h.clase} onChange={(e) => poner(["habilidades", k, "clase"], e.target.checked || undefined)} />
        <input className={`campo cifra ${excede ? "excede" : ""}`} type="number" inputMode="numeric" min={0} aria-label={`${nombre}: rangos`} title={excede ? "Más rangos que nivel" : undefined} placeholder="0" value={typeof h.rangos === "number" ? h.rangos : ""} onChange={(e) => poner(["habilidades", k, "rangos"], num(e.target.value))} />
        <input className="campo cifra" type="number" inputMode="numeric" aria-label={`${nombre}: otros modificadores`} placeholder="0" value={typeof h.otros === "number" ? h.otros : ""} onChange={(e) => poner(["habilidades", k, "otros"], num(e.target.value))} />
        <span className="hab-total cifra" title={h.total === null ? "Sin rangos no se puede usar" : undefined}>{typeof h.total === "number" ? conSigno(h.total) : "—"}</span>
        {ojo(`habilidades.${k}`, nombre)}
        {def.abierta && (
          <div className="hab-detalle">
            <input className="campo" aria-label={`${def.nombre}: especialidad`} placeholder="¿De qué? (herrería, laúd, marinero…)" value={h.detalle ?? ""} onChange={(e) => poner(["habilidades", k, "detalle"], e.target.value || undefined)} />
            {copia ? (
              <button type="button" className="quitar" title={`Quitar ${nombre}`} onClick={() => { poner(["habilidades", k], undefined); quitarRevelado(`habilidades.${k}`); }}>×</button>
            ) : (
              <button type="button" className="boton chico secundario" onClick={() => poner(["habilidades", claveNueva(def.clave, [def.clave, ...copiasDe(def.clave, hab)])], { base: def.clave })}>+ Otra</button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Entradas antiguas o ajenas al catálogo: se conservan, pero no se editan aquí.
  const ajenas = Object.keys(hab).filter((k) => !defHabilidad(k, hab[k] as DatosHabilidad));

  return (
    <section className="pagina">
      <div className="titulo-seccion">
        <h2>{titulo}</h2>
        {ojo("habilidades", "todas las habilidades")}
      </div>
      <div className="hab-cabecera">
        <Celda etiqueta="Penalizador de armadura" titulo="Se resta a las habilidades marcadas con A">
          <input className="campo cifra" type="number" inputMode="numeric" aria-label="Penalizador de armadura" placeholder="0" value={typeof pen === "number" ? pen : ""} onChange={(e) => poner([PENALIZADOR], num(e.target.value))} />
        </Celda>
        <p className="nota">
          {repartidos} {repartidos === 1 ? "rango repartido" : "rangos repartidos"}
          {nivel !== null && ` · máximo ${nivel} por habilidad`}
        </p>
      </div>
      <div className="hab hab-titulos" aria-hidden="true">
        <span>Habilidad</span><span>Clase</span><span>Rangos</span><span>Otros</span><span>Total</span><span />
      </div>
      {HABILIDADES.flatMap((def) => [fila(def.clave, def, false), ...(def.abierta ? copiasDe(def.clave, hab).map((k) => fila(k, def, true)) : [])])}
      <p className="nota">E: solo entrenada (sin rangos no se puede usar). A: le resta el penalizador de armadura. Total = rangos + atributo + 3 si es de clase y tiene rangos + otros + bonificadores de raza y de rasgos.</p>
      {ajenas.length > 0 && <p className="nota">Hay {ajenas.length} habilidades antiguas guardadas fuera de la tabla: {ajenas.join(", ")}.</p>}
    </section>
  );
}

/* ------------------------------------------------- datos del jugador ---- */
/* Nombre, color y baja. La baja no borra nada: el jugador desaparece de la
   portada y las funciones del jugador le rechazan (todas miran `activo`). */

function DatosJugador({ jugadorId }: { jugadorId: string }) {
  const qc = useQueryClient();
  const jugadores = useQuery({ queryKey: ["jugadores"], queryFn: listarJugadores });
  const j = jugadores.data?.find((x) => x.id === jugadorId);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("");
  useEffect(() => {
    if (j) { setNombre(j.nombre); setColor(j.color ?? ""); }
  }, [j?.nombre, j?.color]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = useMutation({
    mutationFn: (c: Parameters<typeof cambiarJugador>[1]) => cambiarJugador(jugadorId, c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jugadores"] }),
  });
  if (!j) return null;
  const tocado = nombre.trim() !== j.nombre || color !== (j.color ?? "");

  return (
    <details className="pagina plegable" open={!j.activo}>
      <summary>
        <h2>Jugador</h2>
        <span className="tenue">{j.activo ? "de alta" : "de baja"}</span>
      </summary>
      <div className="nuevo-jugador">
        <input className="campo" aria-label="Nombre del jugador" maxLength={40} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Colores valor={color} onCambio={setColor} />
        <div className="fila-botones">
          <button className="boton chico" disabled={!tocado || !nombre.trim() || cambiar.isPending} onClick={() => cambiar.mutate({ nombre: nombre.trim(), color })}>
            Guardar
          </button>
          <button
            className="boton chico secundario derecha"
            disabled={cambiar.isPending}
            onClick={() => {
              if (j.activo && !confirm(`¿Dar de baja a ${j.nombre}? Dejará de aparecer en la app. Sus datos se guardan y puedes darle de alta otra vez.`)) return;
              cambiar.mutate({ activo: !j.activo });
            }}
          >
            {j.activo ? "Dar de baja" : "Dar de alta otra vez"}
          </button>
        </div>
        {cambiar.error && <p className="error">{cambiar.error.message}</p>}
      </div>
    </details>
  );
}

/* ----------------------------------------------------- petate (máster) ---- */
/* Va aparte de la ficha y se guarda al momento (al salir de cada campo):
   el oro y los objetos también los mueve resolver_accion. */

function FilaItem({ it, onCambio, onQuitar, ocupado }: {
  it: ItemInventario;
  onCambio: (c: Partial<ItemInventario>) => void;
  onQuitar: () => void;
  ocupado: boolean;
}) {
  const [nombre, setNombre] = useState(it.item);
  const [cantidad, setCantidad] = useState(String(it.cantidad));
  useEffect(() => { setNombre(it.item); setCantidad(String(it.cantidad)); }, [it.item, it.cantidad]);

  return (
    <div className="item-cabeza item">
      <input className="campo" aria-label="Objeto" value={nombre} onChange={(e) => setNombre(e.target.value)}
        onBlur={() => nombre.trim() && nombre !== it.item && onCambio({ item: nombre.trim() })} />
      <input className="campo cifra total" type="number" min={1} aria-label="Cantidad" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
        onBlur={() => Number(cantidad) >= 1 && Number(cantidad) !== it.cantidad && onCambio({ cantidad: Number(cantidad) })} />
      <Ojo estado={it.visible ? "propia" : false} que={it.item} ocupado={ocupado} onCambiar={(v) => onCambio({ visible: v })} />
      <button type="button" className="quitar" title={`Quitar ${it.item}`} onClick={onQuitar} disabled={ocupado}>×</button>
    </div>
  );
}

function PetateMaster({ jugadorId, oroActual }: { jugadorId: string; oroActual: number }) {
  const qc = useQueryClient();
  const inv = useQuery({ queryKey: ["inventario", jugadorId], queryFn: () => inventarioDe(jugadorId) });
  const [oroTxt, setOroTxt] = useState(String(oroActual));
  const [nuevo, setNuevo] = useState("");
  useEffect(() => setOroTxt(String(oroActual)), [oroActual]);

  const refrescar = () => {
    qc.invalidateQueries({ queryKey: ["inventario", jugadorId] });
    qc.invalidateQueries({ queryKey: ["jugadores"] });
  };
  const cambio = useMutation({
    mutationFn: async (f: () => Promise<void>) => f(),
    onSuccess: refrescar,
  });

  const oroNum = Number(oroTxt.replace(",", "."));
  return (
    <section className="pagina">
      <div className="titulo-seccion">
        <h2>Petate</h2>
        <span className="nota">Se guarda al momento</span>
      </div>
      <div className="rejilla-campos">
        <Celda etiqueta="Oro (po)">
          <input
            className="campo cifra"
            inputMode="decimal"
            aria-label="Oro"
            value={oroTxt}
            onChange={(e) => setOroTxt(e.target.value)}
            onBlur={() => Number.isFinite(oroNum) && oroNum >= 0 && oroNum !== oroActual && cambio.mutate(() => ponerOro(jugadorId, oroNum))}
          />
        </Celda>
      </div>
      {inv.data?.map((it) => (
        <FilaItem
          key={it.id}
          it={it}
          ocupado={cambio.isPending}
          onCambio={(c) => cambio.mutate(() => cambiarItem(it.id, c))}
          onQuitar={() => cambio.mutate(() => quitarItem(it.id))}
        />
      ))}
      <form
        className="item-cabeza nuevo-item"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nuevo.trim()) return;
          cambio.mutate(() => anadirItem(jugadorId, nuevo.trim(), 1));
          setNuevo("");
        }}
      >
        <input className="campo" aria-label="Objeto nuevo" placeholder="Objeto nuevo" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
        <button className="boton chico secundario" disabled={!nuevo.trim() || cambio.isPending}>+ Añadir</button>
      </form>
      <p className="nota">Ojo cerrado: el objeto existe pero el jugador no lo ve. Tiene {oro(oroActual)}.</p>
      {cambio.error && <p className="error">{cambio.error.message}</p>}
    </section>
  );
}
