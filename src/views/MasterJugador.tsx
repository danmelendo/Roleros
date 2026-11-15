import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "../lib/api";
import { PLANTILLA, rutasDe } from "../lib/ficha";
import { useSesion } from "../lib/sesion";

// Mismo patrón que el CHECK de ficha_revelado.campo_path en la migración.
const RUTA_VALIDA = /^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/;

export function MasterJugador() {
  const { jugadorId } = useParams({ from: "/master/$jugadorId" });
  const { sesion, esMaster, comprobando } = useSesion();
  const qc = useQueryClient();

  const jugadores = useQuery({ queryKey: ["jugadores"], queryFn: listarJugadores, enabled: esMaster });
  const ficha = useQuery({ queryKey: ["ficha-completa", jugadorId], queryFn: () => fichaCompleta(jugadorId), enabled: esMaster });
  const reveladas = useQuery({ queryKey: ["reveladas", jugadorId], queryFn: () => rutasReveladas(jugadorId), enabled: esMaster });
  const preguntas = useQuery({ queryKey: ["preguntas"], queryFn: listarPreguntas, enabled: esMaster });
  const respuestas = useQuery({ queryKey: ["respuestas-master", jugadorId], queryFn: () => respuestasDe(jugadorId), enabled: esMaster });

  const [texto, setTexto] = useState("");
  const [errorJson, setErrorJson] = useState<string | null>(null);
  useEffect(() => {
    if (ficha.isSuccess) setTexto(JSON.stringify(ficha.data ?? PLANTILLA, null, 2));
  }, [ficha.isSuccess, ficha.data]);

  const guardar = useMutation({
    mutationFn: (datos: FichaDatos) => guardarFicha(jugadorId, datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ficha-completa", jugadorId] }),
  });
  const alternar = useMutation({
    mutationFn: ({ ruta, si }: { ruta: string; si: boolean }) => revelar(jugadorId, ruta, si),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reveladas", jugadorId] }),
  });

  const rutas = useMemo(() => rutasDe(ficha.data ?? {}), [ficha.data]);
  const setReveladas = new Set(reveladas.data);

  if (comprobando) return <main className="pantalla"><p className="tenue">Comprobando…</p></main>;
  if (!sesion || !esMaster) return <Navigate to="/master" />;

  const nombre = jugadores.data?.find((j) => j.id === jugadorId)?.nombre ?? jugadorId;

  return (
    <main className="pantalla ancha">
      <header className="cabecera">
        <Link to="/master" className="enlace-tenue">← Biombo</Link>
        <h1>{nombre}</h1>
      </header>

      <section className="tarjeta">
        <h2>Ficha completa</h2>
        <p className="tenue">
          JSON libre. Listas como objetos con clave en minúsculas y sin tildes
          (<code>"dotes": {"{"} "soltura-espada": {"{"} … {"}"} {"}"}</code>), nunca arrays.
        </p>
        <textarea className="campo mono" rows={18} value={texto} spellCheck={false} onChange={(e) => setTexto(e.target.value)} />
        <div className="fila">
          <button
            className="boton"
            disabled={guardar.isPending}
            onClick={() => {
              try {
                const datos = JSON.parse(texto);
                setErrorJson(null);
                guardar.mutate(datos);
              } catch (e) {
                setErrorJson((e as Error).message);
              }
            }}
          >
            {guardar.isPending ? "Guardando…" : "Guardar ficha"}
          </button>
          {guardar.isSuccess && <span className="ok">✓ Guardada</span>}
        </div>
        {errorJson && <p className="error">JSON no válido: {errorJson}</p>}
        {guardar.error && <p className="error">{guardar.error.message}</p>}
      </section>

      <section className="tarjeta">
        <h2>Revelado</h2>
        <p className="tenue">Los PG se ven siempre. Revelar un grupo revela todo lo que cuelga de él.</p>
        {rutas.length === 0 && <p className="tenue">Guarda la ficha para poder revelar campos.</p>}
        <ul className="rutas">
          {rutas.map((r) => {
            const valida = RUTA_VALIDA.test(r);
            const partes = r.split(".");
            const nivel = partes.length - 1;
            // Visible sin fila propia: los PG, o porque un padre ya está revelado.
            const implicita =
              partes[0] === "pg" || partes.slice(0, -1).some((_, i) => setReveladas.has(partes.slice(0, i + 1).join(".")));
            return (
              <li key={r} style={{ paddingLeft: `${nivel * 16}px` }}>
                <label className={valida ? "" : "error"}>
                  <input
                    type="checkbox"
                    disabled={!valida || alternar.isPending || implicita}
                    checked={implicita || setReveladas.has(r)}
                    onChange={(e) => alternar.mutate({ ruta: r, si: e.target.checked })}
                  />
                  <code>{r.split(".").pop()}</code>
                  {!valida && " (clave no válida: minúsculas, números, - o _)"}
                </label>
              </li>
            );
          })}
        </ul>
        {/* Reveladas que ya no existen en la ficha (renombradas o borradas). */}
        {reveladas.data?.filter((r) => !rutas.includes(r)).map((r) => (
          <p key={r} className="tenue">
            Huérfana: <code>{r}</code>{" "}
            <button className="boton chico" onClick={() => alternar.mutate({ ruta: r, si: false })}>Quitar</button>
          </p>
        ))}
        {alternar.error && <p className="error">{alternar.error.message}</p>}
      </section>

      <section className="tarjeta">
        <h2>Cuestionario</h2>
        {respuestas.data?.length === 0 && <p className="tenue">Sin respuestas todavía.</p>}
        {preguntas.data?.map((p) => {
          const r = respuestas.data?.find((x) => x.pregunta_id === p.id);
          return r ? (
            <div key={p.id} className="respuesta">
              <p className="tenue">{p.texto}</p>
              <p>{r.respuesta}</p>
            </div>
          ) : null;
        })}
      </section>
    </main>
  );
}
