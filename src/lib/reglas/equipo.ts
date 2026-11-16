/* Equipo del Manual básico de Pathfinder 1e: armas (sencillas, marciales y
   exóticas), armaduras y escudos, propiedades mágicas de bonificador +1 y +2
   (más las de precio fijo baratas) y objetos maravillosos de NL 7 o menos.
   Medidas en pies y libras. Precios en po. Para dárselo a los jugadores (petate)
   y a los PNJ (mesa de combate). */

export type Competencia = "sencilla" | "marcial" | "exótica";
export type Arma = {
  clave: string; nombre: string; ingles: string; competencia: Competencia;
  /** ligera, una mano, dos manos, distancia o munición */
  uso: string;
  precio: number; danoP: string; danoM: string; critico: string;
  /** Incremento de distancia en pies (0 = cuerpo a cuerpo sin arrojar). */
  distancia: number; peso: number; tipo: string; especial: string;
};
export type Armadura = {
  clave: string; nombre: string; ingles: string; clase: "ligera" | "intermedia" | "pesada" | "escudo";
  precio: number; bono: number; desMax: number | null; penal: number; fallo: number;
  /** Velocidad con ella puesta (30 / 20 pies). Vacío = no la reduce. */
  velocidad: string; peso: number;
};
export type Propiedad = {
  clave: string; nombre: string; ingles: string; para: "arma" | "distancia" | "cuerpo" | "armadura" | "escudo" | "defensa";
  /** Bonificador equivalente (+1, +2) o 0 si tiene precio fijo. */
  bono: number; precio: number; texto: string;
};
export type Maravilloso = { clave: string; nombre: string; ingles: string; ranura: string; nl: number; precio: number; texto: string };

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const filas = (datos: string) => datos.trim().split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.split("|"));
const n = (s: string) => Number(s.replace(",", "."));

