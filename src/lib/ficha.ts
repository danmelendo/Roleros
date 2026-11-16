import type { FichaDatos } from "./api";

/* =============================================================================
   Esquema de la ficha. Lo usan las DOS vistas:
     · el formulario del máster (MasterJugador), y
     · la ficha del jugador (Ficha), que solo recibe lo revelado.
   La ficha se guarda como JSON en Supabase; este esquema solo dice cómo pintarla.
   Las claves que no estén aquí se conservan al guardar (no se pierde nada).

   Rutas revelables: 'raza', 'atributos', 'atributos.fue', 'dotes', 'dotes.dote-1'…
   Las claves van en minúsculas ascii: lo exige el CHECK de ficha_revelado.
   ============================================================================= */

export type Campo = { clave: string; etiqueta: string; tipo: "texto" | "numero"; signo?: boolean; corta?: string };

export type Seccion =
  | { tipo: "identidad"; titulo: string; campos: Campo[] }                        // claves de primer nivel
  | { tipo: "pg"; clave: "pg"; titulo: string }                                   // siempre visible
  | { tipo: "grupo"; clave: string; titulo: string; campos: Campo[]; mod?: boolean }
  | { tipo: "lista"; clave: string; titulo: string; singular: string; conTotal?: boolean }
  | { tipo: "habilidades"; clave: "habilidades"; titulo: string }
  | { tipo: "texto"; clave: string; titulo: string };

/** Elemento de lista. origen = lo puso el asistente ("raza" o "clase"); orden = posición al pintarlo. */
export type Item = { nombre?: string; texto?: string; total?: number; origen?: string; orden?: number; nivel?: number };

export const IDENTIDAD: Campo[] = [
  { clave: "raza", etiqueta: "Raza", tipo: "texto" },
  { clave: "clase", etiqueta: "Clase", tipo: "texto" },
  { clave: "nivel", etiqueta: "Nivel", tipo: "numero" },
  { clave: "alineamiento", etiqueta: "Alineamiento", tipo: "texto" },
  { clave: "deidad", etiqueta: "Deidad", tipo: "texto" },
];

export const ESQUEMA: Seccion[] = [
  { tipo: "identidad", titulo: "Quién eres", campos: IDENTIDAD },
  { tipo: "pg", clave: "pg", titulo: "Puntos de golpe" },
  {
    tipo: "grupo", clave: "atributos", titulo: "Atributos", mod: true,
    campos: [
      { clave: "fue", etiqueta: "Fuerza", corta: "FUE", tipo: "numero" },
      { clave: "des", etiqueta: "Destreza", corta: "DES", tipo: "numero" },
      { clave: "con", etiqueta: "Constitución", corta: "CON", tipo: "numero" },
      { clave: "int", etiqueta: "Inteligencia", corta: "INT", tipo: "numero" },
      { clave: "sab", etiqueta: "Sabiduría", corta: "SAB", tipo: "numero" },
      { clave: "car", etiqueta: "Carisma", corta: "CAR", tipo: "numero" },
    ],
  },
  {
    tipo: "grupo", clave: "combate", titulo: "Combate",
    campos: [
      { clave: "ca", etiqueta: "Clase de armadura", corta: "CA", tipo: "numero" },
      { clave: "toque", etiqueta: "CA de toque", corta: "Toque", tipo: "numero" },
      { clave: "desprevenido", etiqueta: "CA desprevenido", corta: "Desprev.", tipo: "numero" },
      { clave: "ini", etiqueta: "Iniciativa", corta: "Inic.", tipo: "numero", signo: true },
      { clave: "bab", etiqueta: "Ataque base", corta: "At. base", tipo: "numero", signo: true },
      { clave: "bmc", etiqueta: "Bonif. de maniobra (BMC)", corta: "BMC", tipo: "numero", signo: true },
      { clave: "dmc", etiqueta: "Defensa contra maniobras (DMC)", corta: "DMC", tipo: "numero" },
      { clave: "velocidad", etiqueta: "Velocidad", corta: "Veloc.", tipo: "texto" },
    ],
  },
  {
    tipo: "grupo", clave: "salvaciones", titulo: "Salvaciones",
    campos: [
      { clave: "fort", etiqueta: "Fortaleza", corta: "Fort.", tipo: "numero", signo: true },
      { clave: "ref", etiqueta: "Reflejos", corta: "Ref.", tipo: "numero", signo: true },
      { clave: "vol", etiqueta: "Voluntad", corta: "Vol.", tipo: "numero", signo: true },
    ],
  },
  { tipo: "habilidades", clave: "habilidades", titulo: "Habilidades" },
  { tipo: "lista", clave: "raciales", titulo: "Rasgos raciales", singular: "rasgo racial" },
  { tipo: "lista", clave: "rasgos", titulo: "Rasgos de clase", singular: "rasgo" },
  { tipo: "lista", clave: "dotes", titulo: "Dotes", singular: "dote" },
  { tipo: "lista", clave: "conjuros", titulo: "Magia", singular: "conjuro" },
  // Los objetos NO van aquí: viven en el petate (tabla inventario), con su oro.
  { tipo: "texto", clave: "trasfondo", titulo: "Trasfondo" },
];

