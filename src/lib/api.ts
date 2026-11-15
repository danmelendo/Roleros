import { supabase } from "./supabase";

export type Jugador = { id: string; nombre: string; color: string | null; orden: number; activo: boolean };
export type Pregunta = { id: number; orden: number; texto: string; opciones: string[]; libre: boolean };
export type Respuesta = { pregunta_id: number; respuesta: string };
export type RespuestaMaster = Respuesta & { jugador_id: string; updated_at: string };
export type FichaDatos = Record<string, unknown>;

function ok<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/* ----------------------------------------------------------- jugador ---- */

export async function listarJugadores(): Promise<Jugador[]> {
  return ok(await supabase.from("jugadores").select("*").order("orden"));
}

export async function listarPreguntas(): Promise<Pregunta[]> {
  return ok(await supabase.from("cuestionario_preg").select("id, orden, texto, opciones, libre").eq("activa", true).order("orden"));
}

export async function misRespuestas(jugadorId: string): Promise<Respuesta[]> {
  return ok(await supabase.rpc("get_mis_respuestas", { p_jugador: jugadorId }));
}

export async function enviarRespuesta(jugadorId: string, preguntaId: number, respuesta: string): Promise<void> {
  ok(await supabase.rpc("enviar_respuesta", { p_jugador: jugadorId, p_pregunta: preguntaId, p_respuesta: respuesta }));
}

/** Solo lo revelado: el filtrado lo hace el servidor, nunca el cliente. */
export async function fichaRevelada(jugadorId: string): Promise<FichaDatos> {
  return ok(await supabase.rpc("get_ficha_revelada", { p_jugador: jugadorId })) ?? {};
}

/* ------------------------------------------------------------ máster ---- */

export async function esMaster(): Promise<boolean> {
  return ok(await supabase.rpc("es_master")) === true;
}

export async function fichaCompleta(jugadorId: string): Promise<FichaDatos | null> {
  const fila = ok(await supabase.from("fichas").select("datos").eq("jugador_id", jugadorId).maybeSingle());
  return (fila as { datos: FichaDatos } | null)?.datos ?? null;
}

export async function guardarFicha(jugadorId: string, datos: FichaDatos): Promise<void> {
  ok(await supabase.from("fichas").upsert({ jugador_id: jugadorId, datos, updated_at: new Date().toISOString() }));
}

export async function rutasReveladas(jugadorId: string): Promise<string[]> {
  const filas = ok(await supabase.from("ficha_revelado").select("campo_path").eq("jugador_id", jugadorId));
  return (filas as { campo_path: string }[]).map((f) => f.campo_path);
}

export async function revelar(jugadorId: string, ruta: string, si: boolean): Promise<void> {
  if (si) ok(await supabase.from("ficha_revelado").upsert({ jugador_id: jugadorId, campo_path: ruta }));
  else ok(await supabase.from("ficha_revelado").delete().eq("jugador_id", jugadorId).eq("campo_path", ruta));
}

export async function respuestasDe(jugadorId: string): Promise<RespuestaMaster[]> {
  return ok(await supabase.from("cuestionario_resp").select("jugador_id, pregunta_id, respuesta, updated_at").eq("jugador_id", jugadorId));
}
