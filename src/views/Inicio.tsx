import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { listarJugadores } from "../lib/api";
import { guardarJugador, jugadorGuardado } from "../lib/jugador";
import { nubeConfigurada } from "../lib/supabase";

export function Inicio() {
  const navigate = useNavigate();
  const jugadores = useQuery({ queryKey: ["jugadores"], queryFn: listarJugadores, enabled: nubeConfigurada });

  // Si este móvil ya eligió, directo a su ficha.
  useEffect(() => {
    const id = jugadorGuardado();
    if (id) navigate({ to: "/j/$jugadorId", params: { jugadorId: id }, replace: true });
  }, [navigate]);

  return (
    <main className="pantalla">
      <header className="cabecera inicio-cabecera">
        <h1 className="logo">Roleros</h1>
        <p className="sub">Despiertas entre la hojarasca. No sabes cómo has llegado aquí.</p>
      </header>

      <section className="tarjeta">
        <h2>¿Quién eres?</h2>
        {jugadores.isLoading && <p className="tenue">Cargando…</p>}
        {jugadores.error && <p className="error">No se ha podido conectar: {jugadores.error.message}</p>}
        <div className="lista">
          {jugadores.data?.map((j) => (
            <button
              key={j.id}
              className="boton grande"
              style={{ borderColor: j.color ?? undefined }}
              onClick={() => {
                guardarJugador(j.id);
                navigate({ to: "/j/$jugadorId", params: { jugadorId: j.id } });
              }}
            >
              {j.nombre}
            </button>
          ))}
        </div>
      </section>

      <footer className="pie">
        <Link to="/master" className="enlace-tenue">Máster</Link>
      </footer>
    </main>
  );
}
