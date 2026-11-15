/* Lector de bloques de estadísticas de Pathfinder 1e pegados de d20pfsrd.com
   (en inglés; también entiende las etiquetas habituales en castellano).
   Saca lo que la mesa enseña de la criatura: iniciativa, CA, PG, salvaciones,
   DMC, Percepción, defensas y ataques (con crítico), para tenerlo a la vista
   mientras se tira con dados en la mesa. Lo que no entiende lo ignora: nunca
   falla, como mucho devuelve menos datos. */

export type Ataque = {
  modo: "cc" | "dist";      // cuerpo a cuerpo / a distancia
  opcion: number;           // grupos separados por "or" (ataques completos alternativos)
  nombre: string;
  n: number;                // "2 claws" → 2
  bonos: number[];          // "+6/+1" → [6, 1]
  toque: boolean;
  dano: string;             // "1d6+1" (o "" si no hace daño)
  critMin: number;          // 20, 19, 18…
  critMult: number;         // ×2, ×3…
  extra: string;            // "plus disease and paralysis"
};

export type Bloque = {
  nombre: string;
  vd: string | null;
  xp: string | null;
  tipo: string | null;      // "CE Medium undead"
  ini: number | null;
  percepcion: number | null;
  ca: number | null;
  toque: number | null;
  desprevenido: number | null;
  pg: number | null;        // media
  dadosPG: string | null;   // "2d8+4"
  fort: number | null;
  ref: number | null;
  vol: number | null;
  bmc: number | null;
  dmc: number | null;
  velocidad: string | null;
  defensas: string[];       // RD, inmunidades, resistencias, RC, debilidades…
  especiales: string | null;
  ataques: Ataque[];
};

const limpiar = (t: string) => t
  .replace(/\r/g, "")
  .replace(/[‐-―−]/g, "-")
  .replace(/×/g, "x")
  .replace(/ /g, " ")
  .replace(/[ \t]+/g, " ");

const num = (s: string | undefined) => (s == null ? null : Number.parseInt(s.replace(/[\s,.]/g, ""), 10));
const primero = (t: string, re: RegExp) => t.match(re)?.[1]?.trim() ?? null;

/** Parte por un separador fuera de paréntesis. */
function partir(t: string, sep: RegExp): string[] {
  const out: string[] = [];
  let hondo = 0, ini = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === "(") hondo++;
    else if (ch === ")") hondo = Math.max(0, hondo - 1);
    else if (hondo === 0) {
      const m = t.slice(i).match(sep);
      if (m && m.index === 0) {
        out.push(t.slice(ini, i));
        i += m[0].length - 1;
        ini = i + 1;
      }
    }
  }
  out.push(t.slice(ini));
  return out.map((s) => s.trim()).filter(Boolean);
}

function leerAtaques(linea: string | null, modo: Ataque["modo"]): Ataque[] {
  if (!linea) return [];
  const out: Ataque[] = [];
  partir(linea, /^\s(?:or|o)\s/i).forEach((grupo, opcion) => {
    for (const parte of partir(grupo, /^(?:,|\s(?:and|y)\s)/i)) {
      const m = parte.match(/^(?:(\d+)\s+)?(.+?)\s+((?:[+-]\d+\/)*[+-]\d+)\s+(touch\s+|de toque\s+)?\((.*)\)\s*$/i);
      if (!m) continue;
      const [, n, nombre, bonos, toque, dentro] = m;
      const d = dentro.match(/^\s*(\d+d\d+(?:\s*[+-]\s*\d+)?|\d+)?\s*(?:\/\s*(\d+)\s*-\s*20)?\s*(?:\/\s*x\s*(\d))?\s*(.*)$/i);
      out.push({
        modo,
        opcion,
        nombre: nombre.trim(),
        n: n ? Number(n) : 1,
        bonos: bonos.split("/").map(Number),
        toque: !!toque,
        dano: d?.[1]?.replace(/\s+/g, "") ?? "",
        critMin: d?.[2] ? Number(d[2]) : 20,
        critMult: d?.[3] ? Number(d[3]) : 2,
        extra: (d?.[4] ?? dentro).trim().replace(/^,\s*/, ""),
      });
    }
  });
  return out;
}