/* ------------------------------------------------------------------ armas -- */
// nombre | inglés | competencia s/m/e | uso | precio | daño P | daño M | crítico | distancia | peso | tipo | especial
const ARMAS_DATOS = `
Guantelete|Gauntlet|s|desarmado|2|1d2|1d3|×2|0|1|C|
Daga|Dagger|s|ligera|2|1d3|1d4|19–20/×2|10|1|P o Cr|
Daga de puño|Punching dagger|s|ligera|2|1d3|1d4|×3|0|1|P|
Guantelete con pinchos|Spiked gauntlet|s|ligera|5|1d3|1d4|×2|0|1|P|
Maza ligera|Light mace|s|ligera|5|1d4|1d6|×2|0|4|C|
Hoz|Sickle|s|ligera|6|1d4|1d6|×2|0|2|Cr|derribo
Clava|Club|s|una mano|0|1d4|1d6|×2|10|3|C|
Maza pesada|Heavy mace|s|una mano|12|1d6|1d8|×2|0|8|C|
Lucero del alba|Morningstar|s|una mano|8|1d6|1d8|×2|0|6|C y P|
Lanza corta|Shortspear|s|una mano|1|1d4|1d6|×2|20|3|P|
Lanza larga|Longspear|s|dos manos|5|1d6|1d8|×3|0|9|P|preparada, alcance
Bastón|Quarterstaff|s|dos manos|0|1d4/1d4|1d6/1d6|×2|0|4|C|doble, monje
Lanza|Spear|s|dos manos|2|1d6|1d8|×3|20|6|P|preparada
Cerbatana|Blowgun|s|distancia|2|1|1d2|×2|20|1|P|
Ballesta ligera|Light crossbow|s|distancia|35|1d6|1d8|19–20/×2|80|4|P|
Ballesta pesada|Heavy crossbow|s|distancia|50|1d8|1d10|19–20/×2|120|8|P|
Dardo|Dart|s|distancia|0,5|1d3|1d4|×2|20|0,5|P|
Jabalina|Javelin|s|distancia|1|1d4|1d6|×2|30|2|P|
Honda|Sling|s|distancia|0|1d3|1d4|×2|50|0|C|
Hacha arrojadiza|Throwing axe|m|ligera|8|1d4|1d6|×2|10|2|Cr|
Martillo ligero|Light hammer|m|ligera|1|1d3|1d4|×2|20|2|C|
Hacha de mano|Handaxe|m|ligera|6|1d4|1d6|×3|0|3|Cr|
Kukri|Kukri|m|ligera|8|1d3|1d4|18–20/×2|0|2|Cr|
Pico ligero|Light pick|m|ligera|4|1d3|1d4|×4|0|3|P|
Cachiporra|Sap|m|ligera|1|1d4|1d6|×2|0|2|C|no letal
Espada corta|Short sword|m|ligera|10|1d4|1d6|19–20/×2|0|2|P|
Estrella arrojadiza|Starknife|m|ligera|24|1d3|1d4|×3|20|3|P|
Hacha de batalla|Battleaxe|m|una mano|10|1d6|1d8|×3|0|6|Cr|
Mangual|Flail|m|una mano|8|1d6|1d8|×2|0|5|C|desarme, derribo
Espada larga|Longsword|m|una mano|15|1d6|1d8|19–20/×2|0|4|Cr|
Pico pesado|Heavy pick|m|una mano|8|1d4|1d6|×4|0|6|P|
Estoque|Rapier|m|una mano|20|1d4|1d6|18–20/×2|0|2|P|sutileza
Cimitarra|Scimitar|m|una mano|15|1d4|1d6|18–20/×2|0|4|Cr|
Tridente|Trident|m|una mano|15|1d6|1d8|×2|10|4|P|preparada
Martillo de guerra|Warhammer|m|una mano|12|1d6|1d8|×3|0|5|C|
Alfanjón|Falchion|m|dos manos|75|1d6|2d4|18–20/×2|0|8|Cr|
Bisarma|Glaive|m|dos manos|8|1d8|1d10|×3|0|10|Cr|alcance
Gran hacha|Greataxe|m|dos manos|20|1d10|1d12|×3|0|12|Cr|
Gran clava|Greatclub|m|dos manos|5|1d8|1d10|×2|0|8|C|
Mangual pesado|Heavy flail|m|dos manos|15|1d8|1d10|19–20/×2|0|10|C|desarme, derribo
Espadón|Greatsword|m|dos manos|50|1d10|2d6|19–20/×2|0|8|Cr|
Guja|Guisarme|m|dos manos|9|1d6|2d4|×3|0|12|Cr|alcance, derribo
Alabarda|Halberd|m|dos manos|10|1d8|1d10|×3|0|12|P o Cr|preparada, derribo
Lanza de caballería|Lance|m|dos manos|10|1d6|1d8|×3|0|10|P|alcance; doble daño a la carga a caballo
Roncona|Ranseur|m|dos manos|10|1d6|2d4|×3|0|12|P|desarme, alcance
Guadaña|Scythe|m|dos manos|18|1d6|2d4|×4|0|10|P o Cr|derribo
Arco corto|Shortbow|m|distancia|30|1d4|1d6|×3|60|2|P|
Arco corto compuesto|Composite shortbow|m|distancia|75|1d4|1d6|×3|70|2|P|+75 po por cada punto de Fue que suma al daño
Arco largo|Longbow|m|distancia|75|1d6|1d8|×3|100|3|P|
Arco largo compuesto|Composite longbow|m|distancia|100|1d6|1d8|×3|110|3|P|+100 po por cada punto de Fue que suma al daño
Kama|Kama|e|ligera|2|1d4|1d6|×2|0|2|Cr|monje, derribo
Nunchaku|Nunchaku|e|ligera|2|1d4|1d6|×2|0|2|C|desarme, monje
Sai|Sai|e|ligera|1|1d3|1d4|×2|0|1|C|desarme, monje
Siangham|Siangham|e|ligera|3|1d4|1d6|×2|0|1|P|monje
Espada bastarda|Bastard sword|e|una mano|35|1d8|1d10|19–20/×2|0|6|Cr|a dos manos es marcial
Hacha de guerra enana|Dwarven waraxe|e|una mano|30|1d8|1d10|×3|0|8|Cr|a dos manos es marcial
Látigo|Whip|e|una mano|1|1d2|1d3|×2|0|2|Cr|desarme, no letal, alcance 15 pies, derribo
Hacha doble orca|Orc double axe|e|dos manos|60|1d6/1d6|1d8/1d8|×3|0|15|Cr|doble
Cadena armada|Spiked chain|e|dos manos|25|1d6|2d4|×2|0|10|P|desarme, derribo, sutileza
Espada curva élfica|Elven curve blade|e|dos manos|80|1d8|1d10|18–20/×2|0|7|Cr|sutileza
Mangual terrible|Dire flail|e|dos manos|90|1d6/1d6|1d8/1d8|×2|0|10|C|desarme, doble, derribo
Martillo ganchudo gnomo|Gnome hooked hammer|e|dos manos|20|1d6/1d4|1d8/1d6|×3/×4|0|6|C y P|doble, derribo
Espada de dos hojas|Two-bladed sword|e|dos manos|100|1d6/1d6|1d8/1d8|19–20/×2|0|10|Cr|doble
Urgrosh enano|Dwarven urgrosh|e|dos manos|50|1d6/1d4|1d8/1d6|×3|0|12|Cr o P|preparada, doble
Boleadoras|Bolas|e|distancia|5|1d3|1d4|×2|10|2|C|no letal, derribo
Ballesta de mano|Hand crossbow|e|distancia|100|1d3|1d4|19–20/×2|30|2|P|
Ballesta ligera de repetición|Light repeating crossbow|e|distancia|250|1d6|1d8|19–20/×2|80|6|P|5 virotes
Ballesta pesada de repetición|Heavy repeating crossbow|e|distancia|400|1d8|1d10|19–20/×2|120|12|P|5 virotes
Red|Net|e|distancia|20|—|—|—|10|6|—|enreda (ataque de toque a distancia)
Shuriken (5)|Shuriken|e|distancia|1|1|1d2|×2|10|0,5|P|monje
Honda bastón mediana|Halfling sling staff|e|distancia|20|1d6|1d8|×3|80|3|C|
Flechas (20)|Arrows|s|munición|1|—|—|—|0|3|—|
Virotes (10)|Crossbow bolts|s|munición|1|—|—|—|0|1|—|
Balas de honda (10)|Sling bullets|s|munición|0,1|—|—|—|0|5|—|
Dardos de cerbatana (10)|Blowgun darts|s|munición|0,05|—|—|—|0|0|—|
`;

