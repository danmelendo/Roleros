import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "@tanstack/react-router";
import {
  accionesPendientes,
  accionesRespondidas,
  listarJugadores,
  resolverAccion,
  type AccionMaster,
  type Jugador,
  type ObjetoDado,
} from "../lib/api";
import { oro } from "../lib/formato";
import { useSesion } from "../lib/sesion";
import { TarjetaAccion } from "./Acciones";

/** Invalida todo lo que cambia al responder una acción. */
const refrescar = (qc: ReturnType<typeof useQueryClient>) =>
  ["acciones-pendientes", "acciones-respondidas", "resumen-master", "jugadores", "inventario"].forEach((k) =>
    qc.invalidateQueries({ queryKey: [k] }),
  );

function Responder({ a, jugador }: { a: AccionMaster; jugador?: Jugador }) {
  const qc = useQueryClient();
  const [respuesta, setRespuesta] = useState("");
  const [oroDelta, setOroDelta] = useState("");
  const [objetos, setObjetos] = useState<ObjetoDado[]>([]);
  const responder = useMutation({
    mutationFn: (estado: "resuelta" | "rechazada") =>
      resolverAccion(a.id, estado, respuesta, Number(oroDelta.replace(",", ".")) || 0, objetos.filter((o) => o.item.trim())),
    onSuccess: () => refrescar(qc),
  });
  const setObj = (i: number, cambios: Partial<ObjetoDado>) =>
    setObjetos((os) => os.map((o, j) => (j === i ? { ...o, ...cambios } : o)));

  return (
    <div className="responder">
      <textarea
        className="campo"
        rows={2}
        placeholder="Tu respuesta (la verá el jugador)"
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
      />
      <div className="efectos-form">
        <label className="oro-delta">
          <span className="etiqueta">Oro (+/−)</span>
          <input className="campo cifra" inputMode="decimal" placeholder="−15" value={oroDelta} onChange={(e) => setOroDelta(e.target.value)} />
        </label>
        <span className="nota">Tiene {oro(jugador?.oro)}</span>
      </div>
      {objetos.map((o, i) => (
        <div key={i} className="item-cabeza">
          <input className="campo" placeholder="Objeto que recibe" value={o.item} onChange={(e) => setObj(i, { item: e.target.value })} />
          <input
            className="campo cifra total"
            type="number"
            min={1}
            value={o.cantidad}
            onChange={(e) => setObj(i, { cantidad: Math.max(1, Number(e.target.value) || 1) })}
          />
          <button type="button" className="quitar" title="Quitar" onClick={() => setObjetos((os) => os.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <div className="fila acciones-pie">
        <button type="button" className="boton chico secundario" onClick={() => setObjetos((os) => [...os, { item: "", cantidad: 1 }])}>
          + Objeto
        </button>
        <div className="fila">
          <button type="button" className="boton chico secundario" disabled={responder.isPending} onClick={() => responder.mutate("rechazada")}>
            Rechazar
          </button>
          <button type="button" className="boton chico" disabled={responder.isPending} onClick={() => responder.mutate("resuelta")}>
            Resolver
          </button>
        </div>
      </div>
      {responder.error && <p className="error">{responder.error.message}</p>}
    </div>
  );
}

export function MasterAcciones() {
  const { sesion, esMaster, comprobando } = useSesion();
  const jugadores = useQuery({ queryKey: ["jugadores"], queryFn: listarJugadores, enabled: esMaster });
  const pendientes = useQuery({ queryKey: ["acciones-pendientes"], queryFn: accionesPendientes, enabled: esMaster, refetchInterval: 60_000 });
  const respondidas = useQuery({ queryKey: ["acciones-respondidas"], queryFn: accionesRespondidas, enabled: esMaster });

  if (comprobando) return <main className="pantalla"><p className="tenue-claro">Comprobando…</p></main>;
  if (!sesion || !esMaster) return <Navigate to="/master" />;

  const deJugador = (id: string) => jugadores.data?.find((j) => j.id === id);
  const etiquetaJugador = (id: string) => {
    const j = deJugador(id);
    return <span className="quien" style={{ color: j?.color ?? undefined }}>{j?.nombre ?? id}</span>;
  };

  return (
    <main className="pantalla">
      <header className="cabecera">
        <Link to="/master" className="enlace-tenue">← Biombo</Link>
        <h1>Entre sesiones</h1>
        <p className="sub">
          {pendientes.data?.length ? `${pendientes.data.length} por responder, de la más antigua a la más nueva.` : "Nada pendiente."}
        </p>
      </header>

      {pendientes.data?.map((a) => (
        <div key={a.id} className="con-quien">
          {etiquetaJugador(a.jugador_id)}
          <TarjetaAccion a={a} pie={<Responder a={a} jugador={deJugador(a.jugador_id)} />} />
        </div>
      ))}

      {!!respondidas.data?.length && (
        <details className="pagina plegable">
          <summary>
            <h2>Respondidas</h2>
            <span className="tenue">{respondidas.data.length}</span>
          </summary>
          <ul className="entradas">
            {respondidas.data.map((a) => (
              <li key={a.id}>
                <span className="entrada-nombre">{deJugador(a.jugador_id)?.nombre}</span>
                <span className={`sello ${a.estado}`}>{a.estado === "resuelta" ? "Resuelta" : "Rechazada"}</span>
                <p className="entrada-texto">{a.texto}</p>
                {a.respuesta_dm && <p className="entrada-texto">— {a.respuesta_dm}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
