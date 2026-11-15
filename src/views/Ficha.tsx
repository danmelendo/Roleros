import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { fichaRevelada, listarJugadores } from "../lib/api";
import { esObjeto, etiqueta, SECCIONES } from "../lib/ficha";
import { guardarJugador } from "../lib/jugador";
import { nubeConfigurada } from "../lib/supabase";

/** Pinta un valor revelado, sea texto, número u objeto anidado. */
function Valor({ v }: { v: unknown }) {
  if (esObjeto(v)) {
    // Entradas tipo { nombre, texto, total }: se leen como una línea con detalle.
    if (typeof v.nombre === "string") {
      return (
        <span>
          <strong>{v.nombre}</strong>
          {v.total !== undefined && <span className="cifra"> {signo(v.total)}</span>}
          {typeof v.texto === "string" && v.texto && <span className="tenue"> — {v.texto}</span>}
        </span>
      );
    }
    return (
      <dl className="rejilla">
        {Object.entries(v).map(([k, sub]) => (
          <div key={k} className="celda">
            <dt>{etiqueta(k)}</dt>
            <dd><Valor v={sub} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  if (v === "" || v === null || v === undefined) return <span className="hueco">—</span>;
  return <span className="cifra">{String(v)}</span>;
}

const signo = (n: unknown) => (typeof n === "number" && n >= 0 ? `+${n}` : String(n));

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

  return (
    <main className="pantalla">
      <header className="cabecera fila">
        <div>
          <p className="sub">Jugador: {yo?.nombre ?? jugadorId}</p>
          <h1>{typeof ficha.data?.nombre === "string" && ficha.data.nombre ? ficha.data.nombre : "¿…?"}</h1>
        </div>
        <button
          className="boton chico"
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

      {ficha.error && <p className="error">{ficha.error.message}</p>}

      {SECCIONES.filter((s) => s.clave !== "nombre").map((s) => {
        const v = ficha.data?.[s.clave];
        const revelado = v !== undefined;
        return (
          <section key={s.clave} className={`tarjeta ${revelado ? "" : "olvidada"}`}>
            <h2>{s.titulo}</h2>
            {revelado ? <Valor v={v} /> : <p className="hueco">No lo recuerdas.</p>}
          </section>
        );
      })}
    </main>
  );
}