export function leerBloque(entrada: string): Bloque | null {
  const t = limpiar(entrada);
  const lineas = t.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lineas.length) return null;

  const cab = lineas[0].match(/^(.*?)\s+(?:CR|VD)\s+([\d/]+)\b/i);
  const nombre = (cab?.[1] ?? lineas[0]).trim();
  const ca = t.match(/\b(?:AC|CA)\s+(\d+)\s*,\s*(?:touch|toque)\s+(\d+)\s*,\s*(?:flat-footed|desprevenid[oa])\s+(\d+)/i);
  const caSola = ca ? null : t.match(/\b(?:AC|CA)\s+(\d+)/);
  const pg = t.match(/\b(?:hp|pg|PG)\s+(\d+)(?:\s+(?:each|cada uno))?\s*(?:\(([^)]*)\))?/);
  const dados = pg?.[2]?.match(/\d+d\d+(?:\s*[+-]\s*\d+(?:d\d+)?)*/)?.[0]?.replace(/\s+/g, "") ?? null;
  const sv = t.match(/\bFort\s+([+-]\d+)\s*,\s*Ref\s+([+-]\d+)\s*,\s*(?:Will|Vol(?:untad)?)\s+([+-]\d+)/i);
  const linea = (re: RegExp) => lineas.map((l) => l.match(re)?.[1]?.trim()).find(Boolean) ?? null;
  /** Como linea(), pero sigue en las líneas siguientes si el campo continúa
      (acaba en "," / "or" / "and", o la siguiente empieza en minúscula o número). */
  const lineaLarga = (re: RegExp) => {
    const i = lineas.findIndex((l) => re.test(l));
    if (i < 0) return null;
    let v = lineas[i].match(re)![1].trim();
    for (let j = i + 1; j < lineas.length; j++) {
      const sig = lineas[j];
      const sigue = /(,|\b(?:or|and|o|y))$/i.test(v) || (/^[a-z(+\d]/.test(sig) && !/^(hp|pg)\b/i.test(sig));
      if (!sigue) break;
      v += " " + sig;
    }
    return v;
  };

  const defensas: string[] = [];
  const def = (etq: string, re: RegExp) => { const v = primero(t, re); if (v) defensas.push(`${etq} ${v.replace(/[;.]$/, "")}`); };
  def("RD", /\b(?:DR|RD)\s+([^;\n]+)/);
  def("Inmune:", /\b(?:Immune|Inmun(?:e|idades))\s+([^;\n]+)/i);
  def("Resiste:", /\b(?:Resist|Resistencias?)\s+([^;\n]+)/);
  def("RC", /\b(?:SR|RC)\s+(\d+)/);
  def("Débil:", /\b(?:Weaknesses|Debilidades)\s+([^;\n]+)/i);
  def("Def.:", /\b(?:Defensive Abilities|Aptitudes defensivas)\s+([^;\n]+)/i);
  def("Curación rápida", /\b(?:fast healing|curación rápida)\s+(\d+)/i);
  def("Regeneración", /\b(?:regeneration|regeneración)\s+([^;\n)]+)/i);

  const b: Bloque = {
    nombre,
    vd: cab?.[2] ?? null,
    xp: primero(t, /\b(?:XP|PX)\s+([\d.,]+)/),
    tipo: linea(/^((?:LG|NG|CG|LN|N|CN|LE|NE|CE|LB|NB|CB|NM|CM|LM)\s+.+)$/),
    ini: num(primero(t, /\b(?:Init|Iniciativa|Inic\.)\s+([+-]\d+)/i) ?? undefined),
    percepcion: num(primero(t, /\b(?:Perception|Percepción)\s+([+-]\d+)/i) ?? undefined),
    ca: ca ? Number(ca[1]) : caSola ? Number(caSola[1]) : null,
    toque: ca ? Number(ca[2]) : null,
    desprevenido: ca ? Number(ca[3]) : null,
    pg: pg ? Number(pg[1]) : null,
    dadosPG: dados,
    fort: sv ? Number(sv[1]) : null,
    ref: sv ? Number(sv[2]) : null,
    vol: sv ? Number(sv[3]) : null,
    bmc: num(primero(t, /\b(?:CMB|BMC)\s+([+-]\d+)/) ?? undefined),
    dmc: num(primero(t, /\b(?:CMD|DMC)\s+(\d+)/) ?? undefined),
    velocidad: linea(/^(?:Speed|Velocidad)\s+(.+)$/i),
    defensas,
    especiales: linea(/^(?:Special Attacks|Ataques especiales)\s+(.+)$/i),
    ataques: [
      ...leerAtaques(lineaLarga(/^(?:Melee|Cuerpo a cuerpo|C\. ?a c\.)\s+(.+)$/i), "cc"),
      ...leerAtaques(lineaLarga(/^(?:Ranged|A distancia)\s+(.+)$/i), "dist"),
    ],
  };
  // Sin nada reconocible no es un bloque.
  if (b.ca == null && b.pg == null && b.ini == null && !b.ataques.length) return null;
  return b;
}
