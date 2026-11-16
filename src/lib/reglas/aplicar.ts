import type { FichaDatos } from "../api";
import { conSigno, CORTO, esObjeto, HABILIDADES, modificador, type Atributo, type DatosHabilidad } from "../ficha";
import { adicionales, ataqueBase, CLASES, salvacionBase, type Clase } from "./clases";
import { RAZAS, type Raza } from "./razas";

/* Asistente de ficha: escribe en la ficha lo que dan la raza y la clase.
   No es un motor de reglas: aplica una vez y todo queda editable a mano.
   Para poder repetirlo sin duplicar, apunta en `asistente` (clave oculta, no
   está en ESQUEMA) qué sumó a los atributos y qué habilidades marcó, y cada
   rasgo que añade lleva `origen`. */

export type Eleccion = {
  raza: string;
  libre: Atributo;
  clase: string;
  nivel: number;
  /** Sumar los modificadores raciales a los atributos (no si ya estaban sumados a mano). */
  sumarRaza: boolean;
  /** Recalcular ataque base, salvaciones, iniciativa, BMC, DMC y CA de toque. */
  combate: boolean;
  /** Recalcular los PG máximos (máximo del dado a nivel 1, media después). */
  pg: boolean;
  /** Borrar también los rasgos escritos a mano en esas secciones. */
  sustituir: boolean;
};

type Registro = { raza?: { clave: string; sumados: Partial<Record<Atributo, number>> }; clase?: { clave: string; habilidades: string[] } };
type ItemLista = { nombre?: string; texto?: string; origen?: string; orden?: number; nivel?: number };

const ATRIBUTOS: Atributo[] = ["fue", "des", "con", "int", "sab", "car"];
const obj = (v: unknown): Record<string, unknown> => (esObjeto(v) ? { ...v } : {});
const num = (v: unknown) => (typeof v === "number" ? v : null);

export function modsDe(raza: Raza, libre: Atributo): Partial<Record<Atributo, number>> {
  return raza.libre ? { [libre]: 2 } : raza.mods;
}

/** Quita de una lista lo que puso el asistente (y, si se pide, todo) y añade lo nuevo. */
function rehacerLista(lista: unknown, origen: string, sustituir: boolean, nuevos: ItemLista[], prefijo: string) {
  const fuera = Object.entries(obj(lista)).filter(([, v]) => !sustituir && !(esObjeto(v) && (v as ItemLista).origen === origen));
  const quitados = Object.keys(obj(lista)).length - fuera.length;
  const dentro = nuevos.map((it, i) => [`${prefijo}-${i + 1}`, { ...it, origen, orden: it.orden ?? i + 1 }] as const);
  return { lista: Object.fromEntries([...dentro, ...fuera]), quitados };
}

