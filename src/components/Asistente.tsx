import { useMemo, useState } from "react";
import type { FichaDatos } from "../lib/api";
import { CORTO, esObjeto, modificador, type Atributo } from "../lib/ficha";
import { aplicar, eleccionInicial, modsDe, type Eleccion } from "../lib/reglas/aplicar";
import { CLASES, claseDe, type ListaConjuros } from "../lib/reglas/clases";
import { conjurosDe } from "../lib/reglas/conjuros";
import { DOTES, slug, type TipoDote } from "../lib/reglas/dotes";
import {
  ARMADURAS, ARMAS, describirArma, describirArmadura, describirMaravilloso, describirMundano, describirPocion, MARAVILLOSOS, MUNDANOS,
  po, POCIONES, propiedadesPara, type Calidad,
} from "../lib/reglas/equipo";
import { RAZAS, razaDe } from "../lib/reglas/razas";

/* Se carga aparte (lazy) desde el biombo: los datos de reglas no viajan al
   móvil de los jugadores. */

const ATRIBUTOS = Object.keys(CORTO) as Atributo[];
const conSigno = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** Raza y clase de PF1e: rellena la ficha con lo que dan. Todo queda editable. */
export default function Asistente({ datos, setDatos }: { datos: FichaDatos; setDatos: (f: (d: FichaDatos) => FichaDatos) => void }) {
  const [e, setE] = useState<Eleccion>(() => eleccionInicial(datos, razaDe, claseDe));
  const [hecho, setHecho] = useState(false);
  const cambiar = (c: Partial<Eleccion>) => { setE((x) => ({ ...x, ...c })); setHecho(false); };
  const raza = RAZAS.find((r) => r.clave === e.raza);
  const clase = CLASES.find((c) => c.clave === e.clase);
  const vista = useMemo(() => aplicar(datos, e), [datos, e]);
  const aMano = (lista: unknown, origen: string) =>
    esObjeto(lista) ? Object.values(lista).filter((v) => esObjeto(v) && v.origen !== origen).length : 0;
  const manoRaza = raza ? aMano(datos.raciales, "raza") : 0;
  const manoClase = clase ? aMano(datos.rasgos, "clase") : 0;

  return (
    <details className="pagina plegable asistente">
      <summary>
        <h2>Asistente PF1e</h2>
        <span className="tenue">raza y clase del Manual básico</span>
      </summary>

      <div className="rejilla-campos ancha">
        <label className="celda-campo">
          <span className="etiqueta">Raza</span>
          <select className="campo" value={e.raza} onChange={(ev) => cambiar({ raza: ev.target.value })}>
            <option value="">— sin tocar —</option>
            {RAZAS.map((r) => <option key={r.clave} value={r.clave}>{r.nombre}</option>)}
          </select>
        </label>
        {raza?.libre && (
          <label className="celda-campo">
            <span className="etiqueta">+2 a</span>
            <select className="campo" value={e.libre} onChange={(ev) => cambiar({ libre: ev.target.value as Atributo })}>
              {ATRIBUTOS.map((a) => <option key={a} value={a}>{CORTO[a]}</option>)}
            </select>
          </label>
        )}
        <label className="celda-campo">
          <span className="etiqueta">Clase</span>
          <select className="campo" value={e.clase} onChange={(ev) => cambiar({ clase: ev.target.value })}>
            <option value="">— sin tocar —</option>
            {CLASES.map((c) => <option key={c.clave} value={c.clave}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="celda-campo">
          <span className="etiqueta">Nivel</span>
          <input className="campo cifra" type="number" min={1} max={20} value={e.nivel} onChange={(ev) => cambiar({ nivel: Number(ev.target.value) || 1 })} />
        </label>
      </div>

      {raza && (
        <p className="nota">
          {raza.nombre}: {ATRIBUTOS.filter((a) => modsDe(raza, e.libre)[a]).map((a) => `${CORTO[a]} ${conSigno(modsDe(raza, e.libre)[a]!)}`).join(", ") || "sin modificadores"}
          {" · "}{raza.tamano === "P" ? "Pequeño" : "Mediano"} · {raza.velocidad} pies
        </p>
      )}
      {clase && <p className="nota">{clase.nombre}: d{clase.dg}, {clase.rangos} + Int rangos por nivel, ataque {clase.ataque}, salvaciones buenas: {clase.buenas.map((s) => ({ fort: "Fort", ref: "Ref", vol: "Vol" })[s]).join(", ")}.</p>}

      <div className="opciones">
        <label><input type="checkbox" checked={e.sumarRaza} onChange={(ev) => cambiar({ sumarRaza: ev.target.checked })} /> Sumar los modificadores raciales a los atributos</label>
        <label><input type="checkbox" checked={e.combate} onChange={(ev) => cambiar({ combate: ev.target.checked })} /> Recalcular ataque base, salvaciones, iniciativa, BMC, DMC y toque</label>
        <label><input type="checkbox" checked={e.pg} onChange={(ev) => cambiar({ pg: ev.target.checked })} /> Recalcular los PG máximos</label>
        {(manoRaza > 0 || manoClase > 0) && (
          <label>
            <input type="checkbox" checked={e.sustituir} onChange={(ev) => cambiar({ sustituir: ev.target.checked })} />{" "}
            Borrar los rasgos escritos a mano ({[manoRaza && `${manoRaza} raciales`, manoClase && `${manoClase} de clase`].filter(Boolean).join(", ")})
          </label>
        )}
      </div>
      {!e.sumarRaza && raza && Object.keys(modsDe(raza, e.libre)).length > 0 && (
        <p className="nota">Sin marcar: los atributos se quedan como están (por si ya los sumaste a mano).</p>
      )}

      {(raza || clase) && (
        <>
          <h3>Qué va a cambiar</h3>
          <ul className="cambios">{vista.cambios.map((c, i) => <li key={i}>{c}</li>)}</ul>
          <div className="fila">
            <span className="nota">{hecho ? "Hecho. Revisa la ficha y guarda." : "Se aplica a la ficha sin guardar: luego revisas y guardas."}</span>
            <button type="button" className="boton chico" onClick={() => { setDatos((d) => aplicar(d, e).datos); setHecho(true); }}>
              Aplicar a la ficha
            </button>
          </div>
        </>
      )}
    </details>
  );
}

const LISTAS: { clave: ListaConjuros; nombre: string }[] = [
  { clave: "ar", nombre: "Hechicero / Mago" },
  { clave: "br", nombre: "Bardo" },
  { clave: "cl", nombre: "Clérigo" },
  { clave: "dr", nombre: "Druida" },
  { clave: "pa", nombre: "Paladín" },
  { clave: "ex", nombre: "Explorador" },
];

/** Añade conjuros del Manual básico a la sección de Magia. */
export function SelectorConjuros({ datos, poner }: { datos: FichaDatos; poner: (ruta: string[], v: unknown) => void }) {
  const clase = claseDe(datos.clase);
  const nivel = typeof datos.nivel === "number" ? datos.nivel : 1;
  const fila = clase?.magia?.porDia[nivel - 1] ?? [];
  const maxClase = fila.reduce<number>((m, n, i) => (n === null || n === undefined ? m : i), -1);
  const [lista, setLista] = useState<ListaConjuros>(clase?.magia?.lista ?? "ar");
  const [max, setMax] = useState(maxClase >= 0 ? maxClase : 1);
  const [elegido, setElegido] = useState("");
  const opciones = useMemo(() => conjurosDe(lista, max), [lista, max]);
  const ya = esObjeto(datos.conjuros) ? datos.conjuros : {};
  const c = opciones.find((x) => x.clave === elegido);
  const mod = clase?.magia ? modificador((esObjeto(datos.atributos) ? datos.atributos : {})[clase.magia.atributo]) : null;

  const anadir = () => {
    if (!c) return;
    poner(["conjuros", `cj-${c.clave}`], {
      nombre: c.nombre,
      texto: `Nivel ${c.nivel} · ${c.escuela}${mod !== null ? ` · CD ${10 + c.nivel + mod}` : ""}. ${c.texto} (${c.ingles})`,
      nivel: c.nivel,
      orden: c.nivel * 100,
    });
    setElegido("");
  };

  return (
    <div className="selector-conjuros">
      <span className="etiqueta">Añadir del Manual básico</span>
      <div className="fila">
        <select className="campo" aria-label="Lista de conjuros" value={lista} onChange={(ev) => { setLista(ev.target.value as ListaConjuros); setElegido(""); }}>
          {LISTAS.map((l) => <option key={l.clave} value={l.clave}>{l.nombre}</option>)}
        </select>
        <select className="campo corto" aria-label="Hasta el nivel" value={max} onChange={(ev) => setMax(Number(ev.target.value))}>
          {[0, 1, 2, 3].map((n) => <option key={n} value={n}>hasta {n}</option>)}
        </select>
      </div>
      <div className="fila">
        <select className="campo" aria-label="Conjuro" value={elegido} onChange={(ev) => setElegido(ev.target.value)}>
          <option value="">— elige un conjuro ({opciones.length}) —</option>
          {[0, 1, 2, 3].filter((n) => n <= max).map((n) => (
            <optgroup key={n} label={n === 0 ? "Nivel 0 (trucos)" : `Nivel ${n}`}>
              {opciones.filter((x) => x.nivel === n).map((x) => (
                <option key={x.clave} value={x.clave}>{x.nombre}{ya[`cj-${x.clave}`] ? " ✓" : ""}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="button" className="boton chico" disabled={!c} onClick={anadir}>Añadir</button>
      </div>
      {c && <p className="nota">{c.escuela} · {c.texto} <i>({c.ingles})</i></p>}
    </div>
  );
}

const TIPOS_DOTE: { clave: TipoDote | ""; nombre: string }[] = [
  { clave: "", nombre: "Todas" },
  { clave: "combate", nombre: "De combate" },
  { clave: "general", nombre: "Generales" },
  { clave: "metamágica", nombre: "Metamágicas" },
  { clave: "creación", nombre: "De creación" },
];

/** Añade dotes del Manual básico a la sección de Dotes. */
export function SelectorDotes({ datos, poner }: { datos: FichaDatos; poner: (ruta: string[], v: unknown) => void }) {
  const [tipo, setTipo] = useState<TipoDote | "">("");
  const [busca, setBusca] = useState("");
  const [elegida, setElegida] = useState("");
  const [detalle, setDetalle] = useState("");
  const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const opciones = useMemo(
    () => DOTES.filter((d) => (!tipo || d.tipo === tipo) && (!busca || norm(`${d.nombre} ${d.ingles}`).includes(norm(busca)))),
    [tipo, busca],
  );
  const ya = esObjeto(datos.dotes) ? datos.dotes : {};
  const d = DOTES.find((x) => x.clave === elegida);

  const anadir = () => {
    if (!d) return;
    const extra = detalle.trim();
    poner(["dotes", `dt-${d.clave}${extra ? `-${slug(extra)}` : ""}`], {
      nombre: extra ? `${d.nombre} (${extra})` : d.nombre,
      texto: `${d.requisitos ? `Requisitos: ${d.requisitos}. ` : ""}${d.texto} (${d.ingles})`,
    });
    setElegida("");
    setDetalle("");
  };

  return (
    <div className="selector-conjuros">
      <span className="etiqueta">Añadir del Manual básico</span>
      <div className="fila">
        <select className="campo corto" aria-label="Tipo de dote" value={tipo} onChange={(ev) => { setTipo(ev.target.value as TipoDote | ""); setElegida(""); }}>
          {TIPOS_DOTE.map((t) => <option key={t.clave} value={t.clave}>{t.nombre}</option>)}
        </select>
        <input className="campo" type="search" aria-label="Buscar dote" placeholder="Buscar (también en inglés)" value={busca} onChange={(ev) => setBusca(ev.target.value)} />
      </div>
      <div className="fila">
        <select className="campo" aria-label="Dote" value={elegida} onChange={(ev) => setElegida(ev.target.value)}>
          <option value="">— elige una dote ({opciones.length}) —</option>
          {opciones.map((x) => (
            <option key={x.clave} value={x.clave}>{x.nombre}{Object.keys(ya).some((k) => k === `dt-${x.clave}` || k.startsWith(`dt-${x.clave}-`)) ? " ✓" : ""}</option>
          ))}
        </select>
        <button type="button" className="boton chico" disabled={!d} onClick={anadir}>Añadir</button>
      </div>
      {d && (
        <>
          <p className="nota">
            <b>{d.tipo[0].toUpperCase() + d.tipo.slice(1)}.</b> {d.requisitos ? `Requisitos: ${d.requisitos}. ` : "Sin requisitos. "}{d.texto} <i>({d.ingles})</i>
          </p>
          <input className="campo detalle-dote" aria-label="Especificar" placeholder="Especificar si hace falta: arma, habilidad, escuela… (opcional)" value={detalle} onChange={(ev) => setDetalle(ev.target.value)} />
        </>
      )}
    </div>
  );
}

const CATEGORIAS = [
  { clave: "sencilla", nombre: "Armas sencillas" },
  { clave: "marcial", nombre: "Armas marciales" },
  { clave: "exótica", nombre: "Armas exóticas" },
  { clave: "armadura", nombre: "Armaduras" },
  { clave: "escudo", nombre: "Escudos" },
  { clave: "maravilloso", nombre: "Objetos maravillosos (NL ≤ 7)" },
  { clave: "pocion", nombre: "Pociones y aceites" },
  { clave: "mundano", nombre: "Equipo de aventurero" },
] as const;
type Categoria = (typeof CATEGORIAS)[number]["clave"];

export type EquipoElegido = { nombre: string; notas: string; precio: number; cantidad: number; visible: boolean; cobrar: boolean };

/** Armas, armaduras, escudos y objetos maravillosos del Manual básico para el petate. */
export function SelectorEquipo({ pequeno, oro, ocupado, onAnadir }: {
  pequeno: boolean; oro: number; ocupado: boolean; onAnadir: (e: EquipoElegido) => void;
}) {
  const [cat, setCat] = useState<Categoria>("marcial");
  const [clave, setClave] = useState("");
  const [calidad, setCalidad] = useState<Calidad>("normal");
  const [props, setProps] = useState<string[]>([]);
  const [peq, setPeq] = useState(pequeno);
  const [visible, setVisible] = useState(true);
  const [cobrar, setCobrar] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  const armas = ARMAS.filter((a) => a.competencia === cat);
  const armaduras = ARMADURAS.filter((a) => (cat === "escudo" ? a.clase === "escudo" : a.clase !== "escudo"));
  const arma = armas.find((a) => a.clave === clave);
  const armadura = cat === "armadura" || cat === "escudo" ? armaduras.find((a) => a.clave === clave) : undefined;
  const maravilloso = cat === "maravilloso" ? MARAVILLOSOS.find((m) => m.clave === clave) : undefined;
  const pocion = cat === "pocion" ? POCIONES.find((p) => p.clave === clave) : undefined;
  const mundano = cat === "mundano" ? MUNDANOS.find((m) => m.clave === clave) : undefined;
  const porUnidades = cat === "pocion" || cat === "mundano";
  const base = arma ?? armadura;
  const posibles = base ? propiedadesPara(base) : [];
  const elegidas = posibles.filter((p) => props.includes(p.clave));
  const desc = arma ? describirArma({ arma, calidad, props: elegidas, pequeno: peq })
    : armadura ? describirArmadura({ armadura, calidad, props: elegidas })
    : maravilloso ? describirMaravilloso(maravilloso)
    : pocion ? describirPocion(pocion)
    : mundano ? describirMundano(mundano) : null;
  const total = desc ? Math.round(desc.precio * (porUnidades ? cantidad : 1) * 100) / 100 : 0;
  const equivalente = typeof calidad === "number" ? calidad + elegidas.reduce((s, p) => s + p.bono, 0) : 0;
  const cambiarCat = (c: Categoria) => { setCat(c); setClave(""); setCalidad("normal"); setProps([]); setCantidad(1); };

  return (
    <div className="selector-conjuros">
      <span className="etiqueta">Añadir del Manual básico</span>
      <div className="fila">
        <select className="campo" aria-label="Categoría" value={cat} onChange={(e) => cambiarCat(e.target.value as Categoria)}>
          {CATEGORIAS.map((c) => <option key={c.clave} value={c.clave}>{c.nombre}</option>)}
        </select>
      </div>
      <div className="fila">
        <select className="campo" aria-label="Objeto" value={clave} onChange={(e) => { setClave(e.target.value); setProps([]); }}>
          <option value="">— elige —</option>
          {cat === "pocion"
            ? [0, 1, 2, 3].map((nv) => (
                <optgroup key={nv} label={nv === 0 ? "Nivel 0" : `Nivel ${nv}`}>
                  {POCIONES.filter((p) => p.nivel === nv).map((p) => <option key={p.clave} value={p.clave}>{p.nombre} · {po(p.precio)}</option>)}
                </optgroup>
              ))
            : cat === "mundano"
            ? MUNDANOS.map((m) => <option key={m.clave} value={m.clave}>{m.nombre} · {po(m.precio)}</option>)
            : cat === "maravilloso"
            ? MARAVILLOSOS.map((m) => <option key={m.clave} value={m.clave}>{m.nombre} · {po(m.precio)}</option>)
            : cat === "armadura" || cat === "escudo"
              ? armaduras.map((a) => <option key={a.clave} value={a.clave}>{a.nombre} · +{a.bono} · {po(a.precio)}</option>)
              : ["desarmado", "ligera", "una mano", "dos manos", "distancia", "munición"].map((u) => {
                  const del = armas.filter((a) => a.uso === u);
                  return del.length ? (
                    <optgroup key={u} label={u[0].toUpperCase() + u.slice(1)}>
                      {del.map((a) => <option key={a.clave} value={a.clave}>{a.nombre} · {a.danoM} · {po(a.precio)}</option>)}
                    </optgroup>
                  ) : null;
                })}
        </select>
      </div>
      {base && (
        <div className="fila">
          <select className="campo corto" aria-label="Calidad" value={String(calidad)} onChange={(e) => {
            const v = e.target.value;
            setCalidad(v === "1" ? 1 : v === "2" ? 2 : (v as Calidad));
          }}>
            <option value="normal">Normal</option>
            <option value="gc">Gran calidad</option>
            <option value="1">Mágica +1</option>
            <option value="2">Mágica +2</option>
          </select>
          {arma && <label className="casilla-linea"><input type="checkbox" checked={peq} onChange={(e) => setPeq(e.target.checked)} /> Tamaño Pequeño</label>}
        </div>
      )}
      {base && typeof calidad === "number" && (
        <div className="propiedades">
          {posibles.map((p) => (
            <label key={p.clave} className="casilla-linea" title={p.texto}>
              <input type="checkbox" checked={props.includes(p.clave)} onChange={(e) => setProps((xs) => (e.target.checked ? [...xs, p.clave] : xs.filter((x) => x !== p.clave)))} />
              {" "}{p.nombre} <small>{p.bono ? `+${p.bono}` : po(p.precio)}</small>
            </label>
          ))}
        </div>
      )}
      {desc && (
        <>
          <p className="nota"><b>{desc.nombre}</b>{equivalente > 2 ? ` (equivale a +${equivalente})` : ""}. {desc.notas}</p>
          {porUnidades && (
            <div className="fila">
              <label className="casilla-linea">Cantidad <input className="campo cifra corto" type="number" min={1} max={999} value={cantidad} onChange={(e) => setCantidad(Math.max(1, Math.floor(Number(e.target.value)) || 1))} /></label>
            </div>
          )}
          <div className="fila">
            <label className="casilla-linea"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Lo ve el jugador</label>
            <label className="casilla-linea"><input type="checkbox" checked={cobrar} onChange={(e) => setCobrar(e.target.checked)} /> Cobrar {po(total)}{cobrar && total > oro ? " (no le llega)" : ""}</label>
          </div>
          <div className="fila">
            <span />
            <button type="button" className="boton chico" disabled={ocupado || (cobrar && total > oro)} onClick={() => {
              onAnadir({ nombre: desc.nombre, notas: desc.notas, precio: total, cantidad: porUnidades ? cantidad : 1, visible, cobrar });
              setClave(""); setProps([]); setCalidad("normal"); setCantidad(1);
            }}>
              Añadir al petate
            </button>
          </div>
        </>
      )}
    </div>
  );
}