const COMP: Record<string, Competencia> = { s: "sencilla", m: "marcial", e: "exótica" };
export const ARMAS: Arma[] = filas(ARMAS_DATOS).map(([nombre, ingles, c, uso, precio, danoP, danoM, critico, distancia, peso, tipo, especial]) => ({
  clave: slug(nombre), nombre, ingles, competencia: COMP[c], uso, precio: n(precio), danoP, danoM, critico,
  distancia: n(distancia), peso: n(peso), tipo, especial: especial ?? "",
}));

/* ------------------------------------------------------ armaduras y escudos -- */
// nombre | inglés | clase | precio | bono | Des máx. | penalizador | fallo % | velocidad | peso
const ARMADURAS_DATOS = `
Acolchada|Padded|ligera|5|1|8|0|5||10
De cuero|Leather|ligera|10|2|6|0|10||15
De cuero tachonado|Studded leather|ligera|25|3|5|-1|15||20
Camisote de mallas|Chain shirt|ligera|100|4|4|-2|20||25
De pieles|Hide|intermedia|15|4|4|-3|20|20/15|25
Cota de escamas|Scale mail|intermedia|50|5|3|-4|25|20/15|30
Cota de mallas|Chainmail|intermedia|150|6|2|-5|30|20/15|40
Coraza|Breastplate|intermedia|200|6|3|-4|25|20/15|30
Cota de bandas|Splint mail|pesada|200|7|0|-7|40|20/15|45
Armadura de bandas|Banded mail|pesada|250|7|1|-6|35|20/15|35
Media armadura|Half-plate|pesada|600|8|0|-7|40|20/15|50
Armadura completa|Full plate|pesada|1500|9|1|-6|35|20/15|50
Rodela|Buckler|escudo|5|1||-1|5||5
Escudo ligero de madera|Light wooden shield|escudo|3|1||-1|5||5
Escudo ligero de acero|Light steel shield|escudo|9|1||-1|5||6
Escudo pesado de madera|Heavy wooden shield|escudo|7|2||-2|15||10
Escudo pesado de acero|Heavy steel shield|escudo|20|2||-2|15||15
Escudo pavés|Tower shield|escudo|30|4|2|-10|50||45
`;

