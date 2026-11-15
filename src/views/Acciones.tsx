import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { crearAccion, misAcciones, retirarAccion, type Accion, type TipoAccion } from "../lib/api";
import { ESTADOS, haceCuanto, nombreTipo, objetosTexto, oroConSigno, TIPOS } from "../lib/formato";
import { nubeConfigurada } from "../lib/supabase";
import { marcarAccionesVistas } from "./Jugador";

function Nueva({ jugadorId }: { jugadorId: string }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<TipoAccion>("compra");
  const [texto, setTexto] = useState("");
  const enviar = useMutation({
    mutationFn: () => crearAccion(jugadorId, tipo, texto.trim()),
    onSuccess: () => {
      setTexto("");
      qc.invalidateQueries({ queryKey: ["acciones", jugadorId] });
    },
  });

  return (
    <form
      className="pagina"
      onSubmit={(e) => {
        e.preventDefault();
        if (texto.trim()) enviar.mutate();
      }}
    >
      <h2>Entre sesiones</h2>
      <p className="tenue">¿Qué hace tu personaje hasta la próxima partida? El máster te contestará aquí.</p>
      <div className="chips" role="radiogroup" aria-label="Tipo de acción">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={tipo === t.id}
            className={`chip ${tipo === t.id ? "activo" : ""}`}
            onClick={() => setTipo(t.id)}
          >
            {t.nombre}
          </button>
        ))}
      </div>
      <textarea
        className="campo"
        rows={3}
        maxLength={2000}
        placeholder={TIPOS.find((t) => t.id === tipo)?.pista}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <button className="boton" disabled={!texto.trim() || enviar.isPending}>
        {enviar.isPending ? "Enviando…" : "Enviar al máster"}
      </button>
      {enviar.error && <p className="error">{enviar.error.message}</p>}
    </form>
  );
}

export function TarjetaAccion({ a, pie }: { a: Accion; pie?: ReactNode }) {
  return (
    <article className={`pagina accion ${a.estado}`}>
      <div className="accion-cabeza">
        <span className="etiqueta">{nombreTipo(a.tipo)} · {haceCuanto(a.created_at)}</span>
        <span className={`sello ${a.estado}`}>{ESTADOS[a.estado]}</span>
      </div>
      <p className="accion-texto">{a.texto}</p>
      {a.respuesta_dm && (
        <blockquote className="respuesta-dm">
          <span className="etiqueta">El máster</span>
          {a.respuesta_dm}
        </blockquote>
      )}
      {(a.oro_delta || a.objetos.length > 0) && (
        <p className="efectos">
          {a.oro_delta ? <span className={a.oro_delta > 0 ? "gana" : "pierde"}>{oroConSigno(a.oro_delta)}</span> : null}
          {a.objetos.length > 0 && <span className="gana">+ {objetosTexto(a.objetos)}</span>}
        </p>
      )}
      {pie}
    </article>
  );
}

export function Acciones() {
  const { jugadorId } = useParams({ from: "/j/$jugadorId" });
  const qc = useQueryClient();
  const acciones = useQuery({
    queryKey: ["acciones", jugadorId],
    queryFn: () => misAcciones(jugadorId),
    enabled: nubeConfigurada,
    refetchInterval: 60_000,
  });
  const retirar = useMutation({
    mutationFn: (id: number) => retirarAccion(jugadorId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acciones", jugadorId] }),
  });

  // Al verlas, se apaga el punto de "respuesta nueva".
  useEffect(() => {
    if (acciones.isSuccess) marcarAccionesVistas(jugadorId);
  }, [acciones.isSuccess, acciones.dataUpdatedAt, jugadorId]);

  return (
    <>
      <Nueva jugadorId={jugadorId} />
      {acciones.isLoading && <p className="tenue-claro">Cargando…</p>}
      {acciones.data?.map((a) => (
        <TarjetaAccion
          key={a.id}
          a={a}
          pie={
            a.estado === "pendiente" && (
              <button className="boton chico secundario" disabled={retirar.isPending} onClick={() => retirar.mutate(a.id)}>
                Retirar
              </button>
            )
          }
        />
      ))}
      {retirar.error && <p className="error-claro">{retirar.error.message}</p>}
    </>
  );
}
