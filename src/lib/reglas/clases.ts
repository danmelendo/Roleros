import type { Atributo } from "../ficha";
import type { Rasgo } from "./razas";

/* Las 11 clases del Manual básico de Pathfinder 1e, del nivel 1 al 5 (la
   campaña no pasa de ahí). Habilidades de clase con las claves de HABILIDADES. */

export type Salvacion = "fort" | "ref" | "vol";
export type ListaConjuros = "ar" | "br" | "cl" | "dr" | "pa" | "ex";

export type Magia = {
  lista: ListaConjuros;
  atributo: Atributo;
  /** Conjuros por día por nivel de clase (índice 0 = nivel 1); dentro, por nivel de conjuro desde 0.
      null = todavía no lanza de ese nivel. 0 = solo los adicionales por atributo alto. */
  porDia: (number | null)[][];
  /** Conjuros conocidos (bardo y hechicero), misma forma. */
  conocidos?: (number | null)[][];
  /** Conjuros de dominio (clérigo) o de escuela (mago): +1 por nivel de conjuro. */
  extra?: string;
};

export type Clase = {
  clave: string;
  nombre: string;
  ingles: string;
  dg: number;
  rangos: number;
  ataque: "alto" | "medio" | "bajo";
  buenas: Salvacion[];
  habilidades: string[];
  rasgos: Rasgo[];
  magia?: Magia;
  /** Nivel en el que gana +10 pies de movimiento rápido. */
  rapido?: number;
};

const CONOCIMIENTOS = ["arcano", "dungeons", "geografia", "historia", "ingenieria", "local", "naturaleza", "nobleza", "planos", "religion"].map((c) => `conocimiento-${c}`);
const con = (...c: string[]) => c.map((x) => `conocimiento-${x}`);