export const ARMADURAS: Armadura[] = filas(ARMADURAS_DATOS).map(([nombre, ingles, clase, precio, bono, desMax, penal, fallo, velocidad, peso]) => ({
  clave: slug(nombre), nombre, ingles, clase: clase as Armadura["clase"], precio: n(precio), bono: n(bono),
  desMax: desMax === "" ? null : n(desMax), penal: n(penal), fallo: n(fallo), velocidad, peso: n(peso),
}));

/* ------------------------------------------------------ propiedades mágicas -- */
// nombre | inglés | para | bono (o 0) | precio fijo | efecto
const PROPIEDADES_DATOS = `
Perdición|Bane|arma|1|0|Contra un tipo de criatura elegido: +2 más de mejora y +2d6 al daño.
Defensora|Defending|cuerpo|1|0|Pasa parte de su bonificador de mejora a tu CA cada asalto.
Distancia|Distance|distancia|1|0|Duplica el incremento de distancia.
Llameante|Flaming|arma|1|0|+1d6 de fuego al acertar (se activa a voluntad).
Gélida|Frost|arma|1|0|+1d6 de frío al acertar.
Electrizante|Shock|arma|1|0|+1d6 de electricidad al acertar.
Toque fantasmal|Ghost touch|arma|1|0|Golpea con normalidad a las criaturas incorpóreas.
Afilada|Keen|cuerpo|1|0|Duplica el rango de amenaza (solo armas cortantes o perforantes).
Foco de ki|Ki focus|cuerpo|1|0|El monje puede usar sus ataques de ki a través del arma.
Misericordiosa|Merciful|arma|1|0|+1d6 al daño, pero todo el daño es no letal (se puede desactivar).
Hendedora poderosa|Mighty cleaving|cuerpo|1|0|Con Hendedura, un ataque más contra otro adyacente.
Retornante|Returning|distancia|1|0|Un arma arrojadiza vuelve a tu mano.
Buscadora|Seeking|distancia|1|0|Ignora la ocultación (no la total).
Almacenaconjuros|Spell storing|cuerpo|1|0|Guarda un conjuro de hasta nivel 3 que se lanza al acertar.
Arrojadiza|Throwing|cuerpo|1|0|El arma de cuerpo a cuerpo se puede arrojar (10 pies).
Atronadora|Thundering|arma|1|0|En crítico, +1d8 sónico y ensordece. Fort CD 14 niega la sordera.
Despiadada|Vicious|cuerpo|1|0|+2d6 al daño, pero tú recibes 1d6.
Anárquica|Anarchic|arma|2|0|Caótica: +2d6 contra criaturas legales.
Axiomática|Axiomatic|arma|2|0|Legal: +2d6 contra criaturas caóticas.
Sagrada|Holy|arma|2|0|Buena: +2d6 contra criaturas malignas.
Sacrílega|Unholy|arma|2|0|Maligna: +2d6 contra criaturas buenas.
Disruptiva|Disruption|cuerpo|2|0|Contundente: un muerto viviente golpeado salva Vol CD 14 o queda destruido.
Estallido llameante|Flaming burst|arma|2|0|Como llameante; en crítico, +1d10 de fuego más por multiplicador.
Estallido gélido|Icy burst|arma|2|0|Como gélida; en crítico, +1d10 de frío más por multiplicador.
Estallido electrizante|Shocking burst|arma|2|0|Como electrizante; en crítico, +1d10 de electricidad más por multiplicador.
Hiriente|Wounding|arma|2|0|Cada golpe causa 1 de desangramiento.
Fortificación ligera|Light fortification|defensa|1|0|25 % de anular un crítico o un ataque furtivo.
Atrapaflechas|Arrow catching|escudo|1|0|Atrae los proyectiles hacia el escudo: +1 a la CA contra ataques a distancia.
Golpeadora|Bashing|escudo|1|0|Golpear con el escudo hace daño como si fuera dos tamaños mayor, +1 al ataque y al daño.
Cegadora|Blinding|escudo|1|0|2/día, destello: ciega 1d4 asaltos a quien esté a 20 pies (Ref CD 14 niega).
Animada|Animated|escudo|2|0|El escudo flota y te protege sin ocupar la mano.
Desviaflechas|Arrow deflection|escudo|2|0|Como Desviar flechas, una vez por asalto.
Resistencia a conjuros 13|Spell resistance (13)|armadura|2|0|RC 13.
Disimulada|Glamered|armadura|0|2700|A voluntad parece ropa normal.
Sombría|Shadow|armadura|0|3750|+5 a Sigilo.
Resbaladiza|Slick|armadura|0|3750|+5 a Escapismo.
Resistencia a la energía|Energy resistance|defensa|0|18000|Resistencia 10 a un tipo de energía.
`;

