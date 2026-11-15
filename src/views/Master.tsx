import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { crearJugador, listarJugadores, listarPreguntas, resumenMaster, type Jugador } from "../lib/api";
import { oro } from "../lib/formato";
import { useSesion } from "../lib/sesion";
import { supabase } from "../lib/supabase";
import { Retrato } from "../components/Retrato";
import { Colores, COLORES } from "../components/Colores";

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
  const resumen = useQuery({ queryKey: ["resumen-master"], queryFn: resumenMaster, enabled: esMaster, refetchInterval: 60_000 });
  const pendientes = Object.values(resumen.data ?? {}).reduce((n, r) => n + r.pendientes, 0);
  const preguntas = useQuery({ queryKey: ["preguntas"], queryFn: listarPreguntas, enabled: esMaster });

  return (
    <main className="pantalla">
      <header className="cabecera fila">
        <div>
          <Link to="/" className="enlace-tenue">← Inicio</Link>
          <h1>Biombo</h1>
        </div>
        {sesion && (
          <button className="boton chico claro" onClick={async () => { await supabase.auth.signOut(); qc.clear(); }}>
            Salir
          </button>
        )}
      </header>

      {comprobando && <p className="tenue-claro">Comprobando…</p>}
      {!comprobando && !sesion && <Login />}
      {!comprobando && sesion && !esMaster && (
        <p className="error-claro">Esta cuenta no es de máster. Añádela a la tabla <code>masters</code>.</p>
      )}

      {esMaster && (
        <>
          <Link to="/master/acciones" className={`pagina contador ${pendientes ? "hay" : ""}`}>
            <span className="contador-num">{pendientes}</span>
            <span>
              <span className="jugador-nombre">Entre sesiones</span>
              <span className="jugador-meta">
                {pendientes === 0 ? "Nada por responder" : pendientes === 1 ? "1 acción por responder" : `${pendientes} acciones por responder`}
              </span>
            </span>
          </Link>

          <div className="lista">
            {jugadores.data?.filter((j) => j.activo).map((j) => {
              const r = resumen.data?.[j.id];
              const pj = r?.nombre ? `${r.nombre}${r.clase ? `, ${r.clase}` : ""}${r.nivel ? ` ${r.nivel}` : ""}` : "Sin ficha";
              const estado = r?.asignada === undefined ? "" : r.asignada ? " · asignada" : " · sin asignar";
              return (
                <Link key={j.id} to="/master/$jugadorId" params={{ jugadorId: j.id }} className="pagina jugador con-retrato" style={{ borderLeftColor: j.color ?? undefined }}>
                  <Retrato jugadorId={j.id} />
                  <span className="jugador-datos">
                    <span className="fila">
                      <span className="jugador-nombre">{j.nombre}</span>
                      {!!r?.pendientes && <span className="globo" title="Acciones por responder">{r.pendientes}</span>}
                    </span>
                    <span className="jugador-pj">{pj}{estado}</span>
                    <span className="jugador-meta">
                      {oro(j.oro)} · Cuestionario {r?.respuestas ?? 0}/{preguntas.data?.length ?? "…"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {jugadores.data && <NuevoJugador existentes={jugadores.data} />}

          {!!jugadores.data?.some((j) => !j.activo) && (
            <details className="pagina plegable">
              <summary>
                <h2>De baja</h2>
                <span className="tenue">{jugadores.data.filter((j) => !j.activo).length}</span>
              </summary>
              <p className="nota">No aparecen en la portada ni pueden usar la app. Sus datos se conservan: entra para darles de alta otra vez.</p>
              {jugadores.data.filter((j) => !j.activo).map((j) => (
                <p key={j.id} className="fila">
                  <span>{j.nombre}</span>
                  <Link to="/master/$jugadorId" params={{ jugadorId: j.id }} className="boton chico secundario">Abrir</Link>
                </p>
              ))}
            </details>
          )}
        </>
      )}
    </main>
  );
}

function NuevoJugador({ existentes }: { existentes: Jugador[] }) {
  const qc = useQueryClient();
  const libre = COLORES.find((c) => !existentes.some((j) => j.color?.toLowerCase() === c.toLowerCase())) ?? COLORES[0];
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState(libre);
  const [hecho, setHecho] = useState<string | null>(null);
  const crear = useMutation({
    mutationFn: () => crearJugador(nombre, color, existentes),
    onSuccess: (j) => {
      setHecho(j.nombre);
      setNombre("");
      qc.invalidateQueries({ queryKey: ["jugadores"] });
    },
  });
  useEffect(() => setColor(libre), [libre]);

  return (
    <details className="pagina plegable">
      <summary>
        <h2>Añadir jugador</h2>
      </summary>
      <form
        className="nuevo-jugador"
        onSubmit={(e) => {
          e.preventDefault();
          setHecho(null);
          if (nombre.trim()) crear.mutate();
        }}
      >
        <input className="campo" placeholder="Nombre del jugador" maxLength={40} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Colores valor={color} onCambio={setColor} />
        <button className="boton" disabled={!nombre.trim() || crear.isPending}>{crear.isPending ? "Añadiendo…" : "Añadir"}</button>
        {crear.error && <p className="error">{crear.error.message}</p>}
        {hecho && <p className="ok">{hecho} ya puede elegirse en la portada. Empezará por el cuestionario.</p>}
      </form>
    </details>
  );
}