export const CLASES: Clase[] = [
  {
    clave: "barbaro", nombre: "Bárbaro", ingles: "Barbarian", dg: 12, rangos: 4, ataque: "alto", buenas: ["fort"], rapido: 1,
    habilidades: ["acrobacias", "trepar", "artesania", "trato-animales", "intimidar", ...con("naturaleza"), "percepcion", "montar", "supervivencia", "nadar"],
    rasgos: [
      { nivel: 1, nombre: "Movimiento rápido", texto: "+10 pies a la velocidad con armadura ligera o intermedia (ya sumado)." },
      { nivel: 1, nombre: "Furia", texto: "Asaltos al día: 4 + mod. de Con, +2 por nivel a partir del 2. En furia: +4 Fue, +4 Con, +2 a Voluntad, −2 a la CA; no puede usar habilidades de concentración. Al acabar, fatigado el doble de asaltos." },
      { nivel: 2, nombre: "Poder de furia", texto: "Elige un poder de furia (uno más a nivel 4)." },
      { nivel: 2, nombre: "Esquiva asombrosa", texto: "No queda desprevenido ni pierde la Des a la CA aunque le pillen por sorpresa." },
      { nivel: 3, nombre: "Sentido de las trampas +1", texto: "+1 a Reflejos y a la CA contra trampas." },
      { nivel: 4, nombre: "Poder de furia", texto: "Un segundo poder de furia." },
      { nivel: 5, nombre: "Esquiva asombrosa mejorada", texto: "No se le puede flanquear (salvo un pícaro de 4 niveles más)." },
    ],
  },
  {
    clave: "bardo", nombre: "Bardo", ingles: "Bard", dg: 8, rangos: 6, ataque: "medio", buenas: ["ref", "vol"],
    habilidades: ["acrobacias", "tasacion", "enganar", "trepar", "artesania", "diplomacia", "disfrazarse", "escapismo", "intimidar", ...CONOCIMIENTOS, "linguistica", "percepcion", "interpretar", "profesion", "averiguar-intenciones", "juego-de-manos", "conocimiento-conjuros", "sigilo", "usar-objeto-magico"],
    rasgos: [
      { nivel: 1, nombre: "Conocimiento de bardo", texto: "+½ nivel (mínimo +1) a todas las habilidades de Conocimiento (ya sumado), que puede usar sin entrenar." },
      { nivel: 1, nombre: "Interpretación de bardo", texto: "Asaltos al día: 4 + mod. de Car, +2 por nivel a partir del 2. Contracanción, Distracción, Fascinar e Inspirar valor +1 (aliados: +1 a ataque y daño, y contra miedo y hechizos)." },
      { nivel: 1, nombre: "Trucos", texto: "Conjuros de nivel 0 que puede lanzar a voluntad." },
      { nivel: 2, nombre: "Interpretación versátil", texto: "Usa una Interpretación en lugar de dos habilidades asociadas." },
      { nivel: 2, nombre: "Versado", texto: "+4 a las salvaciones contra interpretaciones de bardo, efectos sónicos y del lenguaje." },
      { nivel: 3, nombre: "Inspirar competencia +2", texto: "Un aliado gana +2 a una prueba de habilidad mientras le escuche." },
      { nivel: 5, nombre: "Inspirar valor +2", texto: "El bonificador de Inspirar valor pasa a +2." },
      { nivel: 5, nombre: "Maestro del saber 1/día", texto: "Puede elegir 10 en Conocimiento; 1/día, elegir 20." },
    ],
    magia: {
      lista: "br", atributo: "car",
      porDia: [[null, 1], [null, 2], [null, 3], [null, 3, 1], [null, 4, 2]],
      conocidos: [[4, 2], [5, 3], [6, 4], [6, 4, 2], [6, 4, 3]],
    },
  },
  {
    clave: "clerigo", nombre: "Clérigo", ingles: "Cleric", dg: 8, rangos: 2, ataque: "medio", buenas: ["fort", "vol"],
    habilidades: ["tasacion", "artesania", "diplomacia", "sanar", ...con("arcano", "historia", "nobleza", "planos", "religion"), "linguistica", "profesion", "averiguar-intenciones", "conocimiento-conjuros"],
    rasgos: [
      { nivel: 1, nombre: "Aura", texto: "Aura del alineamiento de su dios, que detectan los conjuros de detectar." },
      { nivel: 1, nombre: "Canalizar energía 1d6", texto: "3 + mod. de Car veces al día: cura (o daña a muertos vivientes) 1d6 en un radio de 30 pies. Sube a 2d6 a nivel 3 y 3d6 a nivel 5. Vol mitad (CD 10 + ½ nivel + Car)." },
      { nivel: 1, nombre: "Dominios", texto: "Elige dos dominios de su dios: dan poderes y un conjuro de dominio extra por nivel." },
      { nivel: 1, nombre: "Oraciones", texto: "Conjuros de nivel 0 que puede lanzar a voluntad." },
      { nivel: 1, nombre: "Lanzamiento espontáneo", texto: "Cambia un conjuro preparado por un curar (o infligir) del mismo nivel." },
      { nivel: 3, nombre: "Canalizar energía 2d6", texto: "Canalizar energía hace 2d6." },
      { nivel: 5, nombre: "Canalizar energía 3d6", texto: "Canalizar energía hace 3d6." },
    ],
    magia: { lista: "cl", atributo: "sab", porDia: [[3, 1], [4, 2], [4, 2, 1], [4, 3, 2], [4, 3, 2, 1]], extra: "+1 conjuro de dominio por nivel de conjuro (desde el 1)." },
  },
  {
    clave: "druida", nombre: "Druida", ingles: "Druid", dg: 8, rangos: 4, ataque: "medio", buenas: ["fort", "vol"],
    habilidades: ["trepar", "artesania", "volar", "trato-animales", "sanar", ...con("geografia", "naturaleza"), "percepcion", "profesion", "montar", "conocimiento-conjuros", "supervivencia", "nadar"],
    rasgos: [
      { nivel: 1, nombre: "Vínculo con la naturaleza", texto: "Un compañero animal o un dominio (Aire, Animal, Tierra, Fuego, Plantas, Agua o Clima)." },
      { nivel: 1, nombre: "Sentido de la naturaleza", texto: "+2 a Conocimiento (naturaleza) y Supervivencia (ya sumado)." },
      { nivel: 1, nombre: "Empatía salvaje", texto: "Mejora la actitud de un animal como con Diplomacia: 1d20 + nivel + mod. de Car." },
      { nivel: 1, nombre: "Oraciones", texto: "Conjuros de nivel 0 que puede lanzar a voluntad." },
      { nivel: 1, nombre: "Lanzamiento espontáneo", texto: "Cambia un conjuro preparado por un convocar aliado natural del mismo nivel." },
      { nivel: 1, nombre: "Prohibido: armadura de metal", texto: "Pierde sus conjuros y aptitudes si lleva armadura o escudo de metal." },
      { nivel: 2, nombre: "Zancada forestal", texto: "Se mueve por maleza y espesura sin penalización ni daño." },
      { nivel: 3, nombre: "Paso sin rastro", texto: "No deja rastro en entornos naturales." },
      { nivel: 4, nombre: "Resistir la tentación de la naturaleza", texto: "+4 a las salvaciones contra aptitudes sortílegas y sobrenaturales de feéricos y contra efectos de plantas." },
      { nivel: 4, nombre: "Forma salvaje 1/día", texto: "Se convierte en un animal Pequeño o Mediano durante 1 hora por nivel (como forma bestial I)." },
    ],
    magia: { lista: "dr", atributo: "sab", porDia: [[3, 1], [4, 2], [4, 2, 1], [4, 3, 2], [4, 3, 2, 1]] },
  },
  {
    clave: "guerrero", nombre: "Guerrero", ingles: "Fighter", dg: 10, rangos: 2, ataque: "alto", buenas: ["fort"],
    habilidades: ["trepar", "artesania", "trato-animales", "intimidar", ...con("dungeons", "ingenieria"), "profesion", "montar", "supervivencia", "nadar"],
    rasgos: [
      { nivel: 1, nombre: "Dote adicional", texto: "Una dote de combate más (otra en cada nivel par)." },
      { nivel: 2, nombre: "Dote adicional", texto: "Otra dote de combate." },
      { nivel: 2, nombre: "Valentía +1", texto: "+1 a Voluntad contra miedo." },
      { nivel: 3, nombre: "Entrenamiento con armadura 1", texto: "−1 al penalizador de armadura y +1 al máximo de Des de la armadura. Se mueve a velocidad normal con armadura intermedia." },
      { nivel: 4, nombre: "Dote adicional", texto: "Otra dote de combate." },
      { nivel: 5, nombre: "Entrenamiento con armas 1", texto: "Elige un grupo de armas: +1 a ataque y daño con ellas." },
    ],
  },
  {
    clave: "monje", nombre: "Monje", ingles: "Monk", dg: 8, rangos: 4, ataque: "medio", buenas: ["fort", "ref", "vol"], rapido: 3,
    habilidades: ["acrobacias", "trepar", "artesania", "escapismo", "intimidar", ...con("historia", "religion"), "percepcion", "interpretar", "profesion", "montar", "averiguar-intenciones", "sigilo", "nadar"],
    rasgos: [
      { nivel: 1, nombre: "Bonificador a la CA", texto: "Sin armadura ni carga: suma su mod. de Sab a la CA y a la DMC (+1 a nivel 4)." },
      { nivel: 1, nombre: "Ráfaga de golpes", texto: "Acción de ataque completo: un ataque más con −2 a todos (usa su nivel como ataque base)." },
      { nivel: 1, nombre: "Golpe sin armas", texto: "1d6 (1d4 si es Pequeño); 1d8 a nivel 4. Cuenta como arma y no provoca." },
      { nivel: 1, nombre: "Puñetazo aturdidor", texto: "Dote adicional: veces al día = nivel. Fort (CD 10 + ½ nivel + Sab) o aturdido 1 asalto." },
      { nivel: 1, nombre: "Dote adicional", texto: "Una dote de la lista del monje (otra a nivel 2)." },
      { nivel: 2, nombre: "Evasión", texto: "Si supera Reflejos contra un efecto de mitad de daño, no recibe daño." },
      { nivel: 3, nombre: "Movimiento rápido", texto: "+10 pies a la velocidad sin armadura (ya sumado)." },
      { nivel: 3, nombre: "Entrenamiento en maniobras", texto: "Usa su nivel de monje como ataque base para la BMC (ya sumado)." },
      { nivel: 3, nombre: "Mente en calma", texto: "+2 a las salvaciones contra encantamientos." },
      { nivel: 4, nombre: "Reserva de ki", texto: "½ nivel + mod. de Sab puntos. Sus golpes cuentan como mágicos. Gastar 1: un ataque más en ráfaga, +4 a la CA 1 asalto o +20 pies." },
      { nivel: 4, nombre: "Caída lenta 20 pies", texto: "Con una pared a mano, cae 20 pies menos." },
      { nivel: 5, nombre: "Salto alto", texto: "+nivel a Acrobacias para saltar; gastando 1 de ki, +20 en un salto." },
      { nivel: 5, nombre: "Pureza corporal", texto: "Inmune a las enfermedades." },
    ],
  },
  {
    clave: "paladin", nombre: "Paladín", ingles: "Paladin", dg: 10, rangos: 2, ataque: "alto", buenas: ["fort", "vol"],
    habilidades: ["artesania", "diplomacia", "trato-animales", "sanar", ...con("nobleza", "religion"), "profesion", "montar", "averiguar-intenciones", "conocimiento-conjuros"],
    rasgos: [
      { nivel: 1, nombre: "Aura de bien", texto: "Aura de bien poderosa." },
      { nivel: 1, nombre: "Detectar el mal", texto: "A voluntad, como el conjuro." },
      { nivel: 1, nombre: "Castigar el mal 1/día", texto: "Contra un enemigo malvado: + mod. de Car al ataque, + nivel al daño (doble a muertos vivientes, ajenos malignos y dragones) y + mod. de Car de desvío a la CA. 2/día a nivel 4." },
      { nivel: 2, nombre: "Gracia divina", texto: "Suma su mod. de Car a todas las salvaciones (ya sumado)." },
      { nivel: 2, nombre: "Imposición de manos", texto: "½ nivel + mod. de Car veces al día: cura 1d6 por cada 2 niveles (acción rápida si es a sí mismo)." },
      { nivel: 3, nombre: "Aura de valor", texto: "Inmune al miedo; aliados a 10 pies, +4 contra miedo." },
      { nivel: 3, nombre: "Salud divina", texto: "Inmune a las enfermedades." },
      { nivel: 3, nombre: "Merced", texto: "La imposición de manos además quita una condición (fatigado, estremecido o indispuesto)." },
      { nivel: 4, nombre: "Canalizar energía positiva", texto: "Gastando dos usos de imposición de manos, canaliza como un clérigo de nivel −3." },
      { nivel: 4, nombre: "Castigar el mal 2/día", texto: "Un uso más al día." },
      { nivel: 4, nombre: "Conjuros", texto: "Empieza a lanzar conjuros divinos (Car)." },
      { nivel: 5, nombre: "Vínculo divino", texto: "Un espíritu que mejora su arma 1/día, o una montura." },
    ],
    magia: { lista: "pa", atributo: "car", porDia: [[], [], [], [null, 0], [null, 1]] },
  },
  {
    clave: "explorador", nombre: "Explorador", ingles: "Ranger", dg: 10, rangos: 6, ataque: "alto", buenas: ["fort", "ref"],
    habilidades: ["trepar", "artesania", "trato-animales", "sanar", "intimidar", ...con("dungeons", "geografia", "naturaleza"), "percepcion", "profesion", "montar", "conocimiento-conjuros", "sigilo", "supervivencia", "nadar"],
    rasgos: [
      { nivel: 1, nombre: "Enemigo predilecto", texto: "Elige un tipo de criatura: +2 a ataque y daño, y a Engañar, Conocimiento, Percepción, Averiguar intenciones y Supervivencia contra ella. Otro a nivel 5 (y uno sube +2)." },
      { nivel: 1, nombre: "Rastrear", texto: "+½ nivel (mínimo +1) a Supervivencia para seguir rastros." },
      { nivel: 1, nombre: "Empatía salvaje", texto: "Mejora la actitud de un animal como con Diplomacia: 1d20 + nivel + mod. de Car." },
      { nivel: 2, nombre: "Estilo de combate", texto: "Arquería o combate con dos armas: una dote del estilo sin cumplir requisitos." },
      { nivel: 3, nombre: "Aguante", texto: "Dote adicional: +4 a pruebas para resistir el cansancio; duerme con armadura intermedia." },
      { nivel: 3, nombre: "Terreno predilecto", texto: "Elige un terreno: +2 a iniciativa y a Conocimiento (geografía), Percepción, Sigilo y Supervivencia en él." },
      { nivel: 4, nombre: "Vínculo de cazador", texto: "Un compañero animal, o compartir con los aliados la mitad del bonificador de enemigo predilecto." },
      { nivel: 4, nombre: "Conjuros", texto: "Empieza a lanzar conjuros divinos (Sab)." },
      { nivel: 5, nombre: "Enemigo predilecto (2.º)", texto: "Un segundo enemigo predilecto; uno de los dos sube a +4." },
    ],
    magia: { lista: "ex", atributo: "sab", porDia: [[], [], [], [null, 0], [null, 1]] },
  },
  {
    clave: "picaro", nombre: "Pícaro", ingles: "Rogue", dg: 8, rangos: 8, ataque: "medio", buenas: ["ref"],
    habilidades: ["acrobacias", "tasacion", "enganar", "trepar", "artesania", "diplomacia", "inutilizar-mecanismo", "disfrazarse", "escapismo", "intimidar", ...con("dungeons", "local"), "linguistica", "percepcion", "interpretar", "profesion", "averiguar-intenciones", "juego-de-manos", "sigilo", "nadar", "usar-objeto-magico"],
    rasgos: [
      { nivel: 1, nombre: "Ataque furtivo +1d6", texto: "+1d6 al daño contra quien esté desprevenido, sin Des a la CA o flanqueado. +2d6 a nivel 3 y +3d6 a nivel 5." },
      { nivel: 1, nombre: "Encontrar trampas", texto: "+½ nivel (mínimo +1) a Percepción para encontrar trampas y a Inutilizar mecanismo; puede desactivar trampas mágicas." },
      { nivel: 2, nombre: "Evasión", texto: "Si supera Reflejos contra un efecto de mitad de daño, no recibe daño." },
      { nivel: 2, nombre: "Talento de pícaro", texto: "Elige un talento (otro a nivel 4)." },
      { nivel: 3, nombre: "Ataque furtivo +2d6", texto: "El ataque furtivo sube a 2d6." },
      { nivel: 3, nombre: "Sentido de las trampas +1", texto: "+1 a Reflejos y a la CA contra trampas." },
      { nivel: 4, nombre: "Talento de pícaro", texto: "Un segundo talento." },
      { nivel: 4, nombre: "Esquiva asombrosa", texto: "No queda desprevenido ni pierde la Des a la CA aunque le pillen por sorpresa." },
      { nivel: 5, nombre: "Ataque furtivo +3d6", texto: "El ataque furtivo sube a 3d6." },
    ],
  },
  {
    clave: "hechicero", nombre: "Hechicero", ingles: "Sorcerer", dg: 6, rangos: 2, ataque: "bajo", buenas: ["vol"],
    habilidades: ["tasacion", "enganar", "artesania", "volar", "intimidar", ...con("arcano"), "profesion", "conocimiento-conjuros", "usar-objeto-magico"],
    rasgos: [
      { nivel: 1, nombre: "Linaje", texto: "Elige un linaje: da una habilidad de clase extra, un poder a nivel 1 y otro a nivel 3, y un conjuro extra conocido a nivel 3." },
      { nivel: 1, nombre: "Trucos", texto: "Conjuros de nivel 0 que puede lanzar a voluntad." },
      { nivel: 1, nombre: "Prescindir de materiales", texto: "Dote adicional: no necesita componentes materiales baratos." },
      { nivel: 3, nombre: "Poder de linaje", texto: "Segundo poder de su linaje y un conjuro de linaje conocido." },
    ],
    magia: {
      lista: "ar", atributo: "car",
      porDia: [[null, 3], [null, 4], [null, 5], [null, 6, 3], [null, 6, 4]],
      conocidos: [[4, 2], [5, 2], [5, 3], [6, 3, 1], [6, 4, 2]],
    },
  },
  {
    clave: "mago", nombre: "Mago", ingles: "Wizard", dg: 6, rangos: 2, ataque: "bajo", buenas: ["vol"],
    habilidades: ["tasacion", "artesania", "volar", ...CONOCIMIENTOS, "linguistica", "profesion", "conocimiento-conjuros"],
    rasgos: [
      { nivel: 1, nombre: "Vínculo arcano", texto: "Un familiar o un objeto vinculado (que permite lanzar 1/día un conjuro de su libro sin prepararlo)." },
      { nivel: 1, nombre: "Escuela arcana", texto: "Especialista en una escuela (poderes y un conjuro extra al día de ella) a cambio de dos escuelas opuestas, o universalista." },
      { nivel: 1, nombre: "Trucos", texto: "Conjuros de nivel 0 que puede preparar y lanzar a voluntad." },
      { nivel: 1, nombre: "Escribir pergamino", texto: "Dote adicional: puede hacer pergaminos." },
      { nivel: 1, nombre: "Libro de conjuros", texto: "Empieza con todos los trucos y 3 + mod. de Int conjuros de nivel 1. Aprende 2 más por nivel." },
      { nivel: 5, nombre: "Dote adicional", texto: "Una dote metamágica, de creación o Dominio de conjuro." },
    ],
    magia: { lista: "ar", atributo: "int", porDia: [[3, 1], [4, 2], [4, 2, 1], [4, 3, 2], [4, 3, 2, 1]], extra: "+1 conjuro de su escuela por nivel de conjuro si es especialista." },
  },
];

export function claseDe(texto: unknown): Clase | undefined {
  if (typeof texto !== "string") return undefined;
  const t = texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (!t) return undefined;
  return CLASES.find((c) => t.startsWith(c.clave.slice(0, -1)) || t === c.ingles.toLowerCase());
}

export const ataqueBase = (c: Clase, nivel: number) =>
  c.ataque === "alto" ? nivel : c.ataque === "medio" ? Math.floor((nivel * 3) / 4) : Math.floor(nivel / 2);

export const salvacionBase = (c: Clase, s: Salvacion, nivel: number) =>
  c.buenas.includes(s) ? 2 + Math.floor(nivel / 2) : Math.floor(nivel / 3);

/** Conjuros adicionales por atributo alto (tabla de la p. 17 del Manual básico). */
export const adicionales = (mod: number, nivelConjuro: number) =>
  nivelConjuro === 0 || mod < nivelConjuro ? 0 : Math.floor((mod - nivelConjuro) / 4) + 1;
