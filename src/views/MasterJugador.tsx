import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "@tanstack/react-router";
import {
  fichaCompleta,
  guardarFicha,
  listarJugadores,
  listarPreguntas,
  respuestasDe,
  revelar,
  rutasReveladas,
  type FichaDatos,
  type Pregunta,
  type RespuestaMaster,
} from "../lib/api";
import {
  claveNueva,
  ESQUEMA,
  esObjeto,
  estaVisible,
  modificador,
  conSigno,
  PLANTILLA,
  rutasDe,
  type Campo,
  type Item,
} from "../lib/ficha";
import { useSesion } from "../lib/sesion";
import { Ojo } from "../components/Ojo";

/* Escritura inmutable en una ruta ('atributos.fue' → ['atributos','fue']). */
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

/* Input que guarda número o vacío. */
function Entrada({ campo, valor, onCambio }: { campo: Campo; valor: unknown; onCambio: (v: unknown) => void }) {
  if (campo.tipo === "numero") {
    return (
      <input
        className="campo cifra"
        type="number"
        inputMode="numeric"
        value={typeof valor === "number" ? valor : ""}
        onChange={(e) => onCambio(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }
  return <input className="campo" type="text" value={typeof valor === "string" ? valor : ""} onChange={(e) => onCambio(e.target.value)} />;
}

export function MasterJugador() {
  const { jugadorId } = useParams({ from: "/master/$jugadorId" });
  const { sesion, esMaster, comprobando } = useSesion();
  const qc = useQueryClient();

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

  return (
    <Editor
      jugadorId={jugadorId}
      nombreJugador={jugadores.data?.find((j) => j.id === jugadorId)?.nombre ?? jugadorId}
      original={ficha.data}
      reveladas={reveladas.data}
      preguntas={preguntas.data ?? []}
      respuestas={respuestas.data ?? []}
      qc={qc}
    />
  );
}

function Editor({
  jugadorId, nombreJugador, original: guardada, reveladas, preguntas, respuestas, qc,
}: {
  jugadorId: string;
  nombreJugador: string;
  original: FichaDatos | null;
  reveladas: string[];
  preguntas: Pregunta[];
  respuestas: RespuestaMaster[];
  qc: QueryClient;
}) {
  const nueva = guardada === null;
  const original = guardada ?? PLANTILLA;
  const [datos, setDatos] = useState<FichaDatos>(() => structuredClone(original));
  // Una ficha nueva cuenta como "por guardar" aunque no se toque: así se puede crear tal cual.
  const sucio = nueva || JSON.stringify(datos) !== JSON.stringify(original);

  // Aviso al cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sucio) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [sucio]);

  const guardar = useMutation({
    mutationFn: (d: FichaDatos) => guardarFicha(jugadorId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ficha-completa", jugadorId] });
      qc.invalidateQueries({ queryKey: ["resumen-master"] });
    },
  });
  const alternar = useMutation({
    mutationFn: ({ ruta, si }: { ruta: string; si: boolean }) => revelar(jugadorId, ruta, si),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reveladas", jugadorId] }),
  });

  const setRev = useMemo(() => new Set(reveladas), [reveladas]);
  const vis = (ruta: string) => estaVisible(ruta, setRev);
  const ojo = (ruta: string, que: string) => (
    <Ojo estado={vis(ruta)} que={que} ocupado={alternar.isPending} onCambiar={(si) => alternar.mutate({ ruta, si })} />
  );
  const poner = (ruta: string[], v: unknown) => setDatos((d) => conValor(d, ruta, v));

  const rutasGuardadas = rutasDe(original);
  const huerfanas = nueva ? [] : reveladas.filter((r) => !rutasGuardadas.includes(r));
  const numVisibles = rutasGuardadas.filter((r) => vis(r) === "propia").length;

  return (
    <main className="pantalla ancha">
      <header className="cabecera">
        <Link to="/master" className="enlace-tenue">← Biombo</Link>
        <h1>{nombreJugador}</h1>
        <p className="sub">
          {nueva ? "Ficha nueva: rellénala y guarda." : `${numVisibles} ${numVisibles === 1 ? "campo revelado" : "campos revelados"}. El ojo dorado es lo que ve el jugador.`}
        </p>
      </header>

      {/* Lo que respondió, a mano mientras se rellena la ficha. */}
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

      {/* Nombre del personaje */}
      <section className="pagina">
        <div className="fila-campo destacada">
          <label>
            <span className="etiqueta">Nombre del personaje</span>
            <input className="campo nombre" value={typeof datos.nombre === "string" ? datos.nombre : ""} onChange={(e) => poner(["nombre"], e.target.value)} />
          </label>
          {ojo("nombre", "el nombre")}
        </div>
      </section>

      {ESQUEMA.map((s) => {
        if (s.tipo === "identidad") {
          return (
            <section key="identidad" className="pagina">
              <h2>{s.titulo}</h2>
              {s.campos.map((c) => (
                <div key={c.clave} className="fila-campo">
                  <label>
                    <span className="etiqueta">{c.etiqueta}</span>
                    <Entrada campo={c} valor={datos[c.clave]} onCambio={(v) => poner([c.clave], v)} />
                  </label>
                  {ojo(c.clave, c.etiqueta.toLowerCase())}
                </div>
              ))}
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
                  <label key={k}>
                    <span className="etiqueta">{k === "max" ? "Máximo" : "Actuales"}</span>
                    <Entrada campo={{ clave: k, etiqueta: k, tipo: "numero" }} valor={leer(datos, ["pg", k])} onCambio={(v) => poner(["pg", k], v)} />
                  </label>
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
                    <div key={c.clave} className="celda-campo">
                      <label>
                        <span className="etiqueta" title={c.etiqueta}>{c.corta ?? c.etiqueta}</span>
                        <Entrada campo={c} valor={v} onCambio={(nv) => poner([s.clave, c.clave], nv)} />
                      </label>
                      <div className="pie-celda">
                        {m !== null ? <span className="mod">{conSigno(m)}</span> : <span />}
                        {ojo(`${s.clave}.${c.clave}`, c.etiqueta.toLowerCase())}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }

        if (s.tipo === "lista") {
          const lista = esObjeto(datos[s.clave]) ? (datos[s.clave] as Record<string, Item>) : {};
          const claves = Object.keys(lista);
          return (
            <section key={s.clave} className="pagina">
              <div className="titulo-seccion">
                <h2>{s.titulo}</h2>
                {ojo(s.clave, `todas las ${s.titulo.toLowerCase()}`)}
              </div>
              {claves.length === 0 && <p className="tenue">Ninguna todavía.</p>}
              {claves.map((k) => {
                const it = esObjeto(lista[k]) ? lista[k] : {};
                return (
                  <div key={k} className="item">
                    <div className="item-cabeza">
                      <input
                        className="campo"
                        placeholder={`Nombre de la ${s.singular}`}
                        value={it.nombre ?? ""}
                        onChange={(e) => poner([s.clave, k, "nombre"], e.target.value)}
                      />
                      {s.conTotal && (
                        <input
                          className="campo cifra total"
                          type="number"
                          inputMode="numeric"
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
                      <textarea
                        className="campo"
                        rows={2}
                        placeholder="Descripción (opcional)"
                        value={it.texto ?? ""}
                        onChange={(e) => poner([s.clave, k, "texto"], e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                className="boton secundario"
                onClick={() => poner([s.clave, claveNueva(s.singular, claves)], { nombre: "" })}
              >
                + Añadir {s.singular}
              </button>
            </section>
          );
        }

        // texto largo
        return (
          <section key={s.clave} className="pagina">
            <div className="titulo-seccion">
              <h2>{s.titulo}</h2>
              {ojo(s.clave, s.titulo.toLowerCase())}
            </div>
            <textarea className="campo" rows={5} value={typeof datos[s.clave] === "string" ? (datos[s.clave] as string) : ""} onChange={(e) => poner([s.clave], e.target.value)} />
          </section>
        );
      })}

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

      {/* Barra de guardar: solo aparece con cambios. */}
      <div className={`barra-guardar ${sucio || guardar.isPending ? "visible" : ""}`}>
        <span>{guardar.error ? `Error: ${guardar.error.message}` : "Cambios sin guardar"}</span>
        <div className="fila">
          <button type="button" className="boton chico claro" onClick={() => setDatos(original)} disabled={guardar.isPending}>
            Deshacer
          </button>
          <button type="button" className="boton" onClick={() => guardar.mutate(datos)} disabled={guardar.isPending}>
            {guardar.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </main>
  );
}
