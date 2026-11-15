import { supabase } from "./supabase";

export type Jugador = { id: string; nombre: string; color: string | null; orden: number; activo: boolean; oro: number };

export type TipoAccion = "compra" | "entrenar" | "investigar" | "carta_pnj" | "otro";
export type EstadoAccion = "pendiente" | "resuelta" | "rechazada";
export type ObjetoDado = { item: string; cantidad: number; notas?: string };
export type Accion = {
  id: number;
  tipo: TipoAccion;
  texto: string;
  estado: EstadoAccion;
  respuesta_dm: string | null;
  oro_delta: number | null;
  objetos: ObjetoDado[];
  created_at: string;
  resuelta_at: string | null;
};
export type AccionMaster = Accion & { jugador_id: string };
export type ItemPetate = { id: number; item: string; cantidad: number; notas: string | null };
export type Petate = { oro: number; items: ItemPetate[] };
export type ItemInventario = ItemPetate & { jugador_id: string; visible: boolean };
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

/** Solo lo revelado: el filtrado lo hace el servidor, nunca el cliente.
 *  null = todavía no hay ficha que ver (cuestionario a medias o sin asignar). */
export async function fichaRevelada(jugadorId: string): Promise<FichaDatos | null> {
  return ok(await supabase.rpc("get_ficha_revelada", { p_jugador: jugadorId })) ?? null;
}

export async function retrato(jugadorId: string): Promise<string | null> {
  return ok(await supabase.rpc("get_retrato", { p_jugador: jugadorId })) ?? null;
}

export async function ponerRetrato(jugadorId: string, imagen: string | null): Promise<void> {
  ok(await supabase.rpc("poner_retrato", { p_jugador: jugadorId, p_imagen: imagen ?? "" }));
}

export type EntradaDiario = { id: number; texto: string; created_at: string; updated_at: string };

export async function miDiario(jugadorId: string): Promise<EntradaDiario[]> {
  return ok(await supabase.rpc("get_mi_diario", { p_jugador: jugadorId }));
}

export async function escribirDiario(jugadorId: string, id: number | null, texto: string): Promise<void> {
  ok(await supabase.rpc("escribir_diario", { p_jugador: jugadorId, p_id: id, p_texto: texto }));
}

export async function borrarDiario(jugadorId: string, id: number): Promise<void> {
  ok(await supabase.rpc("borrar_diario", { p_jugador: jugadorId, p_id: id }));
}

export async function misAcciones(jugadorId: string): Promise<Accion[]> {
  return ok(await supabase.rpc("get_mis_acciones", { p_jugador: jugadorId }));
}

export async function crearAccion(jugadorId: string, tipo: TipoAccion, texto: string): Promise<void> {
  ok(await supabase.rpc("crear_accion", { p_jugador: jugadorId, p_tipo: tipo, p_texto: texto }));
}

export async function retirarAccion(jugadorId: string, id: number): Promise<void> {
  ok(await supabase.rpc("retirar_accion", { p_jugador: jugadorId, p_id: id }));
}

export async function miPetate(jugadorId: string): Promise<Petate> {
  return ok(await supabase.rpc("get_mi_petate", { p_jugador: jugadorId })) ?? { oro: 0, items: [] };
}

/* ------------------------------------------------------------ máster ---- */

export async function accionesPendientes(): Promise<AccionMaster[]> {
  return ok(await supabase.from("acciones_offrol").select("*").eq("estado", "pendiente").order("created_at"));
}

export async function accionesRespondidas(): Promise<AccionMaster[]> {
  return ok(await supabase.from("acciones_offrol").select("*").neq("estado", "pendiente").order("resuelta_at", { ascending: false }).limit(30));
}

export async function resolverAccion(
  id: number, estado: "resuelta" | "rechazada", respuesta: string, oro: number, objetos: ObjetoDado[],
): Promise<void> {
  ok(await supabase.rpc("resolver_accion", { p_id: id, p_estado: estado, p_respuesta: respuesta, p_oro: oro, p_objetos: objetos }));
}

export async function inventarioDe(jugadorId: string): Promise<ItemInventario[]> {
  return ok(await supabase.from("inventario").select("*").eq("jugador_id", jugadorId).order("item"));
}

export async function anadirItem(jugadorId: string, item: string, cantidad: number): Promise<void> {
  ok(await supabase.from("inventario").insert({ jugador_id: jugadorId, item, cantidad, visible: true }));
}

export async function cambiarItem(id: number, cambios: Partial<Pick<ItemInventario, "item" | "cantidad" | "notas" | "visible">>): Promise<void> {
  ok(await supabase.from("inventario").update(cambios).eq("id", id));
}

export async function quitarItem(id: number): Promise<void> {
  ok(await supabase.from("inventario").delete().eq("id", id));
}

export async function ponerOro(jugadorId: string, oro: number): Promise<void> {
  ok(await supabase.from("jugadores").update({ oro }).eq("id", jugadorId));
}

export async function esMaster(): Promise<boolean> {
  return ok(await supabase.rpc("es_master")) === true;
}

export async function fichaCompleta(jugadorId: string): Promise<{ datos: FichaDatos; asignada: boolean } | null> {
  return ok(await supabase.from("fichas").select("datos, asignada").eq("jugador_id", jugadorId).maybeSingle());
}

/** El tick de "asignada": desde ese momento el jugador ve su ficha. */
export async function asignarFicha(jugadorId: string, si: boolean): Promise<void> {
  ok(await supabase.from("fichas").update({ asignada: si }).eq("jugador_id", jugadorId));
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

export type ResumenJugador = { nombre?: string; clase?: string; nivel?: number; asignada?: boolean; respuestas: number; pendientes: number };

/** Portada del biombo: de cada jugador, su personaje, el cuestionario y sus acciones pendientes. */
export async function resumenMaster(): Promise<Record<string, ResumenJugador>> {
  const [fichas, resp, pend] = await Promise.all([
    supabase.from("fichas").select("jugador_id, datos, asignada"),
    supabase.from("cuestionario_resp").select("jugador_id"),
    supabase.from("acciones_offrol").select("jugador_id").eq("estado", "pendiente"),
  ]);
  const out: Record<string, ResumenJugador> = {};
  const de = (id: string) => (out[id] ??= { respuestas: 0, pendientes: 0 });
  for (const x of ok(pend) as { jugador_id: string }[]) de(x.jugador_id).pendientes++;
  for (const f of ok(fichas) as { jugador_id: string; datos: FichaDatos; asignada: boolean }[]) {
    const r = de(f.jugador_id);
    r.asignada = f.asignada;
    if (typeof f.datos.nombre === "string" && f.datos.nombre) r.nombre = f.datos.nombre;
    if (typeof f.datos.clase === "string" && f.datos.clase) r.clase = f.datos.clase;
    if (typeof f.datos.nivel === "number") r.nivel = f.datos.nivel;
  }
  for (const x of ok(resp) as { jugador_id: string }[]) de(x.jugador_id).respuestas++;
  return out;
}

export async function respuestasDe(jugadorId: string): Promise<RespuestaMaster[]> {
  return ok(await supabase.from("cuestionario_resp").select("jugador_id, pregunta_id, respuesta, updated_at").eq("jugador_id", jugadorId));
}
