import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { fichaRevelada, listarJugadores, type FichaDatos } from "../lib/api";
import { ESQUEMA, esObjeto, modificador, mostrar, conSigno, type Item } from "../lib/ficha";
import { guardarJugador } from "../lib/jugador";
import { nubeConfigurada } from "../lib/supabase";

/* El jugador solo recibe lo revelado (lo filtra el servidor). Aquí, lo que no
   llega se pinta como hueco: la ficha en blanco ES la premisa. */

const Olvido = () => <span className="olvido" title="No lo recuerdas">?</span>;

function Seccion({ titulo, vacia, children }: { titulo: string; vacia: boolean; children: ReactNode }) {
  return (
    <section className={`pagina ${vacia ? "olvidada" : ""}`}>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

function Cuerpo({ f }: { f: FichaDatos }) {
  return (
    <>
      {ESQUEMA.map((s) => {
        if (s.tipo === "identidad") {
          const alguna = s.campos.some((c) => f[c.clave] !== undefined);
          return (
            <Seccion key="identidad" titulo={s.titulo} vacia={!alguna}>
              <dl className="renglones">
                {s.campos.map((c) => (
                  <div key={c.clave}>
                    <dt>{c.etiqueta}</dt>
                    <dd>{f[c.clave] === undefined ? <Olvido /> : mostrar(f[c.clave])}</dd>
                  </div>
                ))}
              </dl>
            </Seccion>
          );
        }

        if (s.tipo === "pg") {
          const pg = esObjeto(f.pg) ? f.pg : {};
          const max = typeof pg.max === "number" ? pg.max : 0;
          const act = typeof pg.actual === "number" ? pg.actual : max;
          return (
            <Seccion key="pg" titulo={s.titulo} vacia={false}>
              <p className="pg">
                <span className="pg-actual">{act}</span>
                <span className="pg-max">/ {max}</span>
              </p>
              <span className="barra vida">
                <span style={{ width: `${max ? Math.max(0, Math.min(100, (act / max) * 100)) : 0}%` }} />
              </span>
            </Seccion>
          );
        }

        if (s.tipo === "grupo") {
          const g = esObjeto(f[s.clave]) ? (f[s.clave] as Record<string, unknown>) : null;
          return (
            <Seccion key={s.clave} titulo={s.titulo} vacia={!g}>
              <div className={`casillas ${s.mod ? "atributos" : ""}`}>
                {s.campos.map((c) => {
                  const v = g?.[c.clave];
                  const m = s.mod ? modificador(v) : null;
                  return (
                    <div key={c.clave} className={`casilla ${v === undefined ? "vacia" : ""}`} title={c.etiqueta}>
                      <span className="casilla-nombre">{c.corta ?? c.etiqueta}</span>
                      <span className="casilla-valor">{v === undefined ? <Olvido /> : mostrar(v, c.signo)}</span>
                      {s.mod && <span className="casilla-mod">{m === null ? "" : conSigno(m)}</span>}
                    </div>
                  );
                })}
              </div>
            </Seccion>
          );
        }

        if (s.tipo === "lista") {
          const items = esObjeto(f[s.clave]) ? (Object.values(f[s.clave] as Record<string, unknown>).filter(esObjeto) as Item[]) : [];
          return (
            <Seccion key={s.clave} titulo={s.titulo} vacia={items.length === 0}>
              {items.length === 0 ? (
                <p className="hueco">No lo recuerdas.</p>
              ) : (
                <ul className="entradas">
                  {items.map((it, i) => (
                    <li key={i}>
                      <span className="entrada-nombre">{it.nombre || "—"}</span>
                      {typeof it.total === "number" && <span className="cifra"> {conSigno(it.total)}</span>}
                      {it.texto && <p className="entrada-texto">{it.texto}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>
          );
        }

        const t = f[s.clave];
        return (
          <Seccion key={s.clave} titulo={s.titulo} vacia={typeof t !== "string" || !t}>
            {typeof t === "string" && t ? <p className="prosa">{t}</p> : <p className="hueco">No lo recuerdas.</p>}
          </Seccion>
        );
      })}
    </>
  );
}

export function Ficha() {
  const { jugadorId } = useParams({ from: "/j/$jugadorId" });
  const navigate = useNavigate();
  const jugadores = useQuery({ queryKey: ["jugadores"], queryFn: listarJugadores, enabled: nubeConfigurada });
  const ficha = useQuery({
    queryKey: ["ficha", jugadorId],
    queryFn: () => fichaRevelada(jugadorId),
    enabled: nubeConfigurada,
    refetchInterval: 60_000, // lo que revele el máster aparece solo
  });
  const yo = jugadores.data?.find((j) => j.id === jugadorId);
  const nombre = typeof ficha.data?.nombre === "string" && ficha.data.nombre ? ficha.data.nombre : null;

  return (
    <main className="pantalla">
      <header className="cabecera fila">
        <div>
          <p className="sub">{yo?.nombre ?? jugadorId}</p>
          <h1 className={nombre ? "" : "desconocido"}>{nombre ?? "¿Quién eres?"}</h1>
        </div>
        <button
          className="boton chico claro"
          onClick={() => {
            guardarJugador(null);
            navigate({ to: "/" });
          }}
        >
          Cambiar
        </button>
      </header>

      <Link to="/j/$jugadorId/cuestionario" params={{ jugadorId }} className="boton bloque">
        Cuestionario
      </Link>

      {ficha.error && <p className="error-claro">{ficha.error.message}</p>}
      {ficha.isLoading && <p className="tenue-claro">Cargando…</p>}
      {(ficha.data || !nubeConfigurada) && <Cuerpo f={ficha.data ?? {}} />}
    </main>
  );
}
