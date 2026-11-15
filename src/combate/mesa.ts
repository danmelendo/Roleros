import { DESC_ESTADO, ESTADOS, PRESETS } from "./datos";
import { leerBloque, type Ataque, type Bloque } from "./bloque";
import estilos from "./mesa.css?inline";

/* =============================================================================
   Mesa de combate del máster (Pathfinder 1e): iniciativa, PG, estados y
   efectos con rondas. Pinta con plantillas de texto dentro de un Shadow DOM
   (los estilos de la app no le afectan) y guarda todo en el localStorage del
   portátil. Los PJ salen de las fichas (conexion.cargarPJs); los PG solo se
   escriben en las fichas cuando el máster lo pide (conexion.apuntarPG).
   ============================================================================= */

export type PJDeFicha = {
  jugadorId: string;
  jugador: string;
  color: string | null;
  nombre: string;
  tieneFicha: boolean;
  pgMax: number | null;
  pg: number | null;
  ca: number | null;
  toque: number | null;
  desprevenido: number | null;
  ini: number | null;
  con: number | null;
  fort: number | null;
  ref: number | null;
  vol: number | null;
  dmc: number | null;
  percepcion: number | null;
};

export type Conexion = {
  cargarPJs: () => Promise<PJDeFicha[]>;
  apuntarPG: (jugadorId: string, pg: number) => Promise<void>;
};

type TipoEfecto = "estado" | "buff" | "debuff";
type Criatura = {
  id: string;
  pj: boolean;
  aliado?: boolean;
  ficha?: string;             // jugador_id, si sale de una ficha
  conFicha?: boolean;         // la ficha existe (si no, los números son a mano)
  jugador?: string;
  color?: string;
  nombre: string;
  pgMax: number;
  pg: number;
  temp: number;
  noLetal: number;
  ca: number;
  toque?: number | null;
  desprevenido?: number | null;
  mod: number;
  con?: number | null;
  fort?: number | null;
  ref?: number | null;
  vol?: number | null;
  dmc?: number | null;
  percepcion?: number | null;
  // Solo criaturas leídas de un bloque de estadísticas:
  ataques?: Ataque[];
  vd?: string | null;
  defensas?: string[];
  especiales?: string | null;
  velocidad?: string | null;
  notas: string;
  ini: number | null;
  grupo?: string | null;
  espera: boolean;
};
type Salvacion = "fort" | "ref" | "vol";
const NOMBRE_SALV: Record<Salvacion, string> = { fort: "Fortaleza", ref: "Reflejos", vol: "Voluntad" };
type Efecto = { id: string; objetivo: string; nombre: string; tipo: TipoEfecto; rondas: number | null; dueno: string | null; nota: string };
type Plantilla = { nombre: string; pg: string; ca: number; mod: number; notas: string; aliado: boolean; bloque?: Bloque | null };
type Linea = { r: number; texto: string; sep?: boolean };
type Mesa = {
  v: number;
  criaturas: Record<string, Criatura>;
  orden: string[];
  activo: boolean;
  ronda: number;
  turno: string | null;
  efectos: Efecto[];
  plantillas: Plantilla[];
  registro: Linea[];
  leidas?: string;            // última lectura de las fichas (ISO)
};
type Aviso = { t: string; k: "" | "malo" | "fin"; html?: boolean };

const CLAVE = "roleros:mesa-combate";
const COLOR_PJ = "#C9A227";

const nueva = (): Mesa => ({ v: 1, criaturas: {}, orden: [], activo: false, ronda: 0, turno: null, efectos: [], plantillas: [], registro: [] });
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
const entero = (v: unknown, def: number | null = 0): number | null => {
  if (v === "" || v == null) return def;
  const x = Number(v);
  return Number.isFinite(x) ? Math.trunc(x) : def;
};
const d = (caras: number) => 1 + Math.floor(Math.random() * caras);
const signo = (x: number | null | undefined) => (x == null ? "—" : x >= 0 ? `+${x}` : `−${Math.abs(x)}`);

/** "2d6+3", "1d8+1d6-1", "12"… → { total, dados } o null si no se entiende. */
export function tirar(expr: string): { total: number; dados: boolean } | null {
  const s = String(expr).replace(/\s+/g, "").toLowerCase().replace(/−/g, "-");
  if (!/^[+-]?\d+(d\d+)?([+-]\d+(d\d+)?)*$/.test(s)) return null;
  let total = 0, dados = false;
  for (const m of s.matchAll(/([+-]?)(\d+)(?:d(\d+))?/g)) {
    const sg = m[1] === "-" ? -1 : 1;
    let v = +m[2];
    if (m[3]) {
      dados = true;
      v = 0;
      for (let i = 0; i < Math.min(+m[2], 200); i++) v += d(+m[3]);
    }
    total += sg * v;
  }
  return { total, dados };
}

