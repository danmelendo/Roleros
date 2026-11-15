import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { enviarRespuesta, listarPreguntas, misRespuestas, type Pregunta } from "../lib/api";
import { nubeConfigurada } from "../lib/supabase";

function PreguntaCard({ jugadorId, p, guardada }: { jugadorId: string; p: Pregunta; guardada?: string }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState(guardada ?? "");
  const enviar = useMutation({
    mutationFn: (r: string) => enviarRespuesta(jugadorId, p.id, r),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["respuestas", jugadorId] }),
  });
  const conOpciones = p.opciones.length > 0;

  return (
    <section className="tarjeta">
      <h2 className="pregunta">{p.texto}</h2>
      {conOpciones && (
        <div className="lista">
          {p.opciones.map((o) => (
            <button
              key={o}
              className={`boton opcion ${guardada === o ? "elegida" : ""}`}
              disabled={enviar.isPending}
              onClick={() => {
                setTexto(o);
                enviar.mutate(o);
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
      {(!conOpciones || p.libre) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (texto.trim()) enviar.mutate(texto.trim());
          }}
        >
          <textarea
            className="campo"
            rows={3}
            maxLength={2000}
            placeholder={conOpciones ? "…o cuéntalo con tus palabras" : "Tu respuesta"}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button className="boton" disabled={enviar.isPending || !texto.trim() || texto.trim() === guardada}>
            {enviar.isPending ? "Guardando…" : guardada ? "Cambiar respuesta" : "Responder"}
          </button>
        </form>
      )}
      {guardada && !enviar.isPending && <p className="ok">✓ Respondida</p>}
      {enviar.error && <p className="error">{enviar.error.message}</p>}
    </section>
  );
}

export function Cuestionario() {
  const { jugadorId } = useParams({ from: "/j/$jugadorId/cuestionario" });
  const preguntas = useQuery({ queryKey: ["preguntas"], queryFn: listarPreguntas, enabled: nubeConfigurada });
  const respuestas = useQuery({
    queryKey: ["respuestas", jugadorId],
    queryFn: () => misRespuestas(jugadorId),
    enabled: nubeConfigurada,
  });
  const porPregunta = new Map(respuestas.data?.map((r) => [r.pregunta_id, r.respuesta]));

  return (
    <main className="pantalla">
      <header className="cabecera">
        <Link to="/j/$jugadorId" params={{ jugadorId }} className="enlace-tenue">← Volver</Link>
        <h1>Cuestionario</h1>
        <p className="sub">No hay respuestas buenas ni malas. Responde como lo harías tú.</p>
      </header>
      {preguntas.isLoading && <p className="tenue">Cargando…</p>}
      {preguntas.data?.length === 0 && <p className="tenue">Todavía no hay preguntas.</p>}
      {respuestas.isSuccess &&
        preguntas.data?.map((p) => (
          <PreguntaCard key={p.id} jugadorId={jugadorId} p={p} guardada={porPregunta.get(p.id)} />
        ))}
    </main>
  );
}
