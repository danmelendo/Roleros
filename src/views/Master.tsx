import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listarJugadores } from "../lib/api";
import { useSesion } from "../lib/sesion";
import { supabase } from "../lib/supabase";

/* Supabase Auth exige correo. El máster entra con un nombre corto ("Dan")
   que se traduce a <nombre>@roleros.local; un correo completo también vale. */
const aCorreo = (usuario: string) => {
  const u = usuario.trim().toLowerCase();
  return u.includes("@") ? u : `${u}@roleros.local`;
};

function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  return (
    <form
      className="tarjeta"
      onSubmit={async (e) => {
        e.preventDefault();
        setEntrando(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email: aCorreo(usuario), password: clave });
        setEntrando(false);
        if (error) setError(error.message === "Invalid login credentials" ? "Usuario o contraseña incorrectos" : error.message);
      }}
    >
      <h2>Entrar como máster</h2>
      <input className="campo" type="text" autoCapitalize="none" autoComplete="username" placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
      <input className="campo" type="password" autoComplete="current-password" placeholder="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} />
      <button className="boton" disabled={entrando || !usuario.trim() || !clave}>{entrando ? "Entrando…" : "Entrar"}</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

export function Master() {
  const { sesion, esMaster, comprobando } = useSesion();
  const qc = useQueryClient();
  const jugadores = useQuery({ queryKey: ["jugadores"], queryFn: listarJugadores, enabled: esMaster });

  return (
    <main className="pantalla">
      <header className="cabecera fila">
        <div>
          <Link to="/" className="enlace-tenue">← Inicio</Link>
          <h1>Biombo</h1>
        </div>
        {sesion && (
          <button className="boton chico" onClick={async () => { await supabase.auth.signOut(); qc.clear(); }}>
            Salir
          </button>
        )}
      </header>

      {comprobando && <p className="tenue">Comprobando…</p>}
      {!comprobando && !sesion && <Login />}
      {!comprobando && sesion && !esMaster && (
        <p className="error">Esta cuenta no es de máster. Añádela a la tabla <code>masters</code>.</p>
      )}

      {esMaster && (
        <section className="tarjeta">
          <h2>Jugadores</h2>
          <div className="lista">
            {jugadores.data?.map((j) => (
              <Link key={j.id} to="/master/$jugadorId" params={{ jugadorId: j.id }} className="boton grande" style={{ borderColor: j.color ?? undefined }}>
                {j.nombre}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
