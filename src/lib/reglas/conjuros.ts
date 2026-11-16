import type { ListaConjuros } from "./clases";

/* Conjuros del Manual básico de Pathfinder 1e, de nivel 0 a 3 (la campaña acaba
   en nivel 5). Resumen de una línea: para la ficha y para buscar el conjuro
   completo por su nombre inglés en d20pfsrd.
   Listas: ar = hechicero/mago, br = bardo, cl = clérigo, dr = druida,
   pa = paladín, ex = explorador. "ar1 cl2" = nivel 1 de mago, 2 de clérigo. */

export type Conjuro = { clave: string; nombre: string; ingles: string; escuela: string; niveles: Partial<Record<ListaConjuros, number>>; texto: string };

const ESCUELAS: Record<string, string> = {
  abj: "Abjuración", adv: "Adivinación", con: "Conjuración", enc: "Encantamiento",
  evo: "Evocación", ilu: "Ilusión", nig: "Nigromancia", tra: "Transmutación", uni: "Universal",
};

// nombre | inglés | escuela | listas | resumen
const DATOS = `
Salpicadura de ácido|Acid Splash|con|ar0|Orbe de ácido: 1d3 de daño por ácido (ataque de toque a distancia).
Marca arcana|Arcane Mark|uni|ar0|Inscribe tu runa personal, visible o invisible, en un objeto o criatura.
Desangrar|Bleed|nig|ar0 cl0|Una criatura estabilizada vuelve a desangrarse y pierde 1 PG. Vol niega.
Luces danzantes|Dancing Lights|evo|ar0 br0|Hasta 4 luces como antorchas que mueves a voluntad (1 min).
Aturdir|Daze|enc|ar0 br0|Un humanoide de 4 DG o menos pierde su siguiente acción. Vol niega.
Detectar magia|Detect Magic|adv|ar0 br0 cl0 dr0|Detecta auras mágicas en un cono de 18 m (concentración).
Detectar venenos|Detect Poison|adv|ar0 cl0 dr0 pa1 ex1|Detecta veneno en una criatura, un objeto o un área pequeña.
Perturbar muertos vivientes|Disrupt Undead|nig|ar0|Rayo: 1d6 de daño a un muerto viviente.
Destello|Flare|evo|ar0 br0 dr0|Deslumbra a una criatura 1 min (−1 a ataque y Percepción). Fort niega.
Sonido fantasmal|Ghost Sound|ilu|ar0 br0|Sonidos ilusorios: hasta el ruido de 4 humanos por nivel (1 asalto/nivel).
Luz|Light|evo|ar0 br0 cl0 dr0|Un objeto brilla como una antorcha (10 min/nivel).
Mano de mago|Mage Hand|tra|ar0 br0|Mueve a distancia un objeto de hasta 2,5 kg.
Remendar|Mending|tra|ar0 br0 cl0 dr0|Repara pequeños desperfectos de un objeto (1d4 PG).
Mensaje|Message|tra|ar0 br0|Conversación en susurros a distancia con 1 criatura/nivel (10 min/nivel).
Abrir/cerrar|Open/Close|tra|ar0 br0|Abre o cierra a distancia una puerta, un cofre o algo parecido.
Prestidigitación|Prestidigitation|uni|ar0 br0|Trucos menores: limpiar, ensuciar, enfriar, calentar, dar sabor o color (1 h).
Rayo de escarcha|Ray of Frost|evo|ar0|Rayo: 1d3 de daño por frío.
Leer magia|Read Magic|adv|ar0 br0 cl0 dr0 pa1 ex1|Permite leer pergaminos y libros de conjuros (10 min/nivel).
Resistencia|Resistance|abj|ar0 br0 cl0 dr0 pa1|+1 a las salvaciones de una criatura (1 min).
Toque de fatiga|Touch of Fatigue|nig|ar0|Toque: el objetivo queda fatigado (1 asalto/nivel). Fort niega.
Saber la dirección|Know Direction|adv|br0 dr0|Sabes dónde está el norte.
Canción de cuna|Lullaby|enc|br0|Criaturas en un área: −5 a Percepción y −2 contra sueño (concentración + 1 asalto/nivel). Vol niega.
Invocar instrumento|Summon Instrument|con|br0|Aparece en tus manos un instrumento musical (1 min/nivel).
Crear agua|Create Water|con|cl0 dr0 pa1|Crea 8 litros de agua potable por nivel.
Orientación divina|Guidance|adv|cl0 dr0|+1 a una tirada de ataque, salvación o prueba (1 min).
Purificar comida y bebida|Purify Food and Drink|tra|cl0 dr0|Limpia comida y agua estropeadas o envenenadas.
Estabilizar|Stabilize|con|cl0 dr0|Una criatura moribunda queda estable.
Virtud|Virtue|tra|cl0 dr0 pa1|El objetivo gana 1 PG temporal (1 min).

Alarma|Alarm|abj|ar1 br1 ex1|Protege un área de 6 m de radio y avisa si alguien entra (2 h/nivel).
Animar cuerda|Animate Rope|tra|ar1 br1|Una cuerda obedece órdenes sencillas: enredar, atar, anudar.
Manos ardientes|Burning Hands|evo|ar1|Cono de 4,5 m: 1d4 de fuego por nivel (máx. 5d4). Ref mitad.
Causar miedo|Cause Fear|nig|ar1 br1 cl1|Una criatura de 5 DG o menos queda asustada 1d4 asaltos; si supera Vol, estremecida 1 asalto.
Hechizar persona|Charm Person|enc|ar1 br1|Un humanoide te trata como a un amigo (1 h/nivel). Vol niega.
Toque gélido|Chill Touch|nig|ar1|Un toque por nivel: 1d6 de daño y 1 de Fue (Fort niega la Fue).
Rociada de color|Color Spray|ilu|ar1|Cono de 4,5 m: deja inconsciente, ciega o aturde según los DG. Vol niega.
Comprensión idiomática|Comprehend Languages|adv|ar1 br1 cl1|Entiendes todos los idiomas, hablados y escritos (10 min/nivel).
Detectar puertas secretas|Detect Secret Doors|adv|ar1 br1|Revela puertas secretas en un cono de 18 m (concentración).
Detectar muertos vivientes|Detect Undead|adv|ar1 cl1 pa1|Revela muertos vivientes en un cono de 18 m (concentración).
Disfrazarse|Disguise Self|ilu|ar1 br1|Cambias tu aspecto y tu ropa: +10 a Disfrazarse (10 min/nivel).
Soportar los elementos|Endure Elements|abj|ar1 cl1 dr1 pa1 ex1|Estás a gusto entre −45 °C y 60 °C (24 h).
Agrandar persona|Enlarge Person|tra|ar1|Un humanoide dobla su tamaño: +2 Fue, −2 Des, −1 a ataque y CA (1 min/nivel).
Borrar|Erase|tra|ar1 br1|Borra escritura mágica o normal.
Retirada expeditiva|Expeditious Retreat|tra|ar1 br1|+9 m a tu velocidad base (1 min/nivel).
Caída de pluma|Feather Fall|tra|ar1 br1|Criaturas u objetos caen despacio y sin daño. Acción inmediata.
Disco flotante|Floating Disk|evo|ar1|Disco de fuerza que carga 50 kg por nivel y te sigue (1 h/nivel).
Grasa|Grease|con|ar1 br1|Cuadrado de 3 m o un objeto resbaladizo: Ref o caer.
Cerradura|Hold Portal|abj|ar1|Atranca una puerta (1 min/nivel).
Hipnotismo|Hypnotism|enc|ar1 br1|Fascina a 2d4 DG de criaturas (2d4 asaltos). Vol niega.
Identificar|Identify|adv|ar1 br1|+10 a Conocimiento de conjuros para identificar objetos mágicos (3 asaltos/nivel).
Salto|Jump|tra|ar1 dr1 ex1|+10 a Acrobacias para saltar; +20 a nivel 5 (1 min/nivel).
Armadura de mago|Mage Armor|con|ar1|+4 de armadura a la CA (1 h/nivel).
Aura mágica|Magic Aura|ilu|ar1 br1|Cambia el aura mágica de un objeto (1 día/nivel).
Proyectil mágico|Magic Missile|evo|ar1|1d4+1 de fuerza por proyectil, sin fallo. 1 proyectil más cada 2 niveles (máx. 5).
Arma mágica|Magic Weapon|tra|ar1 cl1 pa1|Un arma gana +1 de mejora (1 min/nivel).
Montura|Mount|con|ar1|Invoca un caballo o poni de monta (2 h/nivel).
Niebla de oscurecimiento|Obscuring Mist|con|ar1 cl1 dr1|Niebla de 6 m de radio a tu alrededor que da ocultación (1 min/nivel).
Protección contra el mal / el caos|Protection from Evil / Chaos|abj|ar1 cl1 pa1|+2 a CA y salvaciones contra ese alineamiento; bloquea el control mental (1 min/nivel).
Protección contra el bien / la ley|Protection from Good / Law|abj|ar1 cl1|+2 a CA y salvaciones contra ese alineamiento; bloquea el control mental (1 min/nivel).
Rayo de debilitamiento|Ray of Enfeeblement|nig|ar1|Rayo: −1d6 a la Fue, −1 más cada 2 niveles (máx. −5) (1 asalto/nivel). Fort mitad.
Reducir persona|Reduce Person|tra|ar1|Un humanoide encoge a la mitad: +2 Des, −2 Fue, +1 a ataque y CA (1 min/nivel).
Escudo|Shield|abj|ar1|+4 de escudo a la CA y anula los proyectiles mágicos (1 min/nivel).
Agarre electrizante|Shocking Grasp|evo|ar1|Toque: 1d6 de electricidad por nivel (máx. 5d6); +3 al ataque contra armadura de metal.
Imagen silenciosa|Silent Image|ilu|ar1 br1|Ilusión visual que controlas (concentración). Vol para descreer.
Dormir|Sleep|enc|ar1 br1|Duerme a 4 DG de criaturas (1 min/nivel). Vol niega.
Convocar monstruo I|Summon Monster I|con|ar1 br1 cl1|Convoca una criatura extraplanar que lucha por ti (1 asalto/nivel).
Golpe certero|True Strike|adv|ar1|+20 a tu siguiente tirada de ataque.
Sirviente invisible|Unseen Servant|con|ar1 br1|Fuerza invisible que hace tareas sencillas (1 h/nivel).
Ventriloquía|Ventriloquism|ilu|ar1 br1|Tu voz parece salir de otro sitio (1 min/nivel).
Confusión menor|Lesser Confusion|enc|br1|Una criatura queda confusa 1 asalto. Vol niega.
Curar heridas leves|Cure Light Wounds|con|br1 cl1 dr1 pa1|Cura 1d8 +1 por nivel (máx. +5). Daña a los muertos vivientes.
Risa horrible|Hideous Laughter|enc|br1 ar2|El objetivo cae al suelo de risa (1 asalto/nivel). Vol niega.
Boca mágica|Magic Mouth|ilu|br1 ar2|Un objeto dice un mensaje cuando se cumple una condición.
Ocultar objeto|Obscure Object|abj|br1 cl3|Oculta un objeto de la adivinación (8 h).
Quitar el miedo|Remove Fear|abj|br1 cl1|Suprime el miedo o da +4 contra él a 1 criatura (+1 cada 4 niveles) (10 min).
Alineamiento indetectable|Undetectable Alignment|abj|br1 cl2|Oculta el alineamiento de una criatura u objeto (24 h).
Perdición|Bane|enc|cl1|Enemigos a 15 m: −1 a ataque y contra miedo (1 min/nivel). Vol niega.
Bendecir|Bless|enc|cl1 pa1|Aliados a 15 m: +1 a ataque y contra miedo (1 min/nivel).
Bendecir agua|Bless Water|tra|cl1 pa1|Convierte un frasco de agua en agua bendita.
Orden imperiosa|Command|enc|cl1|Una criatura cumple una orden de una palabra durante 1 asalto. Vol niega.
Maldecir agua|Curse Water|nig|cl1|Convierte un frasco de agua en agua sacrílega.
Vigilia de la muerte|Deathwatch|nig|cl1|Sabes cómo de herida está cada criatura en un cono de 9 m (10 min/nivel).
Detectar el mal / el bien / el caos / la ley|Detect Evil / Good / Chaos / Law|adv|cl1|Revela auras de ese alineamiento en un cono de 18 m (concentración).
Favor divino|Divine Favor|evo|cl1 pa1|+1 a ataque y daño por cada 3 niveles (1 min).
Fatalidad|Doom|nig|cl1|Una criatura queda estremecida (1 min/nivel). Vol niega.
Escudo entrópico|Entropic Shield|abj|cl1|Los ataques a distancia contra ti fallan un 20 % (1 min/nivel).
Esconderse de los muertos vivientes|Hide from Undead|abj|cl1|Los muertos vivientes no te perciben (10 min/nivel).
Infligir heridas leves|Inflict Light Wounds|nig|cl1|Toque: 1d8 +1 por nivel (máx. +5) de daño. Cura a los muertos vivientes. Vol mitad.
Piedra mágica|Magic Stone|tra|cl1 dr1|Tres piedras: +1 al ataque y 1d6+1 de daño (el doble a muertos vivientes).
Santuario|Sanctuary|abj|cl1|Quien quiera atacarte debe superar Vol o no puede (1 asalto/nivel).
Escudo de la fe|Shield of Faith|abj|cl1|+2 de desvío a la CA, +1 cada 6 niveles (1 min/nivel).
Calmar animales|Calm Animals|enc|dr1 ex1|Calma a 2d4 + nivel DG de animales (1 min/nivel). Vol niega.
Hechizar animal|Charm Animal|enc|dr1 ex1|Un animal te trata como a un amigo (1 h/nivel). Vol niega.
Detectar animales o plantas|Detect Animals or Plants|adv|dr1 ex1|Detecta animales o plantas de un tipo en un cono (concentración).
Detectar fosos y trampas|Detect Snares and Pits|adv|dr1 ex1|Revela trampas naturales o primitivas en un cono (concentración).
Enmarañar|Entangle|tra|dr1 ex1|Las plantas atrapan a quien esté en un radio de 12 m (1 min/nivel). Ref o enredado.
Fuego feérico|Faerie Fire|evo|dr1|Contornea criaturas de luz: anula la ocultación y la invisibilidad (1 min/nivel).
Bayas benéficas|Goodberry|tra|dr1|2d4 bayas: cada una cura 1 PG y alimenta un día.
Esconderse de los animales|Hide from Animals|abj|dr1 ex1|Los animales no te perciben (10 min/nivel).
Zancada prodigiosa|Longstrider|tra|dr1 ex1|+3 m a tu velocidad (1 h/nivel).
Colmillo mágico|Magic Fang|tra|dr1 ex1|Un arma natural o golpe sin armas gana +1 (1 min/nivel).
Pasar sin dejar rastro|Pass without Trace|tra|dr1 ex1|1 criatura/nivel no deja huellas (1 h/nivel).
Producir llama|Produce Flame|evo|dr1|Llama en la mano: 1d6 +1 por nivel (máx. +5) de fuego, al tocar o lanzada (1 min/nivel).
Garrote|Shillelagh|tra|dr1|Un bastón o garrote gana +1 y hace daño como si fuera más grande (1 min/nivel).
Hablar con los animales|Speak with Animals|adv|dr1 ex1 br3|Puedes hablar con los animales (1 min/nivel).
Convocar aliado natural I|Summon Nature's Ally I|con|dr1 ex1|Convoca un animal que lucha por ti (1 asalto/nivel).
Bendecir arma|Bless Weapon|tra|pa1|Un arma hace críticos automáticos contra el mal (1 min/nivel).
Restablecimiento menor|Lesser Restoration|con|pa1 cl2 dr2|Quita 1d4 de daño a una característica, o la fatiga.
Mensajero animal|Animal Messenger|enc|ex1 br2 dr2|Un animal Diminuto lleva un mensaje a un lugar.
Retrasar veneno|Delay Poison|con|ex1 br2 cl2 dr2|Detiene los efectos de un veneno (1 h/nivel).
Resistir energía|Resist Energy|abj|ex1 ar2 cl2 dr2|Resistencia 10 a un tipo de energía; 20 a nivel 7 (10 min/nivel).

Flecha ácida|Acid Arrow|con|ar2|Flecha de ácido: 2d4 por asalto durante 1 asalto cada 3 niveles.
Alterar el propio aspecto|Alter Self|tra|ar2 br2|Tomas la forma de un humanoide Pequeño o Mediano, con alguna ventaja (1 min/nivel).
Cerradura arcana|Arcane Lock|abj|ar2|Cierra mágicamente una puerta o cofre para siempre.
Aguante del oso|Bear's Endurance|tra|ar2 cl2 dr2|+4 a la Con (1 min/nivel).
Ceguera/sordera|Blindness/Deafness|nig|ar2 br2 cl3|El objetivo queda ciego o sordo para siempre. Fort niega.
Difuminar|Blur|ilu|ar2 br2|Los ataques contra el objetivo fallan un 20 % (1 min/nivel).
Fuerza de toro|Bull's Strength|tra|ar2 cl2 dr2|+4 a la Fue (1 min/nivel).
Gracia felina|Cat's Grace|tra|ar2 br2 dr2|+4 a la Des (1 min/nivel).
Controlar muertos vivientes|Command Undead|nig|ar2|Un muerto viviente te obedece (1 día/nivel). Vol niega si es inteligente.
Llama continua|Continual Flame|evo|ar2 cl3|Una llama permanente que no quema.
Oscuridad|Darkness|evo|ar2 br2 cl2|Un objeto irradia oscuridad en 6 m de radio (1 min/nivel).
Visión en la oscuridad|Darkvision|tra|ar2|Ves en la oscuridad hasta 18 m (1 h/nivel).
Aturdir monstruo|Daze Monster|enc|ar2 br2|Una criatura viva de 6 DG o menos pierde su siguiente acción. Vol niega.
Detectar pensamientos|Detect Thoughts|adv|ar2 br2|Escuchas los pensamientos superficiales (concentración). Vol niega.
Esplendor del águila|Eagle's Splendor|tra|ar2 br2 cl2|+4 al Car (1 min/nivel).
Falsa vida|False Life|nig|ar2|1d10 +1 por nivel (máx. +10) PG temporales (1 h/nivel).
Esfera flamígera|Flaming Sphere|evo|ar2 dr2|Bola de fuego rodante: 3d6 de fuego (1 asalto/nivel). Ref niega.
Nube de niebla|Fog Cloud|con|ar2 dr2|Niebla de 6 m de radio que da ocultación (10 min/nivel).
Astucia del zorro|Fox's Cunning|tra|ar2 br2|+4 a la Int (1 min/nivel).
Toque de necrófago|Ghoul Touch|nig|ar2|Toque: paraliza 1d6+2 asaltos y da náuseas a quien esté cerca. Fort niega.
Polvo brillante|Glitterdust|con|ar2 br2|Ciega a las criaturas del área y revela a los invisibles. Vol niega la ceguera.
Ráfaga de viento|Gust of Wind|evo|ar2 dr2|Viento fuerte: apaga llamas y tumba o empuja a criaturas pequeñas.
Patrón hipnótico|Hypnotic Pattern|ilu|ar2 br2|Fascina a 2d4 + nivel DG de criaturas (concentración + 2 asaltos). Vol niega.
Invisibilidad|Invisibility|ilu|ar2 br2|El objetivo es invisible hasta que ataque (1 min/nivel).
Apertura|Knock|tra|ar2|Abre una puerta atascada, cerrada o atrancada.
Levitar|Levitate|tra|ar2|Sube o baja a una criatura u objeto (1 min/nivel).
Localizar objeto|Locate Object|adv|ar2 br2 cl3|Sientes la dirección de un objeto conocido o de un tipo (1 min/nivel).
Imagen menor|Minor Image|ilu|ar2 br2|Como imagen silenciosa, con algo de sonido.
Imagen múltiple|Mirror Image|ilu|ar2 br2|1d4 dobles ilusorios (+1 cada 3 niveles, máx. 8) que desvían los ataques (1 min/nivel).
Despiste|Misdirection|ilu|ar2 br2|Engaña a las adivinaciones sobre una criatura u objeto (1 h/nivel).
Sabiduría del búho|Owl's Wisdom|tra|ar2 cl2 dr2|+4 a la Sab (1 min/nivel).
Protección contra flechas|Protection from Arrows|abj|ar2|RD 10/mágico contra ataques a distancia (1 h/nivel).
Pirotecnia|Pyrotechnics|tra|ar2 br2|Convierte un fuego en luces cegadoras o en humo espeso.
Truco de la cuerda|Rope Trick|tra|ar2|Una cuerda lleva a un escondite extradimensional para 8 criaturas (1 h/nivel).
Asustar|Scare|nig|ar2 br2|Criaturas de menos de 6 DG quedan asustadas; si superan Vol, estremecidas.
Rayo abrasador|Scorching Ray|evo|ar2|Rayo: 4d6 de fuego; un rayo más a nivel 7 y otro a nivel 11.
Ver lo invisible|See Invisibility|adv|ar2 br3|Ves criaturas y objetos invisibles (10 min/nivel).
Estallar|Shatter|evo|ar2 br2 cl2|Vibración sónica que rompe objetos o daña a criaturas cristalinas.
Mano espectral|Spectral Hand|nig|ar2|Mano fantasmal que entrega tus conjuros de toque, con +2 (1 min/nivel).
Trepar cual arácnido|Spider Climb|tra|ar2 dr2|Trepas por paredes y techos a 6 m (10 min/nivel).
Convocar monstruo II|Summon Monster II|con|ar2 br2 cl2|Convoca criaturas extraplanares (1 asalto/nivel).
Convocar enjambre|Summon Swarm|con|ar2 br2 dr2|Convoca un enjambre de murciélagos, ratas o arañas (concentración + 2 asaltos).
Toque de idiotez|Touch of Idiocy|enc|ar2|Toque: −1d6 a Int, Sab y Car (10 min/nivel).
Telaraña|Web|con|ar2|Telarañas de 6 m de radio que atrapan a quien esté dentro (10 min/nivel). Ref.
Viento susurrante|Whispering Wind|tra|ar2 br2|Lleva un mensaje de 25 palabras o un sonido a un lugar lejano.
Trance animal|Animal Trance|enc|br2 dr2|Fascina a 2d6 DG de animales (concentración). Vol niega.
Calmar emociones|Calm Emotions|enc|br2 cl2|Calma a las criaturas y anula furia y miedo (concentración). Vol niega.
Curar heridas moderadas|Cure Moderate Wounds|con|br2 cl2 dr3|Cura 2d8 +1 por nivel (máx. +10).
Cautivar|Enthrall|enc|br2 cl2|Cautiva a un público mientras hablas o cantas (hasta 1 h). Vol niega.
Heroísmo|Heroism|enc|br2 ar3|+2 a ataque, salvaciones y habilidades (10 min/nivel).
Inmovilizar persona|Hold Person|enc|br2 cl2 ar3|Paraliza a un humanoide (1 asalto/nivel). Vol niega; repite cada asalto.
Furia|Rage|enc|br2 ar3|+2 a Fue y Con, +1 a Vol, −2 a la CA (concentración + 1 asalto/nivel).
Silencio|Silence|ilu|br2 cl2|Silencio total en 6 m de radio (1 asalto/nivel).
Explosión de sonido|Sound Burst|evo|br2 cl2|1d8 sónico en 3 m de radio y aturde 1 asalto. Fort niega el aturdimiento.
Sugestión|Suggestion|enc|br2 ar3|El objetivo sigue un curso de acción razonable (1 h/nivel). Vol niega.
Don de lenguas|Tongues|adv|br2 ar3|Hablas y entiendes cualquier idioma (10 min/nivel).
Ayuda|Aid|enc|cl2|+1 a ataque y contra miedo, y 1d8 +1 por nivel (máx. +10) PG temporales (1 min/nivel).
Alinear arma|Align Weapon|tra|cl2|Un arma cuenta como buena, mala, legal o caótica (1 min/nivel).
Augurio|Augury|adv|cl2|Sabes si una acción próxima traerá bien o mal (70 % +1 % por nivel).
Consagrar|Consecrate|evo|cl2|Llena un área de energía positiva que debilita a los muertos vivientes (2 h/nivel).
Toque de muerte|Death Knell|nig|cl2|Mata a una criatura moribunda; ganas 1d8 PG temporales, +2 Fue y +1 nivel de lanzador. Vol niega.
Profanar|Desecrate|evo|cl2|Llena un área de energía negativa que fortalece a los muertos vivientes (2 h/nivel).
Encontrar trampas|Find Traps|adv|cl2|Buscas trampas como un pícaro (10 min/nivel).
Reposo apacible|Gentle Repose|nig|cl2 ar3|Un cadáver no se descompone (1 día/nivel).
Infligir heridas moderadas|Inflict Moderate Wounds|nig|cl2|Toque: 2d8 +1 por nivel (máx. +10) de daño. Vol mitad.
Reparar objeto|Make Whole|tra|cl2|Repara por completo un objeto roto.
Eliminar parálisis|Remove Paralysis|con|cl2|Libera de parálisis o lentitud a hasta 4 criaturas.
Escudo del otro|Shield Other|abj|cl2|+1 a CA y salvaciones del objetivo; tú recibes la mitad de su daño (1 h/nivel).
Arma espiritual|Spiritual Weapon|evo|cl2|Un arma de fuerza ataca por ti (1 asalto/nivel).
Estado|Status|adv|cl2|Sabes dónde y cómo están tus aliados, 1 cada 3 niveles (1 h/nivel).
Zona de verdad|Zone of Truth|enc|cl2|Nadie puede mentir a sabiendas en el área (1 min/nivel). Vol niega.
Piel robliza|Barkskin|tra|dr2|+2 de armadura natural, +1 cada 3 niveles por encima de 3 (10 min/nivel).
Enfriar metal|Chill Metal|tra|dr2|El metal se congela y daña a quien lo lleve (7 asaltos).
Trampa de fuego|Fire Trap|abj|dr2|Un objeto estalla al abrirse: 1d4 +1 por nivel de fuego.
Hoja flamígera|Flame Blade|evo|dr2|Una hoja de fuego en la mano: 1d8 +1 cada 2 niveles (1 min/nivel).
Calentar metal|Heat Metal|tra|dr2|El metal se pone al rojo y quema a quien lo lleve (7 asaltos).
Inmovilizar animal|Hold Animal|enc|dr2|Paraliza a un animal (1 asalto/nivel). Vol niega.
Reducir animal|Reduce Animal|tra|dr2|Encoge a un animal voluntario (1 h/nivel).
Ablandar tierra y piedra|Soften Earth and Stone|tra|dr2|Convierte la piedra en arcilla o la tierra en barro.
Forma de árbol|Tree Shape|tra|dr2|Te conviertes en un árbol (1 h/nivel).
Deformar madera|Warp Wood|tra|dr2|Deforma objetos de madera.
Moldear madera|Wood Shape|tra|dr2|Da forma a un trozo de madera.
Convocar aliado natural II|Summon Nature's Ally II|con|dr2|Convoca animales que luchan por ti (1 asalto/nivel).

Visión arcana|Arcane Sight|adv|ar3|Ves las auras mágicas y su escuela (1 min/nivel).
Forma bestial I|Beast Shape I|tra|ar3|Te conviertes en un animal Pequeño o Mediano (1 min/nivel).
Intermitencia|Blink|tra|ar3 br3|Saltas al plano etéreo y vuelves: 50 % de fallo contra ti (1 asalto/nivel).
Clariaudiencia/clarividencia|Clairaudience/Clairvoyance|adv|ar3 br3|Ves u oyes a distancia (1 min/nivel).
Luz del día|Daylight|evo|ar3 cl3 dr3|Luz brillante en 18 m de radio (10 min/nivel).
Sueño profundo|Deep Slumber|enc|ar3 br3|Como dormir, pero 10 DG de criaturas. Vol niega.
Disipar magia|Dispel Magic|abj|ar3 br3 cl3|Anula conjuros o efectos mágicos (prueba de nivel de lanzador).
Desplazamiento|Displacement|ilu|ar3 br3|Los ataques contra el objetivo fallan un 50 % (1 asalto/nivel).
Runas explosivas|Explosive Runes|abj|ar3|Runas que estallan al leerlas: 6d6 de fuerza.
Bola de fuego|Fireball|evo|ar3|Explosión de 6 m de radio: 1d6 de fuego por nivel (máx. 10d6). Ref mitad.
Flecha flamígera|Flame Arrow|tra|ar3|Las municiones hacen +1d6 de fuego (10 min/nivel).
Volar|Fly|tra|ar3|Vuelas a 18 m (1 min/nivel).
Forma gaseosa|Gaseous Form|tra|ar3 br3|Te conviertes en niebla (2 min/nivel).
Detener muertos vivientes|Halt Undead|nig|ar3|Inmoviliza a 3 muertos vivientes (1 asalto/nivel).
Prisa|Haste|tra|ar3 br3|1 criatura/nivel: +1 a ataque, CA y Ref, un ataque más y +9 m (1 asalto/nivel).
Escritura ilusoria|Illusory Script|ilu|ar3 br3|Solo el destinatario puede leer el texto.
Esfera de invisibilidad|Invisibility Sphere|ilu|ar3 br3|Todos a 3 m de ti se vuelven invisibles.
Afilar|Keen Edge|tra|ar3|Duplica el rango de amenaza de un arma (10 min/nivel).
Relámpago|Lightning Bolt|evo|ar3|Línea de 36 m: 1d6 de electricidad por nivel (máx. 10d6). Ref mitad.
Círculo mágico contra el mal / el bien / el caos / la ley|Magic Circle against Evil / Good / Chaos / Law|abj|ar3 cl3|Como la protección, en 3 m de radio (10 min/nivel).
Arma mágica mayor|Greater Magic Weapon|tra|ar3|+1 de mejora cada 4 niveles, máx. +5 (1 h/nivel).
Imagen mayor|Major Image|ilu|ar3 br3|Ilusión con sonido, olor y temperatura (concentración + 3 asaltos).
Indetectable|Nondetection|abj|ar3|Oculta a una criatura u objeto de la adivinación (1 h/nivel).
Corcel fantasmal|Phantom Steed|con|ar3 br3|Un caballo mágico que corre 6 m por nivel (1 h/nivel).
Protección contra la energía|Protection from Energy|abj|ar3 cl3 dr3|Absorbe 12 puntos por nivel (máx. 120) de un tipo de energía (10 min/nivel).
Rayo de agotamiento|Ray of Exhaustion|nig|ar3|Rayo: exhausto, o fatigado si supera Fort (1 min/nivel).
Página secreta|Secret Page|tra|ar3 br3|Disfraza el contenido de una página.
Sello de la serpiente sepia|Sepia Snake Sigil|con|ar3 br3|Un texto atrapa en ámbar a quien lo lea.
Encoger objeto|Shrink Item|tra|ar3|Reduce un objeto a 1/16 de su tamaño.
Tormenta de aguanieve|Sleet Storm|con|ar3 dr3|Aguanieve que tapa la vista y vuelve resbaladizo el suelo.
Lentitud|Slow|tra|ar3 br3|1 criatura/nivel: una sola acción por asalto y −1 a ataque, CA y Ref (1 asalto/nivel). Vol niega.
Nube apestosa|Stinking Cloud|con|ar3|Nube que da náuseas (1 asalto/nivel). Fort niega.
Convocar monstruo III|Summon Monster III|con|ar3 br3 cl3|Convoca criaturas extraplanares (1 asalto/nivel).
Choza|Tiny Hut|evo|ar3 br3|Refugio de 6 m para 10 criaturas (2 h/nivel).
Toque vampírico|Vampiric Touch|nig|ar3|Toque: 1d6 cada 2 niveles (máx. 10d6) y ganas esos PG como temporales.
Respirar bajo el agua|Water Breathing|tra|ar3 cl3 dr3|Los objetivos respiran bajo el agua (2 h/nivel, repartidas).
Muro de viento|Wind Wall|evo|ar3 cl3 dr3|Muro de viento que desvía flechas y criaturas pequeñas (1 asalto/nivel).
Animar a los muertos|Animate Dead|nig|cl3|Convierte cadáveres en esqueletos o zombis que te obedecen.
Imponer maldición|Bestow Curse|nig|cl3|−6 a una característica, −4 a todo, o 50 % de perder la acción. Vol niega.
Contagio|Contagion|nig|cl3 dr3|Toque: contagia una enfermedad. Fort niega.
Crear comida y agua|Create Food and Water|con|cl3|Alimenta a 3 humanos (o 1 caballo) por nivel durante un día.
Curar heridas graves|Cure Serious Wounds|con|cl3 br3|Cura 3d8 +1 por nivel (máx. +15).
Oscuridad profunda|Deeper Darkness|evo|cl3|Oscuridad de 18 m de radio (10 min/nivel).
Glifo custodio|Glyph of Warding|abj|cl3|Inscripción que daña o lanza un conjuro a quien la cruce.
Mano amiga|Helping Hand|evo|cl3|Una mano fantasmal guía a una criatura hasta ti.
Infligir heridas graves|Inflict Serious Wounds|nig|cl3|Toque: 3d8 +1 por nivel (máx. +15) de daño. Vol mitad.
Purgar invisibilidad|Invisibility Purge|evo|cl3|Anula la invisibilidad a 1,5 m por nivel a tu alrededor (1 min/nivel).
Investidura mágica|Magic Vestment|tra|cl3|Una armadura o escudo gana +1 cada 4 niveles (1 h/nivel).
Fundirse con la piedra|Meld into Stone|tra|cl3 dr3|Te metes dentro de una roca (10 min/nivel).
Plegaria|Prayer|enc|cl3|Aliados +1 a casi todas las tiradas; enemigos −1 (1 asalto/nivel).
Quitar ceguera/sordera|Remove Blindness/Deafness|con|cl3|Cura la ceguera o la sordera.
Quitar maldición|Remove Curse|abj|cl3 br3|Libera de maldiciones a una criatura u objeto.
Quitar enfermedad|Remove Disease|con|cl3 dr3|Cura todas las enfermedades del objetivo.
Luz abrasadora|Searing Light|evo|cl3|Rayo: 1d8 cada 2 niveles (más contra muertos vivientes).
Hablar con los muertos|Speak with Dead|nig|cl3|Un cadáver responde a una pregunta cada 2 niveles.
Moldear la piedra|Stone Shape|tra|cl3 dr3|Da forma a la piedra.
Caminar sobre el agua|Water Walk|tra|cl3|Los objetivos caminan sobre el agua (10 min/nivel).
Llamar al relámpago|Call Lightning|evo|dr3|Rayos de 3d6 de electricidad, uno por asalto (1 min/nivel). Ref mitad.
Disminuir plantas|Diminish Plants|tra|dr3|Reduce la vegetación o la hace menos productiva.
Dominar animal|Dominate Animal|enc|dr3|Un animal obedece tus órdenes mentales (1 asalto/nivel). Vol niega.
Colmillo mágico mayor|Greater Magic Fang|tra|dr3|+1 cada 4 niveles a un arma natural (1 h/nivel).
Neutralizar veneno|Neutralize Poison|con|dr3|Elimina un veneno de una criatura u objeto.
Crecimiento vegetal|Plant Growth|tra|dr3|Hace crecer la vegetación o la hace más productiva.
Veneno|Poison|nig|dr3|Toque: veneno de 1d3 de Con por asalto durante 6 asaltos. Fort niega.
Apagar|Quench|tra|dr3|Apaga los fuegos de un área.
Lazo|Snare|tra|dr3|Convierte una cuerda en una trampa mágica.
Hablar con las plantas|Speak with Plants|adv|dr3|Puedes hablar con las plantas (1 min/nivel).
Crecimiento de espinas|Spike Growth|tra|dr3|Pinchos ocultos en el suelo dañan y frenan a quien pase.
Convocar aliado natural III|Summon Nature's Ally III|con|dr3|Convoca animales que luchan por ti (1 asalto/nivel).
`;

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const CONJUROS: Conjuro[] = DATOS.trim().split("\n").filter((l) => l.trim()).map((l) => {
  const [nombre, ingles, escuela, listas, texto] = l.split("|");
  const niveles: Partial<Record<ListaConjuros, number>> = {};
  for (const x of listas.split(" ")) niveles[x.slice(0, 2) as ListaConjuros] = Number(x.slice(2));
  return { clave: slug(nombre), nombre, ingles, escuela: ESCUELAS[escuela] ?? escuela, niveles, texto };
});

/** Conjuros de una lista hasta un nivel, ordenados por nivel y nombre. */
export function conjurosDe(lista: ListaConjuros, maxNivel: number): (Conjuro & { nivel: number })[] {
  return CONJUROS.filter((c) => (c.niveles[lista] ?? 99) <= maxNivel)
    .map((c) => ({ ...c, nivel: c.niveles[lista]! }))
    .sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre, "es"));
}
