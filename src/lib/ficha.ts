import type { FichaDatos } from "./api";

/* Secciones fijas de la ficha, en el orden en que se pintan. Lo que no esté
   revelado sale como hueco: la ficha en blanco ES la premisa de la campaña. */
export const SECCIONES: { clave: string; titulo: string }[] = [
  { clave: "nombre", titulo: "Nombre" },
  { clave: "raza", titulo: "Raza" },
  { clave: "clase", titulo: "Clase" },
  { clave: "nivel", titulo: "Nivel" },
  { clave: "pg", titulo: "Puntos de golpe" },
  { clave: "atributos", titulo: "Atributos" },
  { clave: "combate", titulo: "Combate" },
  { clave: "salvaciones", titulo: "Salvaciones" },
  { clave: "habilidades", titulo: "Habilidades" },
  { clave: "rasgos", titulo: "Rasgos de clase" },
  { clave: "dotes", titulo: "Dotes" },
  { clave: "conjuros", titulo: "Magia" },
  { clave: "trasfondo", titulo: "Trasfondo" },
  { clave: "equipo", titulo: "Equipo" },
];

export const ETIQUETAS: Record<string, string> = {
  fue: "FUE", des: "DES", con: "CON", int: "INT", sab: "SAB", car: "CAR",
  max: "Máximo", actual: "Actuales",
  ca: "CA", toque: "Toque", desprevenido: "Desprevenido",
  ini: "Iniciativa", bab: "Ataque base", bmc: "BMC", dmc: "DMC", velocidad: "Velocidad",
  fort: "Fortaleza", ref: "Reflejos", vol: "Voluntad",
};

export const etiqueta = (clave: string) =>
  ETIQUETAS[clave] ?? clave.replace(/[-_]/g, " ").replace(/^./, (c) => c.toUpperCase());

export const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Todas las rutas revelables de una ficha (cada objeto y cada hoja). */
export function rutasDe(datos: FichaDatos, prefijo = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(datos)) {
    const ruta = prefijo ? `${prefijo}.${k}` : k;
    out.push(ruta);
    if (esObjeto(v)) out.push(...rutasDe(v, ruta));
  }
  return out;
}

/** Ficha de ejemplo para empezar a rellenar. Listas como objetos, nunca arrays. */
export const PLANTILLA: FichaDatos = {
  nombre: "",
  raza: "",
  clase: "",
  nivel: 1,
  pg: { max: 10, actual: 10 },
  atributos: { fue: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  combate: { ca: 10, toque: 10, desprevenido: 10, ini: 0, bab: 0, bmc: 0, dmc: 10, velocidad: "9 m" },
  salvaciones: { fort: 0, ref: 0, vol: 0 },
  habilidades: { percepcion: { nombre: "Percepción", total: 0 } },
  rasgos: {},
  dotes: {},
  conjuros: {},
  trasfondo: { texto: "" },
  equipo: {},
};