export const PROPIEDADES: Propiedad[] = filas(PROPIEDADES_DATOS).map(([nombre, ingles, para, bono, precio, texto]) => ({
  clave: slug(nombre), nombre, ingles, para: para as Propiedad["para"], bono: n(bono), precio: n(precio), texto,
}));

/* ---------------------------------------------- objetos maravillosos ≤ NL 7 -- */
// nombre | inglés | ranura | NL | precio | efecto
const MARAVILLOSOS_DATOS = `
Antorcha eterna|Everburning torch|—|3|110|Una antorcha con llama continua: da luz sin calor ni consumirse.
Ungüento de intemporalidad|Unguent of timelessness|—|3|150|Un objeto o cadáver untado no envejece ni se pudre durante años.
Elixir de amor|Elixir of love|—|4|150|Quien lo bebe queda hechizado por la primera criatura que vea (1d3 h). Vol CD 14.
Polvo sin rastro|Dust of tracelessness|—|3|250|Borra las huellas de hasta 12 personas en una zona.
Elixir de ocultación|Elixir of hiding|—|5|250|+10 a Sigilo durante 1 hora.
Elixir de sigilo|Elixir of sneaking|—|5|250|+10 a Sigilo para moverse en silencio durante 1 hora.
Elixir de acrobacias|Elixir of tumbling|—|5|250|+10 a Acrobacias durante 1 hora.
Elixir de natación|Elixir of swimming|—|2|250|+10 a Nadar durante 1 hora.
Elixir de visión|Elixir of vision|—|2|250|+10 a Percepción durante 1 hora.
Elixir de la verdad|Elixir of truth|—|5|500|Quien lo bebe no puede mentir a sabiendas durante 10 min. Vol CD 13.
Aceite plateado|Silversheen|—|5|750|Recubre un arma: cuenta como de plata alquímica durante 1 hora.
Mano del mago|Hand of the mage|cuello|2|900|Mano momificada que lanza mano de mago a voluntad.
Filacteria de la fe|Phylactery of faithfulness|cabeza|1|1000|Avisa antes de un acto que iría contra tu alineamiento o tu fe.
Ungüento deslizante|Salve of slipperiness|—|6|1000|Quien se unta es casi imposible de atrapar: +20 a Escapismo y a la DMC contra presas (8 h).
Capa de resistencia +1|Cloak of resistance +1|hombros|5|1000|+1 de resistencia a todas las salvaciones.
Brazales de armadura +1|Bracers of armor +1|muñecas|7|1000|+1 de armadura a la CA (no se suma a otra armadura).
Gafas de visión diminuta|Goggles of minute seeing|ojos|3|1250|+5 a Percepción para ver detalles a menos de 1 pie.
Polvo de ilusión|Dust of illusion|—|6|1200|Disfraza a una criatura como con disfrazarse (2 h).
Pipas de las cloacas|Pipes of the sewers|—|2|1150|Convocan y controlan ratas.
Broche escudo|Brooch of shielding|cuello|1|1500|Absorbe hasta 101 puntos de proyectiles mágicos.
Jabalina del relámpago|Javelin of lightning|—|5|1500|Al lanzarla se convierte en un relámpago de 5d6 (Ref CD 14 mitad). Un uso.
Sombrero del disfraz|Hat of disguise|cabeza|1|1800|Disfrazarse a voluntad.
Polvo de aparición|Dust of appearance|—|5|1800|Revela lo invisible, desplazado o difuminado en un radio de 10 pies (5 min).
Pipas del sonido|Pipes of sounding|—|2|1800|Sonido fantasmal a voluntad.
Amuleto de armadura natural +1|Amulet of natural armor +1|cuello|5|2000|+1 de armadura natural a la CA.
Cuerno de niebla|Horn of fog|—|3|2000|Hace salir niebla como nube de niebla.
Botas élficas|Boots of elvenkind|pies|5|2500|+5 a Acrobacias.
Capa élfica|Cloak of elvenkind|hombros|5|2500|Con la capucha puesta, +5 a Sigilo.
Ojos de águila|Eyes of the eagle|ojos|3|2500|+5 a Percepción.
Botas de las tierras invernales|Boots of the winterlands|pies|5|2500|Sin penalización por nieve ni hielo; soportar los elementos contra el frío.
Yelmo de comprensión|Helm of comprehend languages and read magic|cabeza|4|2600|Comprensión idiomática y leer magia a voluntad.
Piedra de alarma|Stone of alarm|—|3|2700|Grita si alguien la toca o abre lo que protege.
Herraduras de velocidad|Horseshoes of speed|pies|3|3000|+30 pies a la velocidad de la montura.
Cuerda de trepar|Rope of climbing|—|3|3000|Cuerda de 60 pies que se mueve y se ata sola.
Polvo de desaparición|Dust of disappearance|—|7|3500|Invisibilidad mayor durante 2d6 asaltos, que no se disipa.
Figurilla del cuervo de plata|Figurine of wondrous power (silver raven)|—|2|3800|Se convierte en un cuervo que lleva mensajes (mensajero animal).
Brazales de armadura +2|Bracers of armor +2|muñecas|7|4000|+2 de armadura a la CA.
Capa de resistencia +2|Cloak of resistance +2|hombros|5|4000|+2 de resistencia a todas las salvaciones.
Guantes atrapaflechas|Gloves of arrow snaring|manos|3|4000|Dos veces al día atrapas un proyectil como con Agarrar flechas.
Periapto contra el veneno|Periapt of proof against poison|cuello|5|4000|Inmune al veneno.
Ungüento reparador|Restorative ointment|—|5|4000|Cinco usos: neutralizar veneno, quitar enfermedad o curar 5d8+5.
Diadema de persuasión|Circlet of persuasion|cabeza|5|4500|+3 a las pruebas basadas en Carisma.
Zapatillas de trepar cual arácnido|Slippers of spider climbing|pies|4|4800|Trepar cual arácnido 10 minutos al día.
Incienso de meditación|Incense of meditation|—|7|4900|Un lanzador divino que medite con él lanza sus conjuros maximizados al día siguiente.
Amuleto de puños poderosos +1|Amulet of mighty fists +1|cuello|5|5000|+1 a ataque y daño con armas naturales y sin armas.
Brazales de arquería menores|Bracers of archery, lesser|muñecas|4|5000|Competencia con arcos y +1 a ataque y daño con ellos.
Chaleco de huida|Vest of escape|pecho|4|5200|+4 a Inutilizar mecanismo para abrir cerraduras y +6 a Escapismo.
Botella humeante|Ever-smoking bottle|—|3|5400|Suelta humo que llena 50 pies por asalto.
Cuchara del sustento|Sustaining spoon|—|5|5400|Llena un cuenco de gachas que alimentan a 4 personas al día.
Botas de zancadas y saltos|Boots of striding and springing|pies|3|5500|+10 pies a la velocidad y +5 a Acrobacias para saltar.
Abanico del viento|Wind fan|—|5|5500|Ráfaga de viento una vez al día.
Herraduras del céfiro|Horseshoes of a zephyr|pies|3|6000|La montura camina sobre agua, barro o arena sin dejar rastro.
Pipas del acecho|Pipes of haunting|—|4|6000|Música inquietante: asustar a los que la oigan (Vol CD 13).
Guantes de nadar y trepar|Gloves of swimming and climbing|manos|5|6250|+5 a Nadar y Trepar.
Cuerno del bien / del mal|Horn of goodness/evil|—|6|6500|Círculo mágico contra el mal (o el bien) una vez al día.
Barca plegable|Folding boat|—|6|7200|Una caja que se convierte en bote o en barca.
Botella de aire|Bottle of air|—|7|7250|Da aire para respirar en cualquier sitio.
Arpa del encantamiento|Harp of charming|—|7|7500|Tocándola: sugestión una vez cada 10 min (Vol CD 14).
Botas de levitación|Boots of levitation|pies|3|7500|Levitar a voluntad.
Periapto de salud|Periapt of health|cuello|5|7500|Inmune a las enfermedades.
Mano de gloria|Hand of glory|cuello|5|8000|Luz del día y ver lo invisible una vez al día.
Amuleto de armadura natural +2|Amulet of natural armor +2|cuello|5|8000|+2 de armadura natural a la CA.
Brazales de armadura +3|Bracers of armor +3|muñecas|7|9000|+3 de armadura a la CA.
Capa de resistencia +3|Cloak of resistance +3|hombros|5|9000|+3 de resistencia a todas las salvaciones.
Collar de adaptación|Necklace of adaptation|cuello|7|9000|Respiras en cualquier sitio y eres inmune a los gases.
Guante de almacenaje|Glove of storing|manos|6|10000|Guarda un objeto de hasta 20 libras y lo saca a voluntad.
Guantelete de herrumbre|Gauntlet of rust|manos|7|11500|Toque de herrumbre como un monstruo corrosivo; inmune a la herrumbre.
Medallón de los pensamientos|Medallion of thoughts|cuello|5|12000|Detectar pensamientos a voluntad.
Gafas de noche|Goggles of night|ojos|3|12000|Visión en la oscuridad de 60 pies.
Gema de brillo|Gem of brightness|—|6|13000|Haz de luz o destello cegador (Fort CD 14).
Lira de construcción|Lyre of building|—|6|13000|Hace el trabajo de cien obreros mientras suena.
Capa de arácnido|Cloak of arachnida|hombros|6|14000|Trepar cual arácnido, inmune a las telarañas y +2 contra veneno de araña.
Vaina de filo agudo|Scabbard of keen edges|cinturón|5|16000|Afilar sobre el arma que guarda, 3 veces al día.
Brazales de armadura +4|Bracers of armor +4|muñecas|7|16000|+4 de armadura a la CA.
Capa de resistencia +4|Cloak of resistance +4|hombros|5|16000|+4 de resistencia a todas las salvaciones.
Amuleto de armadura natural +3|Amulet of natural armor +3|cuello|5|18000|+3 de armadura natural a la CA.
Piedra de la buena suerte|Stone of good luck (luckstone)|—|5|20000|+1 de suerte a salvaciones, pruebas de habilidad y de característica.
Capa de desplazamiento menor|Cloak of displacement, minor|hombros|3|24000|20 % de fallo contra ti (difuminar continuo).
Yelmo de acción submarina|Helm of underwater action|cabeza|5|24000|Ves bajo el agua y respiras gracias a burbujas de aire.
Capa del murciélago|Cloak of the bat|hombros|7|26000|+5 a Sigilo; vuelas con ella o te conviertes en murciélago.
Linterna reveladora|Lantern of revealing|—|5|30000|Su luz hace visibles a los invisibles en 25 pies.
Ojos hechizadores|Eyes of charming|ojos|7|56000|Hechizar persona con la mirada (Vol CD 16).
`;