export const PLANTILLA: FichaDatos = {
  nombre: "",
  raza: "",
  clase: "",
  nivel: 1,
  alineamiento: "",
  deidad: "",
  pg: { max: 10, actual: 10 },
  atributos: { fue: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  combate: { ca: 10, toque: 10, desprevenido: 10, ini: 0, bab: 0, bmc: 0, dmc: 10, velocidad: "30 pies" },
  salvaciones: { fort: 0, ref: 0, vol: 0 },
  habilidades: {},
  raciales: {},
  rasgos: {},
  dotes: {},
  conjuros: {},
  trasfondo: "",
};

/* ------------------------------------------------------------ habilidades -- */

export type Atributo = "fue" | "des" | "con" | "int" | "sab" | "car";

/** Una habilidad de PF1e. entrenada = solo se puede usar con rangos; armadura = le
    afecta el penalizador de armadura; abierta = lleva especialidad (Artesanía…). */
export type DefHabilidad = { clave: string; nombre: string; at: Atributo; entrenada?: boolean; armadura?: boolean; abierta?: boolean };

const conocimiento = (clave: string, que: string): DefHabilidad => ({ clave: `conocimiento-${clave}`, nombre: `Conocimiento (${que})`, at: "int", entrenada: true });

export const HABILIDADES: DefHabilidad[] = [
  { clave: "acrobacias", nombre: "Acrobacias", at: "des", armadura: true },
  { clave: "artesania", nombre: "Artesanía", at: "int", abierta: true },
  { clave: "averiguar-intenciones", nombre: "Averiguar intenciones", at: "sab" },
  conocimiento("arcano", "arcano"),
  conocimiento("dungeons", "dungeons"),
  conocimiento("geografia", "geografía"),
  conocimiento("historia", "historia"),
  conocimiento("ingenieria", "ingeniería"),
  conocimiento("local", "local"),
  conocimiento("naturaleza", "naturaleza"),
  conocimiento("nobleza", "nobleza"),
  conocimiento("planos", "los planos"),
  conocimiento("religion", "religión"),
  { clave: "conocimiento-conjuros", nombre: "Conocimiento de conjuros", at: "int", entrenada: true },
  { clave: "diplomacia", nombre: "Diplomacia", at: "car" },
  { clave: "disfrazarse", nombre: "Disfrazarse", at: "car" },
  { clave: "enganar", nombre: "Engañar", at: "car" },
  { clave: "escapismo", nombre: "Escapismo", at: "des", armadura: true },
  { clave: "interpretar", nombre: "Interpretar", at: "car", abierta: true },
  { clave: "intimidar", nombre: "Intimidar", at: "car" },
  { clave: "inutilizar-mecanismo", nombre: "Inutilizar mecanismo", at: "des", entrenada: true, armadura: true },
  { clave: "juego-de-manos", nombre: "Juego de manos", at: "des", entrenada: true, armadura: true },
  { clave: "linguistica", nombre: "Lingüística", at: "int", entrenada: true },
  { clave: "montar", nombre: "Montar", at: "des", armadura: true },
  { clave: "nadar", nombre: "Nadar", at: "fue", armadura: true },
  { clave: "percepcion", nombre: "Percepción", at: "sab" },
  { clave: "profesion", nombre: "Profesión", at: "sab", entrenada: true, abierta: true },
  { clave: "sanar", nombre: "Sanar", at: "sab" },
  { clave: "sigilo", nombre: "Sigilo", at: "des", armadura: true },
  { clave: "supervivencia", nombre: "Supervivencia", at: "sab" },
  { clave: "tasacion", nombre: "Tasación", at: "int" },
  { clave: "trato-animales", nombre: "Trato con animales", at: "car", entrenada: true },
  { clave: "trepar", nombre: "Trepar", at: "fue", armadura: true },
  { clave: "usar-objeto-magico", nombre: "Usar objeto mágico", at: "car", entrenada: true },
  { clave: "volar", nombre: "Volar", at: "des", armadura: true },
];

export const CORTO: Record<Atributo, string> = { fue: "FUE", des: "DES", con: "CON", int: "INT", sab: "SAB", car: "CAR" };

/** Lo que se guarda de cada habilidad. total lo calcula conTotales(); null = sin rangos y solo entrenada. */
/** raza / rasgo: bonificadores que pone el asistente (racial, o de un rasgo de clase como el conocimiento de bardo). */
export type DatosHabilidad = { rangos?: number; clase?: boolean; otros?: number; raza?: number; rasgo?: number; detalle?: string; base?: string; total?: number | null };

/** Penalizador de armadura (clave de primer nivel; no está en ESQUEMA, así que el jugador no lo ve). */
export const PENALIZADOR = "penalizador_armadura";

/** Definición de una entrada: por su clave o, si es una copia (artesania-2), por su base. */
export function defHabilidad(clave: string, h: DatosHabilidad | undefined): DefHabilidad | undefined {
  return HABILIDADES.find((d) => d.clave === clave) ?? HABILIDADES.find((d) => d.abierta && d.clave === h?.base);
}

/** Copias de las habilidades abiertas (una segunda Artesanía, otra Profesión…), en el orden en que se añadieron. */
export function copiasDe(base: string, habilidades: Record<string, unknown>): string[] {
  return Object.keys(habilidades).filter((k) => k !== base && esObjeto(habilidades[k]) && (habilidades[k] as DatosHabilidad).base === base).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

/** Rellena el total de cada habilidad: rangos + atributo + 3 si es de clase y tiene rangos + otros
    + penalizador de armadura si le afecta. Se guarda en la ficha para que el jugador vea el total
    aunque no tenga revelados los atributos. Todas las habilidades del catálogo quedan con su entrada. */
export function conTotales(d: FichaDatos): FichaDatos {
  const at = esObjeto(d.atributos) ? d.atributos : {};
  const pen = typeof d[PENALIZADOR] === "number" ? -Math.abs(d[PENALIZADOR] as number) : 0;
  const origen = esObjeto(d.habilidades) ? d.habilidades : {};
  const hab: Record<string, unknown> = { ...origen };
  for (const def of HABILIDADES) if (!esObjeto(hab[def.clave])) hab[def.clave] = {};
  for (const [k, v] of Object.entries(hab)) {
    if (!esObjeto(v)) continue;
    const h = v as DatosHabilidad;
    const def = defHabilidad(k, h);
    if (!def) continue; // entradas que no son del catálogo: se conservan tal cual
    const rangos = typeof h.rangos === "number" ? h.rangos : 0;
    const total = def.entrenada && rangos < 1
      ? null
      : rangos + (modificador(at[def.at]) ?? 0) + (h.clase && rangos > 0 ? 3 : 0) + (typeof h.otros === "number" ? h.otros : 0)
        + (typeof h.raza === "number" ? h.raza : 0) + (typeof h.rasgo === "number" ? h.rasgo : 0) + (def.armadura ? pen : 0);
    hab[k] = { ...h, total };
  }
  return { ...d, habilidades: hab };
}

/* ------------------------------------------------------------- utilidades -- */

/** Entradas de una lista en orden: primero por `orden` (lo pone el asistente), luego tal cual.
    Hace falta porque jsonb devuelve las claves reordenadas. */
export function ordenados(lista: unknown): [string, Item][] {
  if (!esObjeto(lista)) return [];
  const pos = (it: Item, i: number) => (typeof it.orden === "number" ? it.orden : 10_000 + i);
  const claves = Object.keys(lista).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  return claves
    .map((k, i) => [k, (esObjeto(lista[k]) ? lista[k] : {}) as Item, i] as const)
    .sort((a, b) => pos(a[1], a[2]) - pos(b[1], b[2]))
    .map(([k, it]) => [k, it]);
}

export const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const modificador = (valor: unknown) =>
  typeof valor === "number" ? Math.floor((valor - 10) / 2) : null;

export const conSigno = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** Valor para pintar: con signo si toca, "—" si está vacío. */
export function mostrar(v: unknown, signo?: boolean): string {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "number" && signo) return conSigno(v);
  return String(v);
}

/** Clave nueva para un elemento de lista: 'dote-1', 'dote-2'… Estable aunque cambie el nombre. */
export function claveNueva(singular: string, existentes: string[]): string {
  const base = singular.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  let n = existentes.length + 1;
  while (existentes.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Todas las rutas que existen en una ficha (cada objeto y cada hoja). */
export function rutasDe(datos: FichaDatos, prefijo = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(datos)) {
    const ruta = prefijo ? `${prefijo}.${k}` : k;
    out.push(ruta);
    if (esObjeto(v)) out.push(...rutasDe(v, ruta));
  }
  return out;
}

/** ¿Está visible para el jugador? Por sí misma, por un padre revelado, o por ser PG. */
export function estaVisible(ruta: string, reveladas: Set<string>): "propia" | "heredada" | false {
  const partes = ruta.split(".");
  if (partes[0] === "pg") return "heredada";
  if (reveladas.has(ruta)) return "propia";
  for (let i = 1; i < partes.length; i++) if (reveladas.has(partes.slice(0, i).join("."))) return "heredada";
  return false;
}
