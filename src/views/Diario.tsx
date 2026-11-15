import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { borrarDiario, escribirDiario, miDiario, type EntradaDiario } from "../lib/api";
import { haceCuanto } from "../lib/formato";
import { nubeConfigurada } from "../lib/supabase";

/* Notas libres del jugador: nombres, pistas, lo que no quiere olvidar. */

function Entrada({ jugadorId, e }: { jugadorId: string; e: EntradaDiario }) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(e.texto);
  const refrescar = () => qc.invalidateQueries({ queryKey: ["diario", jugadorId] });
  const guardar = useMutation({
    mutationFn: () => escribirDiario(jugadorId, e.id, texto.trim()),
    onSuccess: async () => { await refrescar(); setEditando(false); },
  });
  const borrar = useMutation({ mutationFn: () => borrarDiario(jugadorId, e.id), onSuccess: refrescar });

  return (
    <article className="pagina entrada-diario">
      <span className="etiqueta">
        {haceCuanto(e.created_at)}
        {e.updated_at > e.created_at && " · editada"}
      </span>
      {editando ? (
        <>
          <textarea className="campo" rows={5} maxLength={5000} value={texto} onChange={(x) => setTexto(x.target.value)} autoFocus />
          <div className="fila-botones">
            <button className="boton chico" disabled={!texto.trim() || guardar.isPending} onClick={() => guardar.mutate()}>
              {guardar.isPending ? "Guardando…" : "Guardar"}
            </button>
            <button className="boton chico secundario" onClick={() => { setTexto(e.texto); setEditando(false); }}>Cancelar</button>
            <button
              className="boton chico secundario derecha"
              disabled={borrar.isPending}
              onClick={() => confirm("¿Borrar esta entrada del diario?") && borrar.mutate()}
            >
              Borrar
            </button>
          </div>
        </>
      ) : (
        <p className="diario-texto" onClick={() => setEditando(true)} title="Toca para editar">{e.texto}</p>
      )}
      {(guardar.error ?? borrar.error) && <p className="error">{(guardar.error ?? borrar.error)!.message}</p>}
    </article>
  );
}

export function Diario() {
  const { jugadorId } = useParams({ from: "/j/$jugadorId" });
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const diario = useQuery({ queryKey: ["diario", jugadorId], queryFn: () => miDiario(jugadorId), enabled: nubeConfigurada });
  const nueva = useMutation({
    mutationFn: () => escribirDiario(jugadorId, null, texto.trim()),
    onSuccess: () => {
      setTexto("");
      qc.invalidateQueries({ queryKey: ["diario", jugadorId] });
    },
  });

  return (
    <>
      <form
        className="pagina"
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim()) nueva.mutate();
        }}
      >
        <h2>Diario</h2>
        <textarea
          className="campo"
          rows={3}
          maxLength={5000}
          placeholder="Nombres, pistas, sospechas… lo que no quieras olvidar."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button className="boton" disabled={!texto.trim() || nueva.isPending}>
          {nueva.isPending ? "Anotando…" : "Anotar"}
        </button>
        {nueva.error && <p className="error">{nueva.error.message}</p>}
      </form>

      {diario.error && <p className="error-claro">{diario.error.message}</p>}
      {diario.isLoading && <p className="tenue-claro">Cargando…</p>}
      {diario.data?.length === 0 && <p className="tenue-claro">Todavía no has escrito nada.</p>}
      {diario.data?.map((e) => <Entrada key={e.id} jugadorId={jugadorId} e={e} />)}
    </>
  );
}
