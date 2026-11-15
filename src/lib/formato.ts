import type { EstadoAccion, ObjetoDado, TipoAccion } from "./api";

export const TIPOS: { id: TipoAccion; nombre: string; pista: string }[] = [
  { id: "compra", nombre: "Comprar", pista: "¿Qué quieres comprar y dónde? Cuánto estás dispuesto a pagar." },
  { id: "entrenar", nombre: "Entrenar", pista: "¿Qué practicas y con quién?" },
  { id: "investigar", nombre: "Investigar", pista: "¿Qué quieres averiguar y a quién o dónde preguntas?" },
  { id: "carta_pnj", nombre: "Escribir a alguien", pista: "¿A quién escribes y qué le dices?" },
  { id: "otro", nombre: "Otra cosa", pista: "Cuéntale al máster qué haces." },
];

export const nombreTipo = (t: TipoAccion) => TIPOS.find((x) => x.id === t)?.nombre ?? t;

export const ESTADOS: Record<EstadoAccion, string> = {
  pendiente: "Pendiente",
  resuelta: "Resuelta",
  rechazada: "Rechazada",
};

export function oro(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return `${v.toLocaleString("es-ES", { maximumFractionDigits: 2 })} po`;
}

export function oroConSigno(n: number | string): string {
  const v = Number(n);
  return `${v > 0 ? "+" : "−"}${oro(Math.abs(v))}`;
}

export const objetosTexto = (objs: ObjetoDado[]) =>
  objs.map((o) => (o.cantidad > 1 ? `${o.item} ×${o.cantidad}` : o.item)).join(", ");

const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 5 minutos", "ayer", "hace 3 días"… */
export function haceCuanto(iso: string): string {
  const seg = (new Date(iso).getTime() - Date.now()) / 1000;
  const tramos: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60],
  ];
  for (const [u, s] of tramos) if (Math.abs(seg) >= s) return rtf.format(Math.round(seg / s), u);
  return "ahora mismo";
}