export function aplicar(datos: FichaDatos, e: Eleccion): { datos: FichaDatos; cambios: string[] } {
  const d: FichaDatos = structuredClone(datos);
  const cambios: string[] = [];
  const reg: Registro = obj(d.asistente) as Registro;
  const raza = RAZAS.find((r) => r.clave === e.raza);
  const clase = CLASES.find((c) => c.clave === e.clase);
  const nivel = Math.max(1, Math.min(20, Math.floor(e.nivel) || 1));
  const at = obj(d.atributos) as Record<string, number>;
  const hab = obj(d.habilidades) as Record<string, DatosHabilidad>;
  for (const k of Object.keys(hab)) hab[k] = { ...obj(hab[k]) };
  const mod = (a: Atributo) => modificador(at[a]) ?? 0;

  /* --------------------------------------------------------------- raza -- */
  if (raza) {
    d.raza = raza.nombre;
    const nuevos = modsDe(raza, e.libre);
    const antes = reg.raza?.sumados ?? {};
    if (e.sumarRaza) {
      const linea: string[] = [];
      for (const a of ATRIBUTOS) {
        const delta = (nuevos[a] ?? 0) - (antes[a] ?? 0);
        if (!delta) continue;
        const v = typeof at[a] === "number" ? at[a] : 10;
        at[a] = v + delta;
        linea.push(`${CORTO[a]} ${v} → ${at[a]}`);
      }
      if (linea.length) cambios.push(`Atributos: ${linea.join(", ")}.`);
      reg.raza = { clave: raza.clave, sumados: nuevos };
    } else {
      reg.raza = { clave: raza.clave, sumados: {} };
      const txt = ATRIBUTOS.filter((a) => nuevos[a]).map((a) => `${CORTO[a]} ${conSigno(nuevos[a]!)}`).join(", ");
      if (txt) cambios.push(`Modificadores raciales (${txt}) sin sumar: se dan por sumados.`);
    }

    const rasgos: ItemLista[] = [
      ...raza.rasgos.map((r) => ({ nombre: r.nombre, texto: r.texto })),
      { nombre: "Idiomas", texto: raza.idiomas },
    ];
    const r = rehacerLista(d.raciales, "raza", e.sustituir, rasgos, "raza");
    d.raciales = r.lista;
    cambios.push(`Rasgos raciales: ${rasgos.length}${r.quitados ? ` (sustituyen a ${r.quitados})` : ""}.`);

    for (const h of Object.values(hab)) delete h.raza;
    for (const [k, v] of Object.entries(raza.habilidades ?? {})) hab[k] = { ...obj(hab[k]), raza: v };
    if (raza.habilidades) {
      cambios.push(`Habilidades: ${Object.entries(raza.habilidades).map(([k, v]) => `${HABILIDADES.find((h) => h.clave === k)?.nombre} ${conSigno(v)}`).join(", ")}.`);
    }

    const vel = raza.velocidad + (clase?.rapido && nivel >= clase.rapido ? 10 : 0);
    d.combate = { ...obj(d.combate), velocidad: `${vel} pies` };
    cambios.push(`Velocidad ${vel} pies.`);
  }

  /* -------------------------------------------------------------- clase -- */
  if (clase) {
    d.clase = clase.nombre;
    d.nivel = nivel;

    const rasgos: ItemLista[] = clase.rasgos.filter((r) => (r.nivel ?? 1) <= nivel)
      .map((r, i) => ({ nombre: r.nombre, texto: `Nivel ${r.nivel ?? 1}. ${r.texto}`, nivel: r.nivel, orden: i + 1 }));
    const r = rehacerLista(d.rasgos, "clase", e.sustituir, rasgos, "clase");
    d.rasgos = r.lista;
    cambios.push(`Rasgos de clase hasta nivel ${nivel}: ${rasgos.length}${r.quitados ? ` (sustituyen a ${r.quitados})` : ""}.`);

    // Habilidades de clase: desmarca las que marcó la clase anterior y marca las nuevas.
    for (const k of reg.clase?.habilidades ?? []) if (hab[k] && !clase.habilidades.includes(k)) delete hab[k].clase;
    for (const k of clase.habilidades) hab[k] = { ...obj(hab[k]), clase: true };
    reg.clase = { clave: clase.clave, habilidades: clase.habilidades };
    cambios.push(`Habilidades de clase: ${clase.habilidades.length} marcadas. Rangos por nivel: ${clase.rangos} + Int${raza?.clave === "humano" ? " + 1 (humano)" : ""}.`);

    // Bonificadores de clase a habilidades (conocimiento de bardo, sentido de la naturaleza).
    for (const h of Object.values(hab)) delete h.rasgo;
    const rasgo: Record<string, number> = {};
    if (clase.clave === "bardo") for (const h of HABILIDADES) if (h.clave.startsWith("conocimiento-") && h.clave !== "conocimiento-conjuros") rasgo[h.clave] = Math.max(1, Math.floor(nivel / 2));
    if (clase.clave === "druida") Object.assign(rasgo, { "conocimiento-naturaleza": 2, supervivencia: 2 });
    for (const [k, v] of Object.entries(rasgo)) hab[k] = { ...obj(hab[k]), rasgo: v };

    // Magia: conjuros al día (con los adicionales por atributo) en la sección de Magia.
    const conj = obj(d.conjuros);
    for (const [k, v] of Object.entries(conj)) if (esObjeto(v) && (v as ItemLista).origen === "clase") delete conj[k];
    const m = clase.magia;
    const fila = m?.porDia[nivel - 1] ?? [];
    if (m && fila.some((x) => x !== null && x !== undefined)) {
      const am = mod(m.atributo);
      const porDia = fila.map((n, i) => (n === null || n === undefined ? null : `${i}: ${n + adicionales(am, i)}${i > 0 && adicionales(am, i) ? ` (${n}+${adicionales(am, i)})` : ""}`)).filter(Boolean);
      const conocidos = m.conocidos?.[nivel - 1]?.map((n, i) => (n === null || n === undefined ? null : `${i}: ${n}`)).filter(Boolean);
      const texto = [
        `Por día — ${porDia.join(" · ")}.`,
        conocidos?.length ? `Conocidos — ${conocidos.join(" · ")}.` : "",
        m.extra ?? "",
        `CD = 10 + nivel del conjuro ${am < 0 ? "−" : "+"} ${Math.abs(am)} (${CORTO[m.atributo]}).`,
      ].filter(Boolean).join(" ");
      conj["clase-por-dia"] = { nombre: "Conjuros al día", texto, origen: "clase", orden: -1 };
      cambios.push(`Magia: ${texto}`);
    }
    d.conjuros = conj;
  }

  d.atributos = at;
  d.habilidades = hab;

  /* ------------------------------------------------ combate y salvaciones -- */
  const c = clase ?? CLASES.find((x) => x.clave === reg.clase?.clave);
  const rz = raza ?? RAZAS.find((x) => x.clave === reg.raza?.clave);
  if (c && e.combate) {
    const tam = rz?.tamano === "P" ? 1 : 0;
    const bab = ataqueBase(c, nivel);
    const monje = c.clave === "monje";
    const caMonje = monje ? Math.max(0, mod("sab")) + (nivel >= 4 ? 1 : 0) : 0;
    const baseBmc = monje && nivel >= 3 ? nivel : bab;
    const gracia = c.clave === "paladin" && nivel >= 2 ? Math.max(0, mod("car")) : 0;
    const extra = (rz?.salvaciones ?? 0) + gracia;
    const sal = {
      fort: salvacionBase(c, "fort", nivel) + mod("con") + extra,
      ref: salvacionBase(c, "ref", nivel) + mod("des") + extra,
      vol: salvacionBase(c, "vol", nivel) + mod("sab") + extra,
    };
    const co = {
      ...obj(d.combate),
      bab,
      ini: mod("des"),
      bmc: baseBmc + mod("fue") - tam,
      dmc: 10 + baseBmc + mod("fue") + mod("des") - tam + caMonje,
      toque: 10 + mod("des") + tam + caMonje,
    };
    d.combate = co;
    d.salvaciones = { ...obj(d.salvaciones), ...sal };
    cambios.push(`Ataque base ${conSigno(bab)} · Fort ${conSigno(sal.fort)}, Ref ${conSigno(sal.ref)}, Vol ${conSigno(sal.vol)} · Inic. ${conSigno(co.ini)} · BMC ${conSigno(co.bmc)} · DMC ${co.dmc} · Toque ${co.toque}. La CA y la CA desprevenido dependen de la armadura: no se tocan.`);
  }
  if (c && e.pg) {
    const pg = obj(d.pg);
    const viejo = num(pg.max);
    const max = c.dg + (nivel - 1) * (c.dg / 2 + 1) + Array.from({ length: nivel }, () => mod("con")).reduce((s, x) => s + x, 0);
    const actual = num(pg.actual);
    d.pg = { ...pg, max, actual: actual === null || actual === viejo || actual > max ? max : actual };
    cambios.push(`PG máximos: ${viejo ?? "—"} → ${max} (d${c.dg} ${nivel === 1 ? "al máximo" : `al máximo y ${c.dg / 2 + 1} por nivel después`}, + Con). Sin el PG de clase predilecta.`);
  }

  d.asistente = reg;
  return { datos: d, cambios };
}

/** Raza y clase que ya tiene la ficha (por el registro del asistente o por lo escrito). */
export function eleccionInicial(datos: FichaDatos, razaDe: (t: unknown) => Raza | undefined, claseDe: (t: unknown) => Clase | undefined): Eleccion {
  const reg = obj(datos.asistente) as Registro;
  const raza = RAZAS.find((r) => r.clave === reg.raza?.clave) ?? razaDe(datos.raza);
  const clase = CLASES.find((c) => c.clave === reg.clase?.clave) ?? claseDe(datos.clase);
  const at = obj(datos.atributos);
  const todo10 = ATRIBUTOS.every((a) => at[a] === undefined || at[a] === 10);
  const sumados = reg.raza?.sumados ?? {};
  const libre = (ATRIBUTOS.find((a) => sumados[a]) ?? "fue") as Atributo;
  return {
    raza: raza?.clave ?? "",
    libre,
    clase: clase?.clave ?? "",
    nivel: typeof datos.nivel === "number" ? datos.nivel : 1,
    // Si ya hay atributos puestos a mano y el asistente no sumó nada, lo normal es que ya estén sumados.
    sumarRaza: todo10 || Object.keys(sumados).length > 0,
    combate: true,
    pg: true,
    sustituir: false,
  };
}
