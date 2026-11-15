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
  | { tipo: "texto"; clave: string; titulo: string };

export type Item = { nombre?: string; texto?: string; total?: number };

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
  { tipo: "lista", clave: "habilidades", titulo: "Habilidades", singular: "habilidad", conTotal: true },
  { tipo: "lista", clave: "rasgos", titulo: "Rasgos de clase", singular: "rasgo" },
  { tipo: "lista", clave: "dotes", titulo: "Dotes", singular: "dote" },
  { tipo: "lista", clave: "conjuros", titulo: "Magia", singular: "conjuro" },
  { tipo: "lista", clave: "equipo", titulo: "Equipo", singular: "objeto" },
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
  combate: { ca: 10, toque: 10, desprevenido: 10, ini: 0, bab: 0, bmc: 0, dmc: 10, velocidad: "9 m" },
  salvaciones: { fort: 0, ref: 0, vol: 0 },
  habilidades: {},
  rasgos: {},
  dotes: {},
  conjuros: {},
  equipo: {},
  trasfondo: "",
};

/* ------------------------------------------------------------- utilidades -- */

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
