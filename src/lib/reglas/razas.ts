import type { Atributo } from "../ficha";

/* Las 7 razas del Manual básico de Pathfinder 1e. Solo lo que va a la ficha:
   modificadores, tamaño, velocidad, rasgos e idiomas. Las bonificaciones a
   habilidades que siempre se aplican van en `habilidades` (claves de HABILIDADES);
   las que dependen de la situación se quedan en el texto del rasgo. */

export type Rasgo = { nombre: string; texto: string; nivel?: number };

export type Raza = {
  clave: string;
  nombre: string;
  ingles: string;
  mods: Partial<Record<Atributo, number>>;
  /** +2 a un atributo a elegir (humano, semielfo, semiorco). */
  libre?: boolean;
  tamano: "M" | "P";
  /** Velocidad base en pies. */
  velocidad: number;
  /** La armadura y la carga no reducen la velocidad (enano). */
  velocidadFija?: boolean;
  /** Bonificador racial a todas las salvaciones (mediano). */
  salvaciones?: number;
  habilidades?: Record<string, number>;
  rasgos: Rasgo[];
  idiomas: string;
};

const pequeno: Rasgo = {
  nombre: "Pequeño",
  texto: "+1 a la CA y a las tiradas de ataque, −1 a la BMC y la DMC, +4 a Sigilo (ya sumado).",
};