export const MARAVILLOSOS: Maravilloso[] = filas(MARAVILLOSOS_DATOS).map(([nombre, ingles, ranura, nl, precio, texto]) => ({
  clave: slug(nombre), nombre, ingles, ranura, nl: n(nl), precio: n(precio), texto,
}));

/* --------------------------------------------------------------- utilidades -- */

export const po = (x: number) => `${x.toLocaleString("es-ES", { maximumFractionDigits: 2 })} po`;
const peso = (x: number) => (x ? `${x.toLocaleString("es-ES")} ${x === 1 ? "libra" : "libras"}` : "");

export type Calidad = "normal" | "gc" | 1 | 2;
export type ArmaElegida = { arma: Arma; calidad: Calidad; props: Propiedad[]; pequeno: boolean };
export type ArmaduraElegida = { armadura: Armadura; calidad: Calidad; props: Propiedad[] };

/** Propiedades que admite un arma (cuerpo a cuerpo o a distancia) o una armadura / escudo. */
export function propiedadesPara(cosa: Arma | Armadura): Propiedad[] {
  if ("danoM" in cosa) {
    const dist = cosa.uso === "distancia" || cosa.uso === "munición";
    return PROPIEDADES.filter((p) => p.para === "arma" || (p.para === "cuerpo" && !dist) || (p.para === "distancia" && (dist || cosa.distancia > 0)));
  }
  const escudo = cosa.clase === "escudo";
  return PROPIEDADES.filter((p) => p.para === "defensa" || (p.para === "escudo" && escudo) || (p.para === "armadura" && !escudo));
}

