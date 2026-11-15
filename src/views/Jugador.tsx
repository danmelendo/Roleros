import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { fichaRevelada, listarJugadores, listarPreguntas, misAcciones, misRespuestas } from "../lib/api";
import { guardarJugador } from "../lib/jugador";
import { nubeConfigurada } from "../lib/supabase";
import { Retrato } from "../components/Retrato";
import { AvisoInstalar } from "../components/AvisoInstalar";

/* Cuándo vio el jugador sus acciones por última vez: para el punto rojo de
   "el máster te ha contestado". Por móvil, en localStorage. */
const claveVistas = (id: string) => `roleros:acciones-vistas:${id}`;
export function marcarAccionesVistas(id: string) {
  try { localStorage.setItem(claveVistas(id), new Date().toISOString()); } catch { /* sin almacenamiento */ }
}
function accionesVistas(id: string): string {
  try { return localStorage.getItem(claveVistas(id)) ?? ""; } catch { return ""; }
}

export function JugadorLayout() {
  const { jugadorId } = useParams({ from: "/j/$jugadorId" });
  const navigate = useNavigate();
  const { pathname } = useLocation(); // re-render al cambiar de pestaña (recalcula el punto)

  const jugadores = useQuery({ queryKey: ["jugadores"], queryFn: listarJugadores, enabled: nubeConfigurada });
  const ficha = useQuery({
    queryKey: ["ficha", jugadorId],
    queryFn: () => fichaRevelada(jugadorId),
    enabled: nubeConfigurada,
    refetchInterval: 60_000, // lo que revele el máster aparece solo
  });
  const acciones = useQuery({
    queryKey: ["acciones", jugadorId],
    queryFn: () => misAcciones(jugadorId),
    enabled: nubeConfigurada,
    refetchInterval: 60_000,
  });

  /* Hasta acabar el cuestionario no hay nada más: ni pestañas, ni retrato.
     (La ficha, además, la cierra el servidor en get_ficha_revelada.) */
  const preguntas = useQuery({ queryKey: ["preguntas"], queryFn: listarPreguntas, enabled: nubeConfigurada });
  const respuestas = useQuery({ queryKey: ["respuestas", jugadorId], queryFn: () => misRespuestas(jugadorId), enabled: nubeConfigurada });
  const sabido = !nubeConfigurada || (preguntas.isSuccess && respuestas.isSuccess);
  const completo = !nubeConfigurada || (sabido && preguntas.data!.every((p) => respuestas.data!.some((r) => r.pregunta_id === p.id)));
  const enCuestionario = pathname.endsWith("/cuestionario");
  useEffect(() => {
    if (sabido && !completo && !enCuestionario) navigate({ to: "/j/$jugadorId/cuestionario", params: { jugadorId }, replace: true });
  }, [sabido, completo, enCuestionario, jugadorId, navigate]);

  const yo = jugadores.data?.find((j) => j.id === jugadorId);
  const nombre = typeof ficha.data?.nombre === "string" && ficha.data.nombre ? ficha.data.nombre : null;
  const enAcciones = pathname.endsWith("/acciones");
  const vistas = accionesVistas(jugadorId);
  const contestadas = !enAcciones && (acciones.data ?? []).some((a) => a.resuelta_at && a.resuelta_at > vistas);

  const pestanas = [
    { to: "/j/$jugadorId", nombre: "Ficha", exacta: true },
    { to: "/j/$jugadorId/petate", nombre: "Petate" },
    { to: "/j/$jugadorId/acciones", nombre: "Acciones", punto: contestadas },
    { to: "/j/$jugadorId/diario", nombre: "Diario" },
    { to: "/j/$jugadorId/cuestionario", nombre: "Cuestionario" },
  ] as const;

  return (
    <main className="pantalla">
      <header className="cabecera fila">
        <div className="quien-soy">
          {completo && <Retrato jugadorId={jugadorId} editable />}
          <div>
            <p className="sub">{yo?.nombre ?? "…"}</p>
            <h1 className={nombre ? "" : "desconocido"}>{nombre ?? "¿Quién eres?"}</h1>
          </div>
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

      {!sabido && <p className="tenue-claro">Cargando…</p>}
      {sabido && !completo && enCuestionario && <Outlet />}

      {completo && (
        <>
          <nav className="pestanas" aria-label="Secciones">
            {pestanas.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                params={{ jugadorId }}
                className="pestana"
                activeProps={{ className: "activa" }}
                activeOptions={{ exact: "exacta" in p && p.exacta }}
              >
                {p.nombre}
                {"punto" in p && p.punto && <span className="punto" aria-label="respuesta nueva" />}
              </Link>
            ))}
          </nav>
          <AvisoInstalar />
          <Outlet />
        </>
      )}
    </main>
  );
}