export const RAZAS: Raza[] = [
  {
    clave: "enano", nombre: "Enano", ingles: "Dwarf",
    mods: { con: 2, sab: 2, car: -2 }, tamano: "M", velocidad: 20, velocidadFija: true,
    rasgos: [
      { nombre: "Lento y firme", texto: "Velocidad 20 pies, que nunca se reduce por armadura ni carga." },
      { nombre: "Visión en la oscuridad", texto: "Ve en la oscuridad hasta 60 pies (en blanco y negro)." },
      { nombre: "Entrenamiento defensivo", texto: "+4 de esquiva a la CA contra monstruos del subtipo gigante." },
      { nombre: "Codicia", texto: "+2 a Tasación para saber el precio de objetos no mágicos con metales o gemas preciosas." },
      { nombre: "Odio", texto: "+1 a las tiradas de ataque contra humanoides de los subtipos orco y goblinoide." },
      { nombre: "Robusto", texto: "+2 a las salvaciones contra veneno, conjuros y aptitudes sortílegas." },
      { nombre: "Estabilidad", texto: "+4 a la DMC contra embestidas y derribos mientras esté de pie en el suelo." },
      { nombre: "Afinidad con la piedra", texto: "+2 a Percepción para notar trabajos de cantería inusuales (trampas, puertas ocultas). Tira automáticamente al pasar a 10 pies o menos." },
      { nombre: "Familiaridad con armas", texto: "Competente con hacha de batalla, pico pesado y martillo de guerra. Las armas «enanas» cuentan como marciales." },
    ],
    idiomas: "Común y enano. Adicionales (por Int alta): gigante, gnomo, goblin, orco, terrano e infracomún.",
  },
  {
    clave: "elfo", nombre: "Elfo", ingles: "Elf",
    mods: { des: 2, int: 2, con: -2 }, tamano: "M", velocidad: 30,
    habilidades: { percepcion: 2 },
    rasgos: [
      { nombre: "Visión en la penumbra", texto: "Ve el doble de lejos que un humano con poca luz." },
      { nombre: "Inmunidades élficas", texto: "Inmune a los efectos mágicos de sueño. +2 a las salvaciones contra encantamientos." },
      { nombre: "Magia élfica", texto: "+2 a las pruebas de nivel de lanzador para superar la resistencia a conjuros. +2 a Conocimiento de conjuros para identificar las propiedades de objetos mágicos." },
      { nombre: "Sentidos agudos", texto: "+2 a Percepción (ya sumado)." },
      { nombre: "Familiaridad con armas", texto: "Competente con arco largo y corto (también compuestos), espada larga y estoque. Las armas «élficas» cuentan como marciales." },
    ],
    idiomas: "Común y élfico. Adicionales: celestial, dracónico, gnoll, gnomo, goblin, orco y silvano.",
  },
  {
    clave: "gnomo", nombre: "Gnomo", ingles: "Gnome",
    mods: { con: 2, car: 2, fue: -2 }, tamano: "P", velocidad: 20,
    habilidades: { percepcion: 2, sigilo: 4 },
    rasgos: [
      pequeno,
      { nombre: "Visión en la penumbra", texto: "Ve el doble de lejos que un humano con poca luz." },
      { nombre: "Entrenamiento defensivo", texto: "+4 de esquiva a la CA contra monstruos del subtipo gigante." },
      { nombre: "Magia gnoma", texto: "+1 a la CD de sus conjuros de ilusión. Con Car 11 o más, 1/día cada uno: luces danzantes, sonido fantasmal, prestidigitación y hablar con los animales (nivel de lanzador = su nivel; CD 10 + nivel del conjuro + mod. de Car)." },
      { nombre: "Odio", texto: "+1 a las tiradas de ataque contra humanoides de los subtipos reptiliano y goblinoide." },
      { nombre: "Resistencia a las ilusiones", texto: "+2 a las salvaciones contra ilusiones." },
      { nombre: "Sentidos agudos", texto: "+2 a Percepción (ya sumado)." },
      { nombre: "Obsesivo", texto: "+2 a una habilidad de Artesanía o Profesión a elegir (súmalo en «Otros»)." },
      { nombre: "Familiaridad con armas", texto: "Las armas «gnomas» cuentan como marciales." },
    ],
    idiomas: "Común, gnomo y silvano. Adicionales: dracónico, enano, élfico, gigante, goblin y orco.",
  },
  {
    clave: "mediano", nombre: "Mediano", ingles: "Halfling",
    mods: { des: 2, car: 2, fue: -2 }, tamano: "P", velocidad: 20, salvaciones: 1,
    habilidades: { percepcion: 2, acrobacias: 2, trepar: 2, sigilo: 4 },
    rasgos: [
      pequeno,
      { nombre: "Valiente", texto: "+2 a las salvaciones contra miedo (se suma a la suerte del mediano)." },
      { nombre: "Suerte del mediano", texto: "+1 a todas las salvaciones (ya sumado)." },
      { nombre: "Sentidos agudos", texto: "+2 a Percepción (ya sumado)." },
      { nombre: "Pies ligeros", texto: "+2 a Acrobacias y Trepar (ya sumado)." },
      { nombre: "Familiaridad con armas", texto: "Competente con la honda. Las armas «medianas» cuentan como marciales." },
    ],
    idiomas: "Común y mediano. Adicionales: enano, élfico, gnomo y goblin.",
  },
  {
    clave: "semielfo", nombre: "Semielfo", ingles: "Half-elf",
    mods: {}, libre: true, tamano: "M", velocidad: 30,
    habilidades: { percepcion: 2 },
    rasgos: [
      { nombre: "Visión en la penumbra", texto: "Ve el doble de lejos que un humano con poca luz." },
      { nombre: "Adaptabilidad", texto: "Soltura con una habilidad como dote adicional a nivel 1." },
      { nombre: "Sangre élfica", texto: "Cuenta como elfo y como humano para todo lo que dependa de la raza." },
      { nombre: "Inmunidades élficas", texto: "Inmune a los efectos mágicos de sueño. +2 a las salvaciones contra encantamientos." },
      { nombre: "Sentidos agudos", texto: "+2 a Percepción (ya sumado)." },
      { nombre: "Multitalento", texto: "Elige dos clases predilectas: gana +1 PG o +1 rango al subir de nivel en cualquiera de ellas." },
    ],
    idiomas: "Común y élfico. Adicionales: cualquiera (salvo idiomas secretos).",
  },
  {
    clave: "semiorco", nombre: "Semiorco", ingles: "Half-orc",
    mods: {}, libre: true, tamano: "M", velocidad: 30,
    habilidades: { intimidar: 2 },
    rasgos: [
      { nombre: "Visión en la oscuridad", texto: "Ve en la oscuridad hasta 60 pies (en blanco y negro)." },
      { nombre: "Intimidante", texto: "+2 a Intimidar (ya sumado)." },
      { nombre: "Sangre orca", texto: "Cuenta como orco y como humano para todo lo que dependa de la raza." },
      { nombre: "Ferocidad orca", texto: "1/día, al bajar de 0 PG sin morir, puede seguir luchando un asalto más como si estuviera incapacitado." },
      { nombre: "Familiaridad con armas", texto: "Competente con gran hacha y alfanjón. Las armas «orcas» cuentan como marciales." },
    ],
    idiomas: "Común y orco. Adicionales: abisal, dracónico, gigante, gnoll y goblin.",
  },
  {
    clave: "humano", nombre: "Humano", ingles: "Human",
    mods: {}, libre: true, tamano: "M", velocidad: 30,
    rasgos: [
      { nombre: "Dote adicional", texto: "Una dote más a nivel 1." },
      { nombre: "Hábil", texto: "+1 rango de habilidad por nivel." },
    ],
    idiomas: "Común. Adicionales: cualquiera (salvo idiomas secretos).",
  },
];

/** Busca la raza por lo escrito en la ficha ("Semielfa", "gnomo"…). */
export function razaDe(texto: unknown): Raza | undefined {
  if (typeof texto !== "string") return undefined;
  const t = texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (!t) return undefined;
  return RAZAS.find((r) => t.startsWith(r.clave.slice(0, -1)) || t === r.ingles.toLowerCase());
}