const bonoTotal = (calidad: Calidad, props: Propiedad[]) =>
  typeof calidad === "number" ? calidad + props.reduce((s, p) => s + p.bono, 0) : 0;

function nombreMagico(base: string, calidad: Calidad, props: Propiedad[]) {
  if (calidad === "normal") return base;
  if (calidad === "gc") return `${base} de gran calidad`;
  return `${base} +${calidad}${props.length ? ` ${props.map((p) => p.nombre.toLowerCase()).join(", ")}` : ""}`;
}

/** Nombre, precio y notas de un arma (para el petate o el PNJ). */
export function describirArma({ arma, calidad, props, pequeno }: ArmaElegida) {
  const ps = typeof calidad === "number" ? props : [];
  const b = bonoTotal(calidad, ps);
  const precio = arma.precio + (calidad === "normal" ? 0 : 300) + 2000 * b * b + ps.reduce((s, p) => s + p.precio, 0);
  const dano = pequeno ? arma.danoP : arma.danoM;
  const partes = [
    dano !== "—" ? `${dano}${typeof calidad === "number" ? `+${calidad}` : ""}${pequeno ? " (Pequeño)" : ""}` : "",
    arma.critico !== "—" ? arma.critico : "",
    arma.tipo !== "—" ? arma.tipo : "",
    arma.distancia ? `${arma.distancia} pies` : "",
    arma.especial,
    calidad === "gc" ? "+1 al ataque" : typeof calidad === "number" ? `+${calidad} a ataque y daño` : "",
    ...ps.map((p) => `${p.nombre}: ${p.texto}`),
    `${arma.competencia}, ${arma.uso}`,
    peso(arma.peso),
    `${po(precio)} (${arma.ingles})`,
  ].filter(Boolean);
  return { nombre: nombreMagico(arma.nombre, calidad, ps), notas: partes.join(" · "), precio, corto: `${nombreMagico(arma.nombre, calidad, ps)} (${[dano, arma.critico].filter((x) => x && x !== "—").join(", ")})` };
}