export function montarMesa(host: HTMLElement, conexion: Conexion): () => void {
  const raiz = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  raiz.innerHTML = `<style>${estilos}</style><div id="app"></div><dialog id="dlg"></dialog><input type="file" id="fichero" accept=".json,application/json" hidden>`;
  const app = raiz.getElementById("app")!;
  const dlg = raiz.getElementById("dlg") as HTMLDialogElement;
  const fichero = raiz.getElementById("fichero") as HTMLInputElement;

  let S: Mesa = cargar() ?? nueva();
  let historial: string[] = [];
  let sel = new Set<string>();
  let pestana = "acciones";
  let avisos: Aviso[] = [];
  let leyendo = false;
  let vivo = true;
  let bloque: Bloque | null = null;        // bloque de estadísticas leído en Enemigos
  let atacante: string | null = null;      // de quién se enseñan los ataques (si no, el del turno)
  const B: Record<string, string | boolean> = {}; // borradores de los formularios del panel

  function cargar(): Mesa | null {
    try {
      const t = localStorage.getItem(CLAVE);
      return t ? { ...nueva(), ...JSON.parse(t) } : null;
    } catch {
      return null;
    }
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch { /* sin almacenamiento: sigue en memoria */ }
  }
  /** Toda modificación pasa por aquí: foto para deshacer, cambio, guardar, pintar. */
  function cambiar(fn: () => void) {
    historial.push(JSON.stringify(S));
    if (historial.length > 150) historial.shift();
    fn();
    guardar();
    render();
  }
  function deshacer() {
    const t = historial.pop();
    if (!t) return;
    S = JSON.parse(t);
    for (const id of [...sel]) if (!S.criaturas[id]) sel.delete(id);
    avisos = [{ t: "Deshecho el último cambio.", k: "" }];
    guardar();
    render();
  }
  const aviso = (t: string, k: Aviso["k"] = "malo", html = false) => { avisos = [{ t, k, html }]; render(); };

  const C = (id: string | null | undefined) => (id ? S.criaturas[id] : undefined);
  const val = (k: string, def = "") => esc(B[k] ?? def);
  const texto = (k: string) => String(B[k] ?? "").trim();

  function log(t: string, sep = false) {
    S.registro.unshift({ r: S.activo ? S.ronda : 0, texto: t, sep });
    if (S.registro.length > 400) S.registro.length = 400;
  }

  /* ------------------------------------------------------------- vida -- */
  /** Cómo está de PG. fuera = se salta su turno. */
  function estadoPG(c: Criatura): { t: string; k: string; fuera?: boolean } | null {
    if (c.pj) {
      if (c.con && c.pg <= -c.con) return { t: "Muerto", k: "muerto", fuera: true };
      if (c.pg < 0) return { t: "Moribundo", k: "grave" };
      if (c.pg === 0) return { t: "Incapacitado", k: "grave" };
    } else if (c.pg <= 0) {
      return { t: "Fuera de combate", k: "muerto", fuera: true };
    }
    if (c.noLetal > 0 && c.noLetal > c.pg) return { t: "Inconsciente (no letal)", k: "grave" };
    if (c.noLetal > 0 && c.noLetal === c.pg) return { t: "Tambaleante (no letal)", k: "aviso" };
    return null;
  }
  const salta = (c: Criatura) => c.espera || !!estadoPG(c)?.fuera;
  const efectosDe = (id: string) => S.efectos.filter((e) => e.objetivo === id);
  const tieneEstado = (id: string, nombre: string) => S.efectos.some((e) => e.objetivo === id && e.tipo === "estado" && e.nombre === nombre);

  function avisarCambio(c: Criatura, antes: string | undefined) {
    const ahora = estadoPG(c)?.t;
    if (ahora && ahora !== antes) avisos.push({ t: `${c.nombre}: ${ahora.toLowerCase()}.`, k: "malo" });
  }
  function danar(c: Criatura, x: number) {
    const antes = estadoPG(c)?.t, a = c.pg;
    const usa = Math.min(c.temp || 0, x);
    c.temp = (c.temp || 0) - usa;
    c.pg -= x - usa;
    log(`${c.nombre} recibe ${x} de daño (${a} → ${c.pg}${usa ? `; ${usa} se los comen los temporales` : ""}).`);
    avisarCambio(c, antes);
  }
  function curar(c: Criatura, x: number) {
    const a = c.pg;
    c.pg = Math.min(c.pgMax, c.pg + x);
    c.noLetal = Math.max(0, (c.noLetal || 0) - x);
    log(`${c.nombre} se cura ${x} (${a} → ${c.pg}).`);
  }
  function noLetal(c: Criatura, x: number) {
    const antes = estadoPG(c)?.t;
    c.noLetal = (c.noLetal || 0) + x;
    log(`${c.nombre} recibe ${x} de daño no letal (total ${c.noLetal}).`);
    avisarCambio(c, antes);
  }
  function temporales(c: Criatura, x: number) {
    c.temp = Math.max(c.temp || 0, x); // no se acumulan: se queda el mayor
    log(`${c.nombre} tiene ${c.temp} PG temporales.`);
  }

  /* ----------------------------------------------------------- turnos -- */
  /* Los efectos cuentan al EMPEZAR el turno de su "dueño" (quien los lanzó);
     los que no tienen dueño, al empezar cada ronda. */
  function contar(dueno: string | null) {
    for (const e of [...S.efectos]) {
      if ((e.dueno ?? null) !== dueno || e.rondas == null) continue;
      e.rondas--;
      if (e.rondas <= 0) {
        S.efectos = S.efectos.filter((x) => x !== e);
        const quien = C(e.objetivo)?.nombre ?? "?";
        avisos.push({ t: `Se acaba <b>${esc(e.nombre)}</b> en ${esc(quien)}.`, k: "fin", html: true });
        log(`Se acaba ${e.nombre} en ${quien}.`);
      }
    }
  }
  function ordenar() {
    const pos = new Map(S.orden.map((id, i) => [id, i]));
    S.orden.sort((a, b) => {
      const x = C(a)!, y = C(b)!;
      return (y.ini ?? -99) - (x.ini ?? -99) || (y.mod || 0) - (x.mod || 0) || pos.get(a)! - pos.get(b)!;
    });
  }
  function tirarIniciativas() {
    const grupos: Record<string, number> = {};
    for (const id of S.orden) {
      const c = C(id)!;
      if (c.pj || c.ini != null) continue;
      if (c.grupo && grupos[c.grupo] != null) { c.ini = grupos[c.grupo]; continue; }
      const t = d(20);
      c.ini = t + (c.mod || 0);
      if (c.grupo) grupos[c.grupo] = c.ini;
      log(`Iniciativa de ${c.nombre}: ${t} ${signo(c.mod || 0)} = ${c.ini}.`);
    }
  }
  /** Con el combate empezado: se coloca según su iniciativa, sin reordenar al resto. */
  function insertarPorIni(id: string) {
    const ini = C(id)!.ini ?? -99;
    S.orden = S.orden.filter((o) => o !== id);
    let j = S.orden.findIndex((o) => (C(o)!.ini ?? -99) < ini);
    if (j < 0) j = S.orden.length;
    S.orden.splice(j, 0, id);
  }
  function empezar() {
    const faltan = S.orden.map((id) => C(id)!).filter((c) => c.pj && c.ini == null);
    if (faltan.length) return aviso(`Falta la iniciativa de ${faltan.map((c) => c.nombre).join(", ")}.`);
    if (!S.orden.length) return;
    cambiar(() => {
      avisos = [];
      tirarIniciativas();
      ordenar();
      S.activo = true;
      S.ronda = 1;
      S.turno = S.orden.find((id) => !salta(C(id)!)) ?? S.orden[0];
      log("Empieza el combate", true);
      log("— Ronda 1 —", true);
    });
  }
  /** Pasa al siguiente que pueda actuar, contando efectos por el camino. */
  function avanzar() {
    const total = S.orden.length;
    let i = S.orden.indexOf(S.turno ?? "");
    for (let k = 0; k <= total; k++) {
      i++;
      if (i >= total) {
        i = 0;
        S.ronda++;
        log(`— Ronda ${S.ronda} —`, true);
        contar(null);
      }
      const c = C(S.orden[i])!;
      if (c.espera) continue;
      contar(c.id);
      if (!salta(c)) { S.turno = c.id; return; }
    }
  }
  function siguiente() {
    if (!S.activo || !S.orden.length) return;
    atacante = null;
    cambiar(() => { avisos = []; avanzar(); });
  }
  function retrasar(id: string) {
    const c = C(id)!;
    c.espera = true;
    log(`${c.nombre} retrasa su turno.`);
    avanzar();
  }
  function actuarYa(id: string) {
    const c = C(id)!;
    avisos = [];
    c.espera = false;
    const actual = C(S.turno);
    if (actual && actual.id !== id) {
      c.ini = actual.ini;
      S.orden = S.orden.filter((o) => o !== id);
      S.orden.splice(S.orden.indexOf(actual.id) + 1, 0, id);
    }
    S.turno = id;
    contar(id);
    log(`${c.nombre} actúa ahora (iniciativa ${c.ini ?? "—"}).`);
  }
  function quitarDeOrden(id: string) {
    const i = S.orden.indexOf(id);
    if (i < 0) return;
    S.orden.splice(i, 1);
    if (S.turno === id) S.turno = S.orden.length ? S.orden[i % S.orden.length] : null;
    for (const e of S.efectos) if (e.dueno === id) e.dueno = null;
  }
  function mover(id: string, paso: number) {
    const i = S.orden.indexOf(id), j = i + paso;
    if (i < 0 || j < 0 || j >= S.orden.length) return;
    [S.orden[i], S.orden[j]] = [S.orden[j], S.orden[i]];
  }
  function terminar() {
    for (const c of Object.values(S.criaturas)) {
      if (c.pj) { c.ini = null; c.espera = false; continue; }
      quitarDeOrden(c.id);
      delete S.criaturas[c.id];
    }
    S.efectos = S.efectos.filter((e) => S.criaturas[e.objetivo]);
    for (const e of S.efectos) e.dueno = null;
    S.activo = false;
    S.ronda = 0;
    S.turno = null;
    sel.clear();
    avisos = [];
    log("Fin del combate", true);
  }

  /* ------------------------------------------------------------ fichas -- */
  /** Lee los PJ de las fichas. Los números (PG máx., CA, inic., salvaciones…)
      mandan siempre las fichas; los PG actuales solo fuera de combate, porque
      durante el combate los lleva la mesa. */
  async function leerFichas(manual: boolean) {
    if (leyendo) return;
    leyendo = true;
    render();
    let pjs: PJDeFicha[];
    try {
      pjs = await conexion.cargarPJs();
    } catch (e) {
      leyendo = false;
      if (!vivo) return;
      aviso(`No he podido leer las fichas (${e instanceof Error ? e.message : "sin conexión"}). Sigo con lo que tenía guardado.`);
      return;
    }
    leyendo = false;
    if (!vivo) return;
    const hacer = () => {
      const vistos = new Set<string>();
      for (const p of pjs) {
        const id = `pj:${p.jugadorId}`;
        vistos.add(id);
        let c = S.criaturas[id];
        if (!c) {
          c = S.criaturas[id] = {
            id, pj: true, ficha: p.jugadorId, nombre: p.nombre, pgMax: 10, pg: 10, temp: 0, noLetal: 0,
            ca: 10, mod: 0, notas: "", ini: null, espera: false,
          };
          if (!S.activo) S.orden.push(id);
        }
        c.nombre = p.nombre;
        c.jugador = p.jugador;
        c.color = p.color ?? COLOR_PJ;
        c.conFicha = p.tieneFicha;
        if (p.tieneFicha) {
          c.pgMax = Math.max(1, p.pgMax ?? c.pgMax);
          if (!S.activo && p.pg != null) c.pg = p.pg;
          c.ca = p.ca ?? c.ca;
          c.toque = p.toque;
          c.desprevenido = p.desprevenido;
          c.mod = p.ini ?? 0;
          c.con = p.con;
          c.fort = p.fort; c.ref = p.ref; c.vol = p.vol;
          c.dmc = p.dmc;
          c.percepcion = p.percepcion;
        }
      }
      // Jugadores dados de baja: fuera de la mesa (salvo en mitad de un combate).
      for (const c of Object.values(S.criaturas)) {
        if (c.pj && !vistos.has(c.id) && !(S.activo && S.orden.includes(c.id))) {
          quitarDeOrden(c.id);
          delete S.criaturas[c.id];
          S.efectos = S.efectos.filter((e) => e.objetivo !== c.id);
        }
      }
      S.leidas = new Date().toISOString();
      if (manual) avisos = [{ t: `Fichas leídas: ${pjs.length} PJ.${S.activo ? " Los PG actuales no se tocan en mitad del combate." : ""}`, k: "fin" }];
    };
    if (manual) cambiar(hacer);
    else { hacer(); guardar(); render(); }
  }

  async function apuntarPGs() {
    const pjs = Object.values(S.criaturas).filter((c) => c.pj && c.ficha && c.conFicha);
    if (!pjs.length) return aviso("Ningún PJ tiene ficha en la que apuntar.");
    avisos = [{ t: "Apuntando los PG en las fichas…", k: "" }];
    render();
    try {
      await Promise.all(pjs.map((c) => conexion.apuntarPG(c.ficha!, c.pg)));
      if (!vivo) return;
      aviso(`PG apuntados en las fichas: ${pjs.map((c) => `${c.nombre} ${c.pg}/${c.pgMax}`).join(" · ")}.`, "fin");
    } catch (e) {
      if (!vivo) return;
      aviso(`No he podido apuntar los PG (${e instanceof Error ? e.message : "sin conexión"}). Vuelve a probar con conexión.`);
    }
  }

  /* ---------------------------------------------------------- acciones -- */
  function objetivos(): string[] {
    const ids = [...sel].filter((id) => S.criaturas[id]);
    if (!ids.length) aviso("Primero elige a alguien en la lista (clic; Ctrl+clic para varios).");
    return ids;
  }
  /** Salvación de una criatura con bono conocido: { d20, total, salva }. */
  function salvar(c: Criatura, tipo: Salvacion, cd: number) {
    const bono = c[tipo];
    if (bono == null) return null;
    const r = d(20);
    const total = r + bono;
    return { r, total, salva: r === 20 || (r !== 1 && total >= cd) };
  }
  function aplicarPG(modo: string) {
    const ids = objetivos();
    if (!ids.length) return;
    const tipo = (B["sv-tipo"] || "") as Salvacion | "";
    const cd = entero(B["sv-cd"], null);
    if ((modo === "salv" || (modo === "dano" && tipo)) && (!tipo || cd == null)) {
      return aviso("Para tirar salvaciones elige cuál (Fort, Ref o Vol) y pon la CD.");
    }
    if (modo === "salv") {
      cambiar(() => {
        avisos = [{ t: `<b>${NOMBRE_SALV[tipo as Salvacion]} CD ${cd}:</b>`, k: "", html: true }];
        for (const id of ids) {
          const c = C(id)!;
          if (c.pj) { avisos.push({ t: `${esc(c.nombre)}: que la tire su jugador (${signo(c[tipo as Salvacion])}).`, k: "", html: true }); continue; }
          const s = salvar(c, tipo as Salvacion, cd!);
          const txt = s ? `${c.nombre}: ${s.total} (d20 ${s.r}) → ${s.salva ? "salva" : "falla"}` : `${c.nombre}: sin dato de ${NOMBRE_SALV[tipo as Salvacion]}`;
          avisos.push({ t: txt, k: s?.salva ? "fin" : "malo" });
          log(`Salvación de ${NOMBRE_SALV[tipo as Salvacion]} CD ${cd}: ${txt}.`);
        }
      });
      return;
    }
    const tx = texto("pg-cant");
    const t = tirar(tx);
    if (!t || t.total < 0) return aviso(`No entiendo «${esc(tx)}». Pon un número o dados, como 2d6+3.`, "malo", true);
    cambiar(() => {
      avisos = [];
      if (t.dados) {
        log(`Tirada ${tx}: ${t.total}.`);
        avisos.push({ t: `Tirada ${esc(tx)}: <b>${t.total}</b>`, k: "", html: true });
      }
      const x = modo === "mitad" ? Math.floor(t.total / 2) : t.total;
      for (const id of ids) {
        const c = C(id)!;
        if (modo === "dano" && tipo) {
          // Daño con salvación: los enemigos tiran solos; los PJ, su jugador.
          if (c.pj) {
            avisos.push({ t: `<b>${esc(c.nombre)}</b>: que tire ${NOMBRE_SALV[tipo]} CD ${cd} (${signo(c[tipo])}). Si falla, ${t.total}; si salva, ${Math.floor(t.total / 2)}. Pónselo en su casilla.`, k: "malo", html: true });
            continue;
          }
          const s = salvar(c, tipo, cd!);
          const dano = s?.salva ? Math.floor(t.total / 2) : t.total;
          avisos.push({ t: s ? `${c.nombre}: ${NOMBRE_SALV[tipo]} ${s.total} (d20 ${s.r}) → ${s.salva ? `salva, ${dano}` : `falla, ${dano}`}` : `${c.nombre}: sin dato de ${NOMBRE_SALV[tipo]}, daño completo`, k: s?.salva ? "fin" : "malo" });
          danar(c, dano);
        } else if (modo === "dano" || modo === "mitad") danar(c, x);
        else if (modo === "curar") curar(c, x);
        else if (modo === "nl") noLetal(c, x);
        else if (modo === "temp") temporales(c, x);
      }
      B["pg-cant"] = "";
    });
  }

  /* ---------------------------------------------------------- ataques -- */
  function atacar(cid: string, indices: number[]) {
    const c = C(cid);
    if (!c?.ataques) return;
    const ids = [...sel].filter((x) => x !== cid && S.criaturas[x]);
    const obj = ids.length === 1 ? C(ids[0])! : null;
    let total = 0;
    const lineas: string[] = [];
    for (const i of indices) {
      const a = c.ataques[i];
      if (!a) continue;
      const caObj = obj ? (a.toque ? obj.toque ?? obj.ca : obj.ca) : null;
      for (let k = 0; k < a.n; k++) {
        for (const bono of indices.length === 1 && a.n === 1 ? a.bonos.slice(0, 1) : a.bonos) {
          const r = d(20);
          const tot = r + bono;
          const impacta = r === 20 ? true : r === 1 ? false : caObj == null ? null : tot >= caObj;
          const nombre = `${a.nombre}${a.n > 1 ? ` ${k + 1}` : ""} ${signo(bono)}`;
          let txt = `<b>${esc(nombre)}</b>: ${tot} <span class="tenue">(d20 ${r})</span>`;
          if (impacta === false) { lineas.push(`${txt} → falla`); continue; }
          let dano = a.dano ? Math.max(1, tirar(a.dano)?.total ?? 0) : 0;
          if (r >= a.critMin && a.dano) {
            const r2 = d(20);
            const conf = r2 === 20 || (r2 !== 1 && (caObj == null ? null : r2 + bono >= caObj));
            if (conf !== false && a.dano) {
              let crit = 0;
              for (let m = 0; m < a.critMult; m++) crit += Math.max(1, tirar(a.dano)?.total ?? 0);
              txt += ` → <b>amenaza</b>, confirmación ${r2 + bono} (d20 ${r2})${conf === null ? ": si confirma, " + crit + " de daño; si no, " + dano : ` → <b>¡crítico!</b> ${crit} de daño`}`;
              if (conf) dano = crit;
            } else {
              txt += ` → amenaza sin confirmar (${r2 + bono}), ${dano} de daño`;
            }
          } else {
            txt += impacta ? ` → impacta, ${dano} de daño` : `, ${dano} de daño si impacta`;
          }
          if (a.extra) txt += ` <span class="tenue">${esc(a.extra)}</span>`;
          if (impacta && caObj != null) total += dano;
          lineas.push(txt);
        }
      }
    }
    cambiar(() => {
      const contra = obj ? ` contra ${obj.nombre} (CA ${obj.ca}${obj.toque != null ? `, toque ${obj.toque}` : ""})` : "";
      avisos = [{ t: `<b>Ataca ${esc(c.nombre)}</b>${esc(contra)}${obj ? "" : ' <span class="tenue">— elige un objetivo en la lista para comparar con su CA</span>'}`, k: "", html: true },
        ...lineas.map((l) => ({ t: l, k: "" as const, html: true }))];
      if (obj && total > 0) avisos.push({ t: `<button class="boton prim peq" data-a="aplicarAtaque" data-id="${obj.id}" data-n="${total}">Aplicar ${total} de daño a ${esc(obj.nombre)}</button>`, k: "malo", html: true });
      log(`${c.nombre} ataca${contra}: ${lineas.map((l) => l.replace(/<[^>]+>/g, "")).join(" · ")}.`);
    });
  }
  function pgRapido(id: string, entrada: string, curarSiempre: boolean) {
    let s = entrada.trim().replace(/−/g, "-");
    if (!s) return;
    let cura = curarSiempre;
    if (s.startsWith("+")) { cura = true; s = s.slice(1); } else if (s.startsWith("-")) s = s.slice(1);
    const t = tirar(s);
    if (!t) return aviso(`No entiendo «${esc(entrada)}».`, "malo", true);
    cambiar(() => {
      avisos = [];
      if (t.dados) log(`Tirada ${s}: ${t.total}.`);
      if (cura) curar(C(id)!, t.total); else danar(C(id)!, t.total);
    });
  }
  function rondasDe(v: unknown, unidad: string): number | null {
    const x = entero(v, null);
    if (x == null || x <= 0) return null;
    return x * ({ r: 1, min: 10, h: 600 }[unidad] ?? 1);
  }
  function alternarEstado(nombre: string) {
    const ids = objetivos();
    if (!ids.length) return;
    const todos = ids.every((id) => tieneEstado(id, nombre));
    const rondas = rondasDe(B["est-r"], "r");
    cambiar(() => {
      for (const id of ids) {
        const c = C(id)!;
        if (todos) {
          S.efectos = S.efectos.filter((e) => !(e.objetivo === id && e.tipo === "estado" && e.nombre === nombre));
          log(`${c.nombre} ya no está ${nombre.toLowerCase()}.`);
        } else if (!tieneEstado(id, nombre)) {
          S.efectos.push({ id: uid(), objetivo: id, nombre, tipo: "estado", rondas, dueno: S.activo ? S.turno : null, nota: DESC_ESTADO[nombre] ?? "" });
          log(`${c.nombre}: ${nombre.toLowerCase()}${rondas ? ` (${rondas} r)` : ""}.`);
        }
      }
    });
  }
  function anadirEfecto() {
    const ids = objetivos();
    if (!ids.length) return;
    const nombre = texto("ef-nombre");
    if (!nombre) return aviso("Ponle nombre al efecto.");
    const rondas = rondasDe(B["ef-r"], String(B["ef-u"] || "r"));
    const tipo = (B["ef-tipo"] || "buff") as TipoEfecto;
    const elegido = B["ef-dueno"] !== undefined ? String(B["ef-dueno"]) || null : S.activo ? S.turno : null;
    const dueno = elegido && S.criaturas[elegido] ? elegido : null;
    const nota = texto("ef-nota");
    cambiar(() => {
      for (const id of ids) S.efectos.push({ id: uid(), objetivo: id, nombre, tipo, rondas, dueno, nota });
      log(`${nombre} en ${ids.map((id) => C(id)!.nombre).join(", ")}${rondas ? ` (${rondas} r)` : " (sin límite)"}.`);
      B["ef-nombre"] = ""; B["ef-nota"] = ""; B["ef-r"] = "";
    });
  }
  function anadirEnemigos() {
    const base = texto("en-nombre");
    if (!base) return aviso("Ponle nombre a la criatura.");
    const pgTx = texto("en-pg") || "1";
    if (!tirar(pgTx)) return aviso(`PG «${esc(pgTx)}»: pon un número o dados, como 3d8+6.`, "malo", true);
    const cuantos = Math.max(1, Math.min(30, entero(B["en-n"], 1)!));
    const ca = entero(B["en-ca"], 10)!, mod = entero(B["en-mod"], 0)!, notas = texto("en-notas");
    const aliado = B["en-tipo"] === "aliado";
    const comun = B["en-comun"] !== false;
    cambiar(() => {
      avisos = [];
      // Numeración: sigue la que ya haya en la mesa ("Necrófago 3", "Necrófago 4"…).
      const re = new RegExp("^" + base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?: (\\d+))?$");
      let max = 0, hay = false;
      for (const c of Object.values(S.criaturas)) {
        const m = c.nombre.match(re);
        if (m) { hay = true; max = Math.max(max, entero(m[1], 1)!); }
      }
      const numerar = cuantos > 1 || hay;
      const grupo = comun && cuantos > 1 ? uid() : null;
      let iniGrupo: number | null = null;
      for (let k = 0; k < cuantos; k++) {
        const pg = Math.max(1, tirar(pgTx)!.total);
        const id = uid();
        const c: Criatura = { id, pj: false, aliado, nombre: numerar ? `${base} ${max + k + 1}` : base, pgMax: pg, pg, temp: 0, noLetal: 0, ca, mod, notas, ini: null, grupo, espera: false };
        if (bloque) {
          Object.assign(c, {
            toque: bloque.toque, desprevenido: bloque.desprevenido, fort: bloque.fort, ref: bloque.ref, vol: bloque.vol,
            dmc: bloque.dmc, percepcion: bloque.percepcion, ataques: bloque.ataques, vd: bloque.vd,
            defensas: bloque.defensas, especiales: bloque.especiales, velocidad: bloque.velocidad,
          });
        }
        S.criaturas[id] = c;
        S.orden.push(id);
        if (S.activo) {
          if (grupo && iniGrupo != null) c.ini = iniGrupo;
          else {
            const t = d(20);
            c.ini = iniGrupo = t + mod;
            log(`Iniciativa de ${c.nombre}: ${t} ${signo(mod)} = ${c.ini}.`);
          }
          insertarPorIni(id);
        }
      }
      log(`Entran ${cuantos} × ${base}${/d/i.test(pgTx) ? ` (PG ${pgTx})` : ""}.`);
      if (B["en-guardar"]) {
        const p: Plantilla = { nombre: base, pg: pgTx, ca, mod, notas, aliado, bloque };
        const i = S.plantillas.findIndex((x) => x.nombre.toLowerCase() === base.toLowerCase());
        if (i >= 0) S.plantillas[i] = p; else S.plantillas.push(p);
        S.plantillas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      }
      bloque = null; // el siguiente "Añadir" ya no arrastra este bloque (queda en el bestiario si se guardó)
    });
  }
  function alternarPJ(id: string) {
    const c = C(id)!;
    if (S.orden.includes(id)) {
      cambiar(() => { quitarDeOrden(id); log(`${c.nombre} sale del combate.`); });
      return;
    }
    let ini: number | null = null;
    if (S.activo) {
      const r = prompt(`Iniciativa de ${c.nombre}:`, "");
      if (r === null) return render();
      ini = entero(r, null);
      if (ini == null) return render();
    }
    cambiar(() => {
      c.ini = ini;
      S.orden.push(id);
      if (S.activo) insertarPorIni(id);
      log(`${c.nombre} entra en el combate.`);
    });
  }
  function quitar(id: string) {
    const c = C(id)!;
    cambiar(() => {
      quitarDeOrden(id);
      if (c.pj) { log(`${c.nombre} sale del combate.`); return; }
      delete S.criaturas[id];
      S.efectos = S.efectos.filter((e) => e.objetivo !== id);
      sel.delete(id);
      log(`Se quita a ${c.nombre}.`);
    });
  }

  /* ----------------------------------------------------------- diálogo -- */
  function editar(id: string) {
    const c = C(id);
    if (!c) return;
    const deFicha = c.pj && c.conFicha;
    const campo = (nombre: string, etiqueta: string, v: unknown, bloqueado = false) =>
      `<label>${etiqueta}<input type="number" name="${nombre}" value="${esc(v ?? "")}"${bloqueado ? " disabled" : ""}></label>`;
    dlg.innerHTML = `<form method="dialog" class="pagina">
      <h2>${esc(c.nombre)}</h2>
      ${deFicha ? `<p class="ayuda" style="margin:0 0 10px">PG máx., CA e iniciativa salen de la ficha: cámbialos en el biombo. Aquí solo lo de este combate.</p>` : ""}
      <div class="campos">
        ${c.pj ? "" : `<label class="ancho4">Nombre<input type="text" name="nombre" value="${esc(c.nombre)}"></label>`}
        ${campo("pg", "PG actuales", c.pg)}${campo("pgMax", "PG máx.", c.pgMax, deFicha)}${campo("temp", "Temporales", c.temp || 0)}${campo("noLetal", "No letal", c.noLetal || 0)}
        ${campo("ca", "CA", c.ca, deFicha)}${campo("mod", "Mod. inic.", c.mod || 0, deFicha)}${campo("ini", "Iniciativa", c.ini)}
        ${c.pj ? campo("con", "Con (muere a −Con)", c.con, deFicha) : `<label>Bando<select name="aliado"><option value="">Enemigo</option><option value="1"${c.aliado ? " selected" : ""}>Aliado</option></select></label>`}
        <label class="ancho4">Notas<input type="text" name="notas" value="${esc(c.notas)}" placeholder="RD 5/plata, visión en la oscuridad…"></label>
      </div>
      <div class="fila-botones">
        <button type="button" class="boton" data-a="cerrar">Cancelar</button>
        <button value="ok" class="boton prim">Guardar</button>
      </div>
    </form>`;
    dlg.returnValue = "";
    dlg.showModal();
    dlg.onclose = () => {
      if (dlg.returnValue !== "ok" || !S.criaturas[id]) return;
      const f = new FormData(dlg.querySelector("form")!);
      const nuevo: Partial<Criatura> = {
        pg: entero(f.get("pg"), c.pg)!,
        temp: Math.max(0, entero(f.get("temp"), 0)!),
        noLetal: Math.max(0, entero(f.get("noLetal"), 0)!),
        ini: entero(f.get("ini"), null),
        notas: String(f.get("notas") ?? "").trim(),
      };
      if (!deFicha) {
        nuevo.pgMax = Math.max(1, entero(f.get("pgMax"), c.pgMax)!);
        nuevo.ca = entero(f.get("ca"), c.ca)!;
        nuevo.mod = entero(f.get("mod"), 0)!;
        if (c.pj) nuevo.con = entero(f.get("con"), null);
      }
      if (!c.pj) {
        nuevo.nombre = String(f.get("nombre") ?? "").trim() || c.nombre;
        nuevo.aliado = !!f.get("aliado");
      }
      cambiar(() => Object.assign(S.criaturas[id], nuevo));
    };
  }

  /* ------------------------------------------------------------ pintar -- */
  function render() {
    if (!vivo) return;
    // conservar el foco y el cursor entre repintados
    const a = raiz.activeElement as HTMLInputElement | null;
    const foco = a?.dataset?.foco;
    const cursor = a && typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd ?? a.selectionStart] as const : null;
    app.innerHTML = barra() + `<main class="rejilla"><section>${banner()}${lista()}</section>${panel()}</main>`;
    if (foco) {
      const el = raiz.querySelector<HTMLInputElement>(`[data-foco="${CSS.escape(foco)}"]`);
      if (el) {
        el.focus();
        if (cursor) try { el.setSelectionRange(cursor[0], cursor[1]); } catch { /* number no admite cursor */ }
      }
    }
  }

  function barra() {
    return `<header class="barra">
      <a href="#/master">← Biombo</a>
      <h1>⚔ Combate</h1>
      ${S.activo ? `<span class="ronda">Ronda ${S.ronda}</span>` : ""}
      <span class="hueco"></span>
      <button class="boton" data-a="deshacer" title="Ctrl+Z" ${historial.length ? "" : "disabled"}>↶ Deshacer</button>
      ${S.activo ? `<button class="boton" data-a="terminar">Terminar combate</button>` : ""}
      <details><summary class="boton">Copia ▾</summary><div>
        <button class="boton" data-a="exportar">Guardar copia (.json)</button>
        <button class="boton" data-a="importar">Cargar copia…</button>
        <button class="boton" data-a="borrarTodo">Empezar de cero</button>
      </div></details>
    </header>`;
  }

  function recordatorios(c: Criatura | undefined) {
    const out: { t: string; k: string }[] = [];
    if (!c) return out;
    const e = estadoPG(c);
    if (c.pj && e?.t === "Moribundo") out.push({ t: `<b>Moribundo:</b> prueba de Constitución CD 10 con ${c.pg} (sus PG negativos). Si falla, pierde 1 PG.`, k: "malo" });
    if (c.pj && e?.t === "Incapacitado") out.push({ t: `<b>Incapacitado:</b> solo una acción de movimiento o estándar; si hace algo cansado, pierde 1 PG.`, k: "malo" });
    for (const ef of efectosDe(c.id)) {
      const r = ef.rondas != null ? ` <span class="tenue">(${ef.rondas} r)</span>` : "";
      if (ef.nombre === "Confuso") out.push({ t: `<b>Confuso${r}:</b> ${esc(ef.nota)} <button class="boton peq" data-a="dporc">Tirar d%</button>`, k: "malo" });
      else if (ef.nombre === "Sangrando") out.push({ t: `<b>Sangrando${r}:</b> pierde PG ahora, antes de actuar.`, k: "malo" });
      else out.push({ t: `<b>${esc(ef.nombre)}${r}:</b> ${esc(ef.nota) || '<span class="tenue">sin nota</span>'}`, k: ef.tipo === "buff" ? "fin" : ef.tipo === "debuff" ? "malo" : "" });
    }
    const suyos = S.efectos.filter((x) => x.dueno === c.id && x.objetivo !== c.id);
    if (suyos.length) {
      out.push({ t: `<b>Lanzados por ${esc(c.nombre)}:</b> ${suyos.map((x) => `${esc(x.nombre)} en ${esc(C(x.objetivo)?.nombre)}${x.rondas != null ? ` (${x.rondas} r)` : ""}`).join(" · ")}`, k: "" });
    }
    return out;
  }

  function banner() {
    const av = avisos.map((a) => `<div class="recordatorio ${a.k}">${a.html ? a.t : esc(a.t)}</div>`).join("");
    if (!S.activo) {
      const hay = S.orden.length > 0;
      return `<div class="pagina banner">
        <div class="cab"><h2>Preparar el combate</h2>
          <button class="boton" data-a="tirarIni" ${hay ? "" : "disabled"}>🎲 Tirar iniciativa de enemigos</button>
          <button class="boton prim grande" data-a="empezar" ${hay ? "" : "disabled"}>Empezar combate</button></div>
        ${C(atacante) ? panelAtaques(C(atacante)!) : ""}
        <ol class="pasos tenue">
          <li>Los PJ salen de sus fichas. En <b>Grupo</b>, marca quién está en este combate.</li>
          <li>En <b>Enemigos</b>, añade las criaturas (los PG pueden ser dados: 2d8+4).</li>
          <li>Apunta en su casilla la iniciativa que saque cada jugador. La de los enemigos se tira sola.</li>
          <li><b>Empezar combate</b> ordena la lista. Después, <kbd>Espacio</kbd> pasa el turno.</li>
        </ol>
        ${av ? `<div class="recordatorios">${av}</div>` : ""}
      </div>`;
    }
    const c = C(S.turno);
    const rec = recordatorios(c).map((r) => `<div class="recordatorio ${r.k}">${r.t}</div>`).join("");
    const quien = C(atacante) ?? c;
    return `<div class="pagina banner">
      <div class="cab">
        <span class="etiqueta">Ronda ${S.ronda}</span>
        <h2>${c ? "Turno de " + esc(c.nombre) : "Nadie puede actuar"}</h2>
        <button class="boton prim grande" data-a="siguiente" title="Espacio">Siguiente turno ▸</button>
      </div>
      ${quien ? panelAtaques(quien) : ""}
      ${av || rec ? `<div class="recordatorios">${av}${rec}</div>` : ""}
    </div>`;
  }

  function stats(c: Criatura) {
    const p: string[] = [];
    if (c.vd) p.push(`VD ${c.vd}`);
    if (c.toque != null) p.push(`Toque ${c.toque}`);
    if (c.desprevenido != null) p.push(`Desprev. ${c.desprevenido}`);
    if (c.dmc != null) p.push(`DMC ${c.dmc}`);
    if (c.fort != null || c.ref != null || c.vol != null) p.push(`Fort ${signo(c.fort)} · Ref ${signo(c.ref)} · Vol ${signo(c.vol)}`);
    if (c.percepcion != null) p.push(`Percepción ${signo(c.percepcion)}`);
    if (c.pj && !c.conFicha) p.push("sin ficha: números a mano");
    return p.join(" · ");
  }
  /** "mordisco +3 (1d6+1), 2 garras +3 (1d3+1)" agrupado por opción. */
  function resumenAtaques(c: Criatura) {
    const grupos = new Map<string, string[]>();
    for (const a of c.ataques ?? []) {
      const k = `${a.modo}-${a.opcion}`;
      const crit = a.critMin < 20 || a.critMult > 2 ? `/${a.critMin < 20 ? `${a.critMin}–20` : ""}${a.critMult > 2 ? `×${a.critMult}` : ""}` : "";
      const txt = `${a.n > 1 ? a.n + " " : ""}${a.nombre} ${a.bonos.map(signo).join("/")}${a.toque ? " toque" : ""} (${a.dano || "—"}${crit}${a.extra ? " " + a.extra : ""})`;
      grupos.set(k, [...(grupos.get(k) ?? []), txt]);
    }
    return [...grupos.entries()].map(([k, v]) => `${k.startsWith("cc") ? "C/c" : "Dist."}: ${v.join(", ")}`);
  }
  /** Botones de ataque de una criatura (en el banner). */
  function panelAtaques(c: Criatura) {
    const at = c.ataques ?? [];
    if (!at.length) return "";
    const ids = [...sel].filter((x) => x !== c.id && S.criaturas[x]);
    const obj = ids.length === 1 ? C(ids[0])! : null;
    const opciones = new Map<string, number[]>();
    at.forEach((a, i) => { const k = `${a.modo}-${a.opcion}`; opciones.set(k, [...(opciones.get(k) ?? []), i]); });
    const botones = [...opciones.entries()].map(([k, idx]) => {
      const completo = idx.length > 1 || at[idx[0]].n > 1 || at[idx[0]].bonos.length > 1;
      const sueltos = idx.map((i) => `<button class="boton peq" data-a="atacar" data-id="${c.id}" data-i="${i}" title="Un solo ataque">${esc(at[i].nombre)} ${signo(at[i].bonos[0])}</button>`).join("");
      return `<div class="fila-ataques"><span class="etiqueta">${k.startsWith("cc") ? "Cuerpo a cuerpo" : "A distancia"}${opciones.size > 2 || /-[1-9]/.test(k) ? ` · opción ${Number(k.split("-")[1]) + 1}` : ""}</span>
        ${completo ? `<button class="boton prim peq" data-a="atacar" data-id="${c.id}" data-i="${idx.join(",")}">Ataque completo</button>` : ""}${sueltos}</div>`;
    }).join("");
    return `<div class="ataques">
      <div class="cab-ataques"><b>Ataques de ${esc(c.nombre)}</b> <span class="tenue">${obj ? `contra ${esc(obj.nombre)} (CA ${obj.ca}${obj.toque != null ? `, toque ${obj.toque}` : ""})` : "· elige el objetivo en la lista"}</span>
      ${atacante && atacante !== S.turno ? `<button class="icono" data-a="cerrarAtaques" title="Volver a los del turno">✕</button>` : ""}</div>
      ${botones}
      ${c.especiales ? `<div class="tenue">Especiales: ${esc(c.especiales)}</div>` : ""}
    </div>`;
  }

  function fila(id: string) {
    const c = C(id)!;
    const e = estadoPG(c);
    const pct = Math.max(0, Math.min(1, c.pg / c.pgMax));
    const colorBarra = pct > 0.5 ? "var(--musgo)" : pct > 0.25 ? "var(--oro)" : "var(--rubrica)";
    const color = c.pj ? c.color ?? COLOR_PJ : c.aliado ? "var(--musgo)" : "var(--rubrica)";
    const turno = S.activo && S.turno === id;
    const i = S.orden.indexOf(id);
    const chips = efectosDe(id).map((ef) => `<span class="chip ${ef.tipo}" title="${esc(ef.nota)}">
        <span class="n" data-a="rondasEf" data-id="${ef.id}">${esc(ef.nombre)}${ef.rondas != null ? ` <b>${ef.rondas}</b>` : ""}</span>
        <button data-a="quitarEf" data-id="${ef.id}" title="Quitar">×</button></span>`).join("");
    const clases = ["pagina", "fila", sel.has(id) && "sel", turno && "turno", e?.fuera && "fuera", c.espera && "espera"].filter(Boolean).join(" ");
    const st = stats(c);
    const extra = [...resumenAtaques(c), ...(c.defensas ?? []), c.velocidad ? `Vel. ${c.velocidad}` : ""].filter(Boolean).join(" · ");
    return `<article class="${clases}" style="--c:${color}" data-fila="${id}">
      <div class="ini">
        <input type="number" data-campo="ini" data-id="${id}" data-foco="ini-${id}" value="${c.ini ?? ""}" class="${c.ini == null ? "falta" : ""}" title="Iniciativa">
        <small>${signo(c.mod || 0)}</small>
      </div>
      <div class="quien">
        <div class="nombre">${esc(c.nombre)}
          ${c.pj ? `<span class="marca">${esc(c.jugador && c.jugador !== c.nombre ? c.jugador : "PJ")}</span>` : c.aliado ? `<span class="marca aliado">Aliado</span>` : ""}
          ${c.espera ? `<span class="marca espera">En espera</span>` : ""}
          ${e ? `<span class="estado-pg ${e.k}">${e.t}</span>` : ""}
        </div>
        ${st ? `<div class="stats">${esc(st)}</div>` : ""}
        ${extra ? `<div class="stats">${esc(extra)}</div>` : ""}
        ${c.notas ? `<div class="notas">${esc(c.notas)}</div>` : ""}
        ${chips ? `<div class="chips">${chips}</div>` : ""}
      </div>
      <div class="pg">
        <div class="num"><b>${c.pg}</b><span class="tenue">/ ${c.pgMax} PG</span>
          ${c.temp ? `<span class="tmp" title="PG temporales">+${c.temp} temp.</span>` : ""}
          ${c.noLetal ? `<span class="nl" title="Daño no letal">${c.noLetal} no letal</span>` : ""}</div>
        <div class="barrapg"><i style="width:${pct * 100}%;background:${colorBarra}"></i></div>
        <input type="text" data-pgrapido="${id}" data-foco="pg-${id}" placeholder="daño ⏎ · +cura ⏎" title="Escribe el daño y pulsa Intro. Con + delante (o Mayús+Intro) cura. Admite dados: 2d6+3">
      </div>
      <div class="ca"><b>${c.ca}</b><small>CA</small></div>
      <div class="acciones">
        <button class="icono" data-a="subir" data-id="${id}" title="Subir" ${i <= 0 ? "disabled" : ""}>↑</button>
        <button class="icono" data-a="bajar" data-id="${id}" title="Bajar" ${i >= S.orden.length - 1 ? "disabled" : ""}>↓</button>
        <button class="icono" data-a="editar" data-id="${id}" title="Editar">✎</button>
        <button class="icono" data-a="quitar" data-id="${id}" title="${c.pj ? "Sacar del combate" : "Quitar"}">✕</button>
        ${c.ataques?.length ? `<button class="boton peq" data-a="verAtaques" data-id="${id}" title="Ver sus ataques arriba (p. ej. para un ataque de oportunidad)">⚔ Atacar</button>` : ""}
        ${turno ? `<button class="boton peq" data-a="retrasar" data-id="${id}" title="Retrasar el turno">Retrasar</button>` : ""}
        ${S.activo && c.espera ? `<button class="boton peq prim" data-a="actuar" data-id="${id}">Actuar ya</button>` : ""}
      </div>
    </article>`;
  }

  function lista() {
    return `<div class="cab-lista">
        <h3>Iniciativa</h3>
        ${sel.size ? `<button class="boton peq" data-a="deseleccionar">Quitar selección (${sel.size})</button>` : ""}
        <button class="boton peq" data-a="selEnemigos">Elegir enemigos</button>
        <button class="boton peq" data-a="ordenar" title="Ordena por iniciativa">Ordenar</button>
      </div>
      <div class="lista">${S.orden.length ? S.orden.map(fila).join("") : `<div class="pagina vacio tenue">${leyendo ? "Leyendo las fichas…" : "No hay nadie en la mesa. Marca a los PJ en <b>Grupo</b> y añade criaturas en <b>Enemigos</b>."}</div>`}</div>`;
  }

  function panel() {
    const tabs: [string, string][] = [["acciones", "Acciones"], ["enemigos", "Enemigos"], ["grupo", "Grupo"], ["registro", "Registro"]];
    const cuerpo = ({ acciones: panelAcciones, enemigos: panelEnemigos, grupo: panelGrupo, registro: panelRegistro } as Record<string, () => string>)[pestana]();
    return `<aside class="pagina panel">
      <nav class="pestanas">${tabs.map(([k, t]) => `<button data-a="pestana" data-p="${k}" class="${pestana === k ? "si" : ""}">${t}</button>`).join("")}</nav>
      <div class="cuerpo-panel">${cuerpo}</div>
    </aside>`;
  }

  function panelAcciones() {
    const ids = [...sel].filter((id) => S.criaturas[id]);
    const nombres = ids.map((id) => esc(C(id)!.nombre)).join(", ");
    const duenoDef = B["ef-dueno"] !== undefined ? String(B["ef-dueno"]) : S.activo ? S.turno ?? "" : "";
    const opcion = (k: string, t: string, actual: string) => `<option value="${k}"${actual === k ? " selected" : ""}>${t}</option>`;
    return `<div class="seleccion">${ids.length ? `Sobre: <b>${nombres}</b>` : `<span class="tenue">Haz clic en alguien de la lista para elegirlo (Ctrl+clic para varios).</span>`}</div>

    <div class="seccion"><span class="etiqueta">Daño y curación</span>
      <div class="cantidad"><input type="text" data-b="pg-cant" data-foco="pg-cant" value="${val("pg-cant")}" placeholder="12 o 3d6+2"></div>
      <div class="campos" style="margin-top:6px">
        <label class="ancho2">Salvación<select data-b="sv-tipo">${opcion("", "— ninguna —", String(B["sv-tipo"] || ""))}${(["fort", "ref", "vol"] as Salvacion[]).map((k) => opcion(k, `${NOMBRE_SALV[k]} (mitad)`, String(B["sv-tipo"] || ""))).join("")}</select></label>
        <label>CD<input type="number" data-b="sv-cd" data-foco="sv-cd" value="${val("sv-cd")}" placeholder="15"></label>
        <label>&nbsp;<button class="boton" data-a="pg" data-m="salv" title="Solo tira la salvación, sin daño">Tirar</button></label>
      </div>
      <div class="fila-botones">
        <button class="boton prim" data-a="pg" data-m="dano">${B["sv-tipo"] ? "Daño con salvación" : "Daño"}</button>
        <button class="boton" data-a="pg" data-m="mitad" title="Para quien supera la salvación">½ daño</button>
        <button class="boton" data-a="pg" data-m="curar">Curar</button>
        <button class="boton" data-a="pg" data-m="nl">No letal</button>
        <button class="boton" data-a="pg" data-m="temp">Temporales</button>
      </div>
      <p class="ayuda">Si son dados, se tira una vez y vale para todos (como una bola de fuego). Con salvación, cada enemigo tira la suya y recibe todo o la mitad; a los PJ solo se les avisa, porque tiran sus jugadores. Primero se gastan los PG temporales.</p>
    </div>

    <div class="seccion"><span class="etiqueta">Estados</span>
      <div class="campos" style="margin-bottom:6px"><label class="ancho2">Rondas (vacío = hasta que lo quites)<input type="number" min="1" data-b="est-r" data-foco="est-r" value="${val("est-r")}"></label></div>
      <div class="estados">${ESTADOS.map(([n, desc]) => {
        const si = ids.length > 0 && ids.every((id) => tieneEstado(id, n));
        return `<button data-a="estado" data-n="${esc(n)}" title="${esc(desc)}" class="${si ? "si" : ""}">${esc(n)}</button>`;
      }).join("")}</div>
    </div>

    <div class="seccion"><span class="etiqueta">Conjuro o efecto con duración</span>
      <div class="campos">
        <label class="ancho3">Nombre<input type="text" list="presets" data-b="ef-nombre" data-foco="ef-nombre" value="${val("ef-nombre")}" placeholder="Bendecir, Prisa…"></label>
        <label>Tipo<select data-b="ef-tipo">${opcion("buff", "Bueno", String(B["ef-tipo"] || "buff"))}${opcion("debuff", "Malo", String(B["ef-tipo"] || "buff"))}</select></label>
        <label>Dura<input type="number" min="1" data-b="ef-r" data-foco="ef-r" value="${val("ef-r")}" placeholder="∞"></label>
        <label>En<select data-b="ef-u">${[["r", "rondas"], ["min", "minutos"], ["h", "horas"]].map(([k, t]) => opcion(k, t, String(B["ef-u"] || "r"))).join("")}</select></label>
        <label class="ancho2">Cuenta al empezar el turno de<select data-b="ef-dueno">
          ${opcion("", "— cada ronda —", duenoDef)}
          ${S.orden.map((id) => opcion(id, esc(C(id)!.nombre), duenoDef)).join("")}</select></label>
        <label class="ancho4">Nota<input type="text" data-b="ef-nota" data-foco="ef-nota" value="${val("ef-nota")}" placeholder="+1 a ataque…"></label>
      </div>
      <div class="fila-botones"><button class="boton prim" data-a="efecto">Añadir efecto</button></div>
      <p class="ayuda">Un efecto de 3 rondas lanzado en el turno de alguien se acaba justo antes de su tercer turno tras lanzarlo. Clic en el nombre de una etiqueta para cambiar las rondas que le quedan.</p>
      <datalist id="presets">${PRESETS.map(([n]) => `<option value="${esc(n)}">`).join("")}</datalist>
    </div>`;
  }

  function panelEnemigos() {
    const b = bloque;
    const vista = b ? `<div class="leido">
        <div><b>${esc(b.nombre)}</b>${b.vd ? ` · VD ${esc(b.vd)}` : ""}${b.tipo ? ` <span class="tenue">· ${esc(b.tipo)}</span>` : ""}
          <button class="icono" data-a="olvidarBloque" title="Descartar el bloque" style="float:right">✕</button></div>
        <div class="tenue">PG ${b.pg ?? "—"}${b.dadosPG ? ` (${esc(b.dadosPG)})` : ""} · CA ${b.ca ?? "—"}${b.toque != null ? `, toque ${b.toque}, desprev. ${b.desprevenido}` : ""} · inic. ${signo(b.ini)} · Fort ${signo(b.fort)} Ref ${signo(b.ref)} Vol ${signo(b.vol)}${b.dmc != null ? ` · DMC ${b.dmc}` : ""}${b.percepcion != null ? ` · Percepción ${signo(b.percepcion)}` : ""}</div>
        <div class="tenue">${b.ataques.length ? `${b.ataques.length} ataque${b.ataques.length > 1 ? "s" : ""} automáticos` : "Sin ataques reconocidos"}${b.defensas.length ? " · " + esc(b.defensas.join(" · ")) : ""}</div>
        ${b.dadosPG ? `<div class="tenue">PG: la media (${b.pg}). Para tirarlos a cada uno, pon ${esc(b.dadosPG)} en PG.</div>` : ""}
      </div>` : "";
    return `<div class="seccion"><span class="etiqueta">Pegar bloque de estadísticas</span>
      <textarea data-b="en-bloque" data-foco="en-bloque" rows="${b ? 2 : 5}" placeholder="Copia el bloque entero de d20pfsrd.com (desde «Ghoul CR 1» hasta CMB/CMD) y pégalo aquí.">${val("en-bloque")}</textarea>
      <div class="fila-botones"><button class="boton" data-a="leerBloque">Leer bloque</button></div>
      ${vista}
    </div>
    <div class="seccion"><span class="etiqueta">Añadir criaturas</span>
      <div class="campos">
        <label class="ancho3">Nombre<input type="text" data-b="en-nombre" data-foco="en-nombre" value="${val("en-nombre")}" placeholder="Necrófago"></label>
        <label>Cuántos<input type="number" min="1" max="30" data-b="en-n" data-foco="en-n" value="${val("en-n", "1")}"></label>
        <label class="ancho2">PG (número o dados)<input type="text" data-b="en-pg" data-foco="en-pg" value="${val("en-pg")}" placeholder="2d8+4"></label>
        <label>CA<input type="number" data-b="en-ca" data-foco="en-ca" value="${val("en-ca")}" placeholder="10"></label>
        <label>Mod. inic.<input type="number" data-b="en-mod" data-foco="en-mod" value="${val("en-mod")}" placeholder="0"></label>
        <label class="ancho4">Notas<input type="text" data-b="en-notas" data-foco="en-notas" value="${val("en-notas")}" placeholder="Percepción +7, el mordisco paraliza…"></label>
        <label class="ancho2">Bando<select data-b="en-tipo"><option value="enemigo">Enemigo</option><option value="aliado"${B["en-tipo"] === "aliado" ? " selected" : ""}>Aliado</option></select></label>
      </div>
      <label class="casilla"><input type="checkbox" data-b="en-comun" ${B["en-comun"] === false ? "" : "checked"}> Misma iniciativa para todo el grupo</label>
      <label class="casilla"><input type="checkbox" data-b="en-guardar" ${B["en-guardar"] ? "checked" : ""}> Guardarla en mi bestiario</label>
      <div class="fila-botones"><button class="boton prim" data-a="anadirEnemigos">Añadir a la mesa</button></div>
      <p class="ayuda">Con el combate empezado, tiran iniciativa al entrar y se colocan en su sitio.</p>
    </div>
    <div class="seccion"><span class="etiqueta">Mi bestiario</span>
      ${S.plantillas.length ? `<div class="lineas">${S.plantillas.map((p, i) => `<div class="linea">
        <span class="t"><b>${esc(p.nombre)}</b> <small>· PG ${esc(p.pg)} · CA ${p.ca} · inic. ${signo(p.mod)}${p.aliado ? " · aliado" : ""}</small></span>
        <button class="boton peq" data-a="plantilla" data-i="${i}">Usar</button>
        <button class="icono" data-a="borrarPlantilla" data-i="${i}" title="Borrar del bestiario">✕</button></div>`).join("")}</div>`
        : `<p class="ayuda">Marca «Guardarla en mi bestiario» al añadir una criatura y aparecerá aquí la próxima vez.</p>`}
    </div>`;
  }

  function panelGrupo() {
    const pjs = Object.values(S.criaturas).filter((c) => c.pj).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const cuando = S.leidas ? new Date(S.leidas).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "nunca";
    return `<div class="seccion"><span class="etiqueta">Personajes (de las fichas)</span>
      ${pjs.length ? `<div class="lineas">${pjs.map((c) => `<label class="linea">
          <input type="checkbox" data-a="alternarPJ" data-id="${c.id}" ${S.orden.includes(c.id) ? "checked" : ""} title="En este combate">
          <span class="punto" style="background:${c.color ?? COLOR_PJ}"></span>
          <span class="t"><b>${esc(c.nombre)}</b> <small>· ${esc(c.jugador ?? "")} · ${c.pg}/${c.pgMax} PG · CA ${c.ca} · inic. ${signo(c.mod || 0)}${c.conFicha ? "" : " · sin ficha"}</small></span>
        </label>`).join("")}</div>` : `<p class="ayuda">${leyendo ? "Leyendo las fichas…" : "No hay jugadores activos."}</p>`}
      <div class="fila-botones">
        <button class="boton" data-a="leerFichas" ${leyendo ? "disabled" : ""}>${leyendo ? "Leyendo…" : "↻ Volver a leer las fichas"}</button>
        <button class="boton" data-a="apuntarPG" title="Escribe los PG actuales de la mesa en cada ficha">Apuntar PG en las fichas</button>
        <button class="boton" data-a="curarGrupo" title="Tras un descanso largo">Curar a todos</button>
      </div>
      <p class="ayuda">Última lectura: ${esc(cuando)}. PG máx., CA, iniciativa, Con, salvaciones, DMC y Percepción salen siempre de la ficha. Los PG actuales también, salvo en mitad de un combate, que los lleva la mesa. Las fichas solo cambian cuando pulsas «Apuntar PG en las fichas» (también te lo ofrece al terminar el combate).</p>
    </div>`;
  }

  function panelRegistro() {
    if (!S.registro.length) return `<p class="ayuda">Aquí se apunta todo lo que pasa.</p>`;
    return `<div class="registro">${S.registro.slice(0, 250).map((l) => (l.sep
      ? `<div class="sep">${esc(l.texto)}</div>`
      : `<div>${l.r ? `<span class="r">R${l.r}</span>` : ""}${esc(l.texto)}</div>`)).join("")}</div>
      <div class="fila-botones"><button class="boton peq" data-a="borrarRegistro">Vaciar registro</button></div>`;
  }

  /* ----------------------------------------------------------- eventos -- */
  type Boton = HTMLElement & { dataset: DOMStringMap };
  const id = (b: Boton) => b.dataset.id ?? "";
  const ACC: Record<string, (b: Boton) => void> = {
    siguiente: () => siguiente(),
    empezar: () => empezar(),
    tirarIni: () => cambiar(tirarIniciativas),
    ordenar: () => cambiar(ordenar),
    terminar: () => {
      if (!confirm("¿Terminar el combate? Se quitan los enemigos; los PJ se quedan con sus PG.")) return;
      const conFicha = S.orden.some((x) => C(x)?.pj && C(x)?.conFicha);
      cambiar(terminar);
      if (conFicha && confirm("¿Apunto en las fichas los PG con que acaban los PJ?")) void apuntarPGs();
    },
    deshacer: () => deshacer(),
    pestana: (b) => { pestana = b.dataset.p ?? "acciones"; render(); },
    subir: (b) => cambiar(() => mover(id(b), -1)),
    bajar: (b) => cambiar(() => mover(id(b), 1)),
    editar: (b) => editar(id(b)),
    quitar: (b) => quitar(id(b)),
    retrasar: (b) => cambiar(() => { avisos = []; retrasar(id(b)); }),
    actuar: (b) => cambiar(() => actuarYa(id(b))),
    pg: (b) => aplicarPG(b.dataset.m ?? "dano"),
    estado: (b) => alternarEstado(b.dataset.n ?? ""),
    efecto: () => anadirEfecto(),
    quitarEf: (b) => cambiar(() => {
      const e = S.efectos.find((x) => x.id === id(b));
      S.efectos = S.efectos.filter((x) => x.id !== id(b));
      if (e) log(`Se quita ${e.nombre} de ${C(e.objetivo)?.nombre ?? "?"}.`);
    }),
    rondasEf: (b) => {
      const e = S.efectos.find((x) => x.id === id(b));
      if (!e) return;
      const r = prompt(`${e.nombre}: rondas que le quedan (vacío = sin límite)`, e.rondas == null ? "" : String(e.rondas));
      if (r === null) return;
      cambiar(() => {
        const x = S.efectos.find((y) => y.id === e.id);
        const v = entero(r, null);
        if (x) x.rondas = v != null && v > 0 ? v : null;
      });
    },
    dporc: () => {
      const t = d(100);
      avisos.push({ t: `d% = <b>${t}</b> → ${t <= 25 ? "actúa con normalidad" : t <= 50 ? "solo balbucea" : t <= 75 ? "se hace daño con lo que lleve" : "ataca a lo más cercano"}`, k: "", html: true });
      render();
    },
    deseleccionar: () => { sel.clear(); render(); },
    selEnemigos: () => {
      sel = new Set(S.orden.filter((x) => { const c = C(x)!; return !c.pj && !c.aliado && !estadoPG(c)?.fuera; }));
      render();
    },
    anadirEnemigos: () => anadirEnemigos(),
    leerBloque: () => {
      const b = leerBloque(texto("en-bloque"));
      if (!b) return aviso("No reconozco ese bloque. Copia desde el nombre (con su CR) hasta la defensa y el ataque.");
      bloque = b;
      Object.assign(B, {
        "en-nombre": b.nombre, "en-pg": String(b.pg ?? b.dadosPG ?? ""), "en-ca": b.ca != null ? String(b.ca) : "",
        "en-mod": b.ini != null ? String(b.ini) : "", "en-n": "1", "en-bloque": "", "en-guardar": true,
        "en-notas": "", // percepción, defensas y ataques ya salen en la fila
      });
      avisos = [];
      render();
      raiz.querySelector<HTMLInputElement>('[data-foco="en-n"]')?.select();
    },
    olvidarBloque: () => { bloque = null; render(); },
    atacar: (b) => atacar(id(b), (b.dataset.i ?? "").split(",").map(Number)),
    verAtaques: (b) => { atacante = id(b); render(); },
    cerrarAtaques: () => { atacante = null; render(); },
    aplicarAtaque: (b) => {
      const c = C(id(b));
      const x = Number(b.dataset.n);
      if (!c || !x) return;
      cambiar(() => { avisos = []; danar(c, x); });
    },
    plantilla: (b) => {
      const p = S.plantillas[Number(b.dataset.i)];
      if (!p) return;
      bloque = p.bloque ?? null;
      Object.assign(B, { "en-nombre": p.nombre, "en-pg": p.pg, "en-ca": String(p.ca), "en-mod": String(p.mod), "en-notas": p.notas, "en-tipo": p.aliado ? "aliado" : "enemigo", "en-n": "1", "en-guardar": false });
      render();
      raiz.querySelector<HTMLInputElement>('[data-foco="en-n"]')?.select();
    },
    borrarPlantilla: (b) => {
      const i = Number(b.dataset.i);
      const p = S.plantillas[i];
      if (p && confirm(`¿Borrar «${p.nombre}» del bestiario?`)) cambiar(() => { S.plantillas.splice(i, 1); });
    },
    alternarPJ: (b) => alternarPJ(id(b)),
    leerFichas: () => void leerFichas(true),
    apuntarPG: () => { if (confirm("¿Escribir en cada ficha los PG actuales que tiene la mesa?")) void apuntarPGs(); },
    curarGrupo: () => {
      if (!confirm("¿Dejar a todos los PJ con sus PG máximos? (En las fichas no cambia hasta que los apuntes.)")) return;
      cambiar(() => {
        for (const c of Object.values(S.criaturas)) if (c.pj) { c.pg = c.pgMax; c.noLetal = 0; c.temp = 0; }
        log("Todos los PJ se curan del todo.");
      });
    },
    borrarRegistro: () => { if (confirm("¿Vaciar el registro?")) cambiar(() => { S.registro = []; }); },
    exportar: () => {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `combate-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    importar: () => fichero.click(),
    borrarTodo: () => {
      if (!confirm("¿Empezar de cero? Se borran el combate, el bestiario y el registro (los PJ se vuelven a leer de las fichas). Se puede deshacer mientras no cierres la página.")) return;
      cambiar(() => { S = nueva(); sel.clear(); });
      void leerFichas(false);
    },
    cerrar: () => dlg.close("no"),
  };

  const alClic = (ev: Event) => {
    const t = ev.target as HTMLElement;
    const b = t.closest<Boton>("[data-a]");
    if (b) {
      if (b instanceof HTMLButtonElement && b.form && b.value === "ok") return; // lo maneja el diálogo
      ACC[b.dataset.a ?? ""]?.(b);
      const menu = b.closest("details");
      if (menu && b.tagName === "BUTTON") menu.open = false;
      return;
    }
    // Clic en una fila: elegirla (Ctrl/Mayús/Cmd para varias).
    const f = t.closest<HTMLElement>("[data-fila]");
    if (f && !t.closest("input,button,select,label,a,.chip")) {
      const fid = f.dataset.fila!;
      const m = ev as MouseEvent;
      if (m.ctrlKey || m.metaKey || m.shiftKey) { if (sel.has(fid)) sel.delete(fid); else sel.add(fid); }
      else if (sel.size === 1 && sel.has(fid)) sel.clear();
      else sel = new Set([fid]);
      render();
    }
  };
  // Borradores del panel: se guardan al escribir, sin repintar.
  const alEscribir = (ev: Event) => {
    const t = ev.target as HTMLInputElement;
    if (t.dataset?.b) B[t.dataset.b] = t.type === "checkbox" ? t.checked : t.value;
  };
  const alCambiar = (ev: Event) => {
    const t = ev.target as HTMLInputElement;
    if (t.dataset?.b) {
      B[t.dataset.b] = t.type === "checkbox" ? t.checked : t.value;
      if (t.dataset.b === "sv-tipo") render(); // cambia el texto del botón de daño
      if (t.dataset.b === "ef-nombre") { // efectos conocidos: tipo y nota
        const p = PRESETS.find(([n]) => n.toLowerCase() === t.value.trim().toLowerCase());
        if (p) { B["ef-tipo"] = p[1]; if (!B["ef-nota"]) B["ef-nota"] = p[2]; render(); }
      }
    }
    if (t.dataset?.campo === "ini") {
      const c = C(t.dataset.id);
      const v = entero(t.value, null);
      if (c && v !== c.ini) cambiar(() => { c.ini = v; log(`Iniciativa de ${c.nombre}: ${v ?? "—"}.`); });
    }
  };
  // Teclas dentro de la mesa (campos).
  const alTeclaDentro = (ev: Event) => {
    const k = ev as KeyboardEvent;
    const t = k.target as HTMLInputElement;
    if (k.key !== "Enter") return;
    if (t.dataset?.pgrapido) {
      k.preventDefault();
      const v = t.value;
      t.value = "";
      pgRapido(t.dataset.pgrapido, v, k.shiftKey);
    } else if (t.dataset?.campo === "ini") {
      t.blur();
    } else if (t.dataset?.b && t.tagName === "INPUT" && t.type !== "checkbox") {
      k.preventDefault();
      if (t.dataset.b === "pg-cant") aplicarPG("dano");
      else if (t.dataset.b.startsWith("en-")) anadirEnemigos();
      else if (t.dataset.b.startsWith("ef-")) anadirEfecto();
    }
  };
  // Atajos globales: Espacio/N pasa turno, Ctrl+Z deshace, Esc quita la selección.
  const alTecla = (ev: KeyboardEvent) => {
    const dentro = raiz.activeElement as HTMLElement | null;
    const fuera = document.activeElement as HTMLElement | null;
    const escribe = (el: HTMLElement | null) => !!el?.matches?.("input, textarea, select, [contenteditable]");
    if (dlg.open || escribe(dentro) || (fuera !== host && escribe(fuera))) return;
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") { ev.preventDefault(); deshacer(); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === " " || ev.key === "n" || ev.key === "N") { ev.preventDefault(); if (S.activo) siguiente(); return; }
    if (ev.key === "Escape" && sel.size) { sel.clear(); render(); }
  };
  const alFichero = async () => {
    const f = fichero.files?.[0];
    fichero.value = "";
    if (!f) return;
    try {
      const datos = JSON.parse(await f.text());
      if (!datos || typeof datos.criaturas !== "object" || !Array.isArray(datos.orden)) throw new Error("formato");
      cambiar(() => {
        S = { ...nueva(), ...datos };
        sel.clear();
        avisos = [{ t: `Cargada la copia «${f.name}».`, k: "fin" }];
      });
    } catch {
      alert("Ese fichero no es una copia de esta mesa de combate.");
    }
  };
  // Otra pestaña con la mesa abierta: coger sus cambios.
  const alAlmacen = (ev: StorageEvent) => {
    if (ev.key === CLAVE && ev.newValue) { S = { ...nueva(), ...JSON.parse(ev.newValue) }; render(); }
  };

  raiz.addEventListener("click", alClic);
  raiz.addEventListener("input", alEscribir);
  raiz.addEventListener("change", alCambiar);
  raiz.addEventListener("keydown", alTeclaDentro);
  document.addEventListener("keydown", alTecla);
  window.addEventListener("storage", alAlmacen);
  fichero.addEventListener("change", alFichero);

  render();
  void leerFichas(false);

  return () => {
    vivo = false;
    document.removeEventListener("keydown", alTecla);
    window.removeEventListener("storage", alAlmacen);
    raiz.removeEventListener("click", alClic);
    raiz.removeEventListener("input", alEscribir);
    raiz.removeEventListener("change", alCambiar);
    raiz.removeEventListener("keydown", alTeclaDentro);
    if (dlg.open) dlg.close();
    raiz.innerHTML = "";
  };
}