export function describirArmadura({ armadura, calidad, props }: ArmaduraElegida) {
  const ps = typeof calidad === "number" ? props : [];
  const b = bonoTotal(calidad, ps);
  const precio = armadura.precio + (calidad === "normal" ? 0 : 150) + 1000 * b * b + ps.reduce((s, p) => s + p.precio, 0);
  const ca = armadura.bono + (typeof calidad === "number" ? calidad : 0);
  const penal = calidad === "normal" ? armadura.penal : Math.min(0, armadura.penal + 1);
  const escudo = armadura.clase === "escudo";
  const partes = [
    `+${ca} a la CA (${escudo ? "escudo" : "armadura"})`,
    armadura.desMax !== null ? `Des máx. +${armadura.desMax}` : "",
    penal ? `penalizador −${Math.abs(penal)}` : "",
    `fallo de conjuros ${armadura.fallo} %`,
    armadura.velocidad ? `velocidad ${armadura.velocidad} pies` : "",
    ...ps.map((p) => `${p.nombre}: ${p.texto}`),
    escudo ? "" : `armadura ${armadura.clase}`,
    peso(armadura.peso),
    `${po(precio)} (${armadura.ingles})`,
  ].filter(Boolean);
  return { nombre: nombreMagico(armadura.nombre, calidad, ps), notas: partes.join(" · "), precio, corto: `${nombreMagico(armadura.nombre, calidad, ps)} (+${ca} CA${penal ? `, −${Math.abs(penal)}` : ""})` };
}

export function describirMaravilloso(m: Maravilloso) {
  return {
    nombre: m.nombre,
    notas: [m.texto, m.ranura !== "—" ? `ranura: ${m.ranura}` : "sin ranura", `NL ${m.nl}`, `${po(m.precio)} (${m.ingles})`].join(" · "),
    precio: m.precio,
    corto: m.nombre,
  };
}
