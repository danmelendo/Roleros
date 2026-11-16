/* Dotes del Manual básico de Pathfinder 1e. Resumen de una línea para la ficha;
   el texto completo, por su nombre inglés en d20pfsrd.
   Tipos: C = combate (las puede coger el guerrero como dote adicional),
   G = general, M = metamágica, F = creación de objetos. */

export type TipoDote = "combate" | "general" | "metamágica" | "creación";
export type Dote = { clave: string; nombre: string; ingles: string; tipo: TipoDote; requisitos: string; texto: string };

const TIPOS: Record<string, TipoDote> = { C: "combate", G: "general", M: "metamágica", F: "creación" };

// nombre | inglés | tipo | requisitos | beneficio
const DATOS = `
Acrobático|Acrobatic|G||+2 a Acrobacias y Volar (+4 con 10 rangos).
Pasos acrobáticos|Acrobatic Steps|G|Des 15, Movimientos ágiles|Te mueves por terreno difícil como si fuera normal (hasta 15 pies por asalto).
Maniobras ágiles|Agile Maneuvers|C||Usas el mod. de Des en vez del de Fue para la BMC.
Alerta|Alertness|G||+2 a Percepción y Averiguar intenciones (+4 con 10 rangos).
Canalizar alineamiento|Alignment Channel|G|Canalizar energía|Tu canalización cura o daña a ajenos de un alineamiento.
Afinidad con los animales|Animal Affinity|G||+2 a Trato con animales y Montar (+4 con 10 rangos).
Entrenamiento en armadura arcana|Arcane Armor Training|C|Competencia con armadura ligera, nivel 3 de lanzador|Acción rápida: −10 % al fallo de conjuros arcanos por armadura en este asalto.
Maestría en armadura arcana|Arcane Armor Mastery|C|Entrenamiento en armadura arcana, competencia con armadura intermedia, nivel 7 de lanzador|Acción rápida: −20 % al fallo de conjuros por armadura.
Golpe arcano|Arcane Strike|C|Lanzar conjuros arcanos|Acción rápida: +1 al daño (+1 cada 5 niveles de lanzador) y tus armas cuentan como mágicas durante 1 asalto.
Competencia con armadura ligera|Armor Proficiency, Light|G||Sin penalizador de armadura a los ataques con armadura ligera.
Competencia con armadura intermedia|Armor Proficiency, Medium|G|Competencia con armadura ligera|Sin penalizador de armadura a los ataques con armadura intermedia.
Competencia con armadura pesada|Armor Proficiency, Heavy|G|Competencia con armadura intermedia|Sin penalizador de armadura a los ataques con armadura pesada.
Atlético|Athletic|G||+2 a Trepar y Nadar (+4 con 10 rangos).
Aumentar convocación|Augment Summoning|G|Soltura con una escuela (conjuración)|Tus criaturas convocadas tienen +4 a Fue y Con.
Crítico sangrante|Bleeding Critical|C|Soltura con los críticos, ataque base +11|Al confirmar un crítico, 2d6 de desangramiento.
Lucha a ciegas|Blind-Fight|C||Repites el 50 % de fallo por ocultación; los invisibles no te pillan desprevenido.
Crítico cegador|Blinding Critical|C|Soltura con los críticos, ataque base +15|Al confirmar un crítico, el objetivo queda ciego.
Elaborar poción|Brew Potion|F|Nivel 3 de lanzador|Fabricas pociones de conjuros de nivel 3 o menos.
Pillar desprevenido|Catch Off-Guard|C||Sin penalización con armas improvisadas; quien te ataque desarmado o sin arma queda desprevenido ante ti.
Castigo canalizado|Channel Smite|C|Canalizar energía|Gastas una canalización al golpear para sumar su daño al del arma.
Hendedura|Cleave|C|Fue 13, Ataque poderoso, ataque base +1|Si aciertas, un ataque más contra otro enemigo adyacente; −2 a la CA hasta tu turno.
Lanzar conjuros en combate|Combat Casting|G||+4 a las pruebas de concentración para lanzar a la defensiva o agarrado.
Pericia en combate|Combat Expertise|C|Int 13|−1 al ataque y +1 de esquiva a la CA (cada 4 de ataque base, −1/+1 más).
Reflejos de combate|Combat Reflexes|C||Tantos ataques de oportunidad más por asalto como tu mod. de Des; puedes hacerlos estando desprevenido.
Controlar muertos vivientes|Command Undead|G|Canalizar energía negativa|Gastas una canalización para controlar muertos vivientes. Vol niega.
Fabricar armas y armaduras mágicas|Craft Magic Arms and Armor|F|Nivel 5 de lanzador|Fabricas armas, armaduras y escudos mágicos.
Fabricar vara|Craft Rod|F|Nivel 9 de lanzador|Fabricas varas mágicas.
Fabricar bastón|Craft Staff|F|Nivel 11 de lanzador|Fabricas bastones mágicos.
Fabricar varita|Craft Wand|F|Nivel 5 de lanzador|Fabricas varitas de conjuros de nivel 4 o menos.
Fabricar objeto maravilloso|Craft Wondrous Item|F|Nivel 3 de lanzador|Fabricas objetos maravillosos.
Soltura con los críticos|Critical Focus|C|Ataque base +9|+4 a las tiradas para confirmar críticos.
Maestría con los críticos|Critical Mastery|C|Soltura con los críticos, dos dotes de crítico, nivel 14 de guerrero|Aplicas dos efectos de dotes de crítico a la vez.
Exhibición deslumbrante|Dazzling Display|C|Soltura con un arma|Acción completa: Intimidar a todos los enemigos a 30 pies que te vean.
Puntería mortal|Deadly Aim|C|Des 13, ataque base +1|−1 al ataque a distancia y +2 al daño (cada 4 de ataque base, −1/+2 más).
Golpe mortal|Deadly Stroke|C|Exhibición deslumbrante, Destrozar defensas, Soltura mayor con un arma, ataque base +11|Contra un enemigo aturdido o desprevenido: doble daño y 1 de Con por desangramiento.
Crítico ensordecedor|Deafening Critical|C|Soltura con los críticos, ataque base +13|Al confirmar un crítico, el objetivo queda sordo.
Engañoso|Deceitful|G||+2 a Engañar y Disfrazarse (+4 con 10 rangos).
Entrenamiento en combate defensivo|Defensive Combat Training|C||Usas tus DG totales como ataque base para la DMC.
Desviar flechas|Deflect Arrows|C|Des 13, Impacto sin armas mejorado|Una vez por asalto desvías un ataque a distancia que te acertaría.
Manos hábiles|Deft Hands|G||+2 a Inutilizar mecanismo y Juego de manos (+4 con 10 rangos).
Duro de pelar|Diehard|G|Aguante|Por debajo de 0 PG sigues consciente y actuando (incapacitado) en vez de quedar moribundo.
Disruptivo|Disruptive|C|Nivel 6 de guerrero|+4 a la CD para lanzar a la defensiva junto a ti.
Esquiva|Dodge|C|Des 13|+1 de esquiva a la CA.
Doble tajo|Double Slice|C|Des 15, Combate con dos armas|Sumas todo tu mod. de Fue al daño del arma de la mano torpe.
Canalizar elemento|Elemental Channel|G|Canalizar energía|Tu canalización cura o daña a ajenos de un subtipo elemental.
Potenciar conjuro|Empower Spell|M||Las variables numéricas del conjuro aumentan a la mitad. Ocupa +2 niveles.
Aguante|Endurance|G||+4 a pruebas para resistir el cansancio, la asfixia, el hambre y el frío o calor; duermes con armadura ligera o intermedia.
Alargar conjuro|Enlarge Spell|M||Duplica el alcance del conjuro. Ocupa +1 nivel.
Prescindir de materiales|Eschew Materials|G||Lanzas sin componentes materiales de 1 po o menos.
Crítico agotador|Exhausting Critical|C|Soltura con los críticos, Crítico extenuante, ataque base +15|Al confirmar un crítico, el objetivo queda exhausto.
Prolongar conjuro|Extend Spell|M||Duplica la duración del conjuro. Ocupa +1 nivel.
Canalizar adicional|Extra Channel|G|Canalizar energía|Canalizas 2 veces más al día.
Ki adicional|Extra Ki|G|Reserva de ki|+2 puntos de ki.
Imposición de manos adicional|Extra Lay On Hands|G|Imposición de manos|2 usos más de imposición de manos al día.
Merced adicional|Extra Mercy|G|Imposición de manos, merced|Una merced más.
Interpretación adicional|Extra Performance|G|Interpretación de bardo|6 asaltos más de interpretación al día.
Furia adicional|Extra Rage|G|Furia|6 asaltos más de furia al día.
Disparo lejano|Far Shot|C|Disparo a bocajarro|Solo −1 por cada incremento de distancia.
Rápido|Fleet|G||+5 pies de velocidad con armadura ligera o sin ella.
Forjar anillo|Forge Ring|F|Nivel 7 de lanzador|Fabricas anillos mágicos.
Puño de la gorgona|Gorgon's Fist|C|Impacto sin armas mejorado, Estilo del escorpión, ataque base +6|Golpe sin armas contra un enemigo frenado: queda tambaleante. Fort niega.
Gran hendedura|Great Cleave|C|Fue 13, Hendedura, Ataque poderoso, ataque base +4|Como Hendedura, pero sigues encadenando ataques mientras aciertes.
Gran fortaleza|Great Fortitude|G||+2 a Fortaleza.
Embestida mayor|Greater Bull Rush|C|Embestida mejorada, Ataque poderoso, ataque base +6|+2 a embestir; quien empujas provoca ataques de oportunidad de tus aliados.
Desarme mayor|Greater Disarm|C|Pericia en combate, Desarme mejorado, ataque base +6|+2 a desarmar; el arma sale volando 15 pies.
Finta mayor|Greater Feint|C|Pericia en combate, Finta mejorada, ataque base +6|La finta dura todo un asalto.
Presa mayor|Greater Grapple|C|Presa mejorada, Impacto sin armas mejorado, ataque base +6|+2 a apresar; mantener la presa es acción de movimiento.
Arrollar mayor|Greater Overrun|C|Arrollar mejorado, Ataque poderoso, ataque base +6|+2 a arrollar; el derribado provoca ataques de oportunidad.
Golpe penetrante mayor|Greater Penetrating Strike|C|Golpe penetrante, nivel 16 de guerrero|Ignoras 10 de RD (5 de cualquier RD).
Soltura mayor con escudo|Greater Shield Focus|C|Soltura con escudo, nivel 8 de guerrero|+1 más a la CA con escudo.
Soltura mayor con una escuela de magia|Greater Spell Focus|G|Soltura con una escuela de magia|+1 más a la CD de los conjuros de esa escuela.
Penetración de conjuros mayor|Greater Spell Penetration|G|Penetración de conjuros|+2 más para superar la resistencia a conjuros.
Romper mayor|Greater Sunder|C|Romper mejorado, Ataque poderoso, ataque base +6|+2 a romper; el daño sobrante pasa al portador.
Derribo mayor|Greater Trip|C|Pericia en combate, Derribo mejorado, ataque base +6|+2 a derribar; el derribado provoca ataques de oportunidad.
Combate con dos armas mayor|Greater Two-Weapon Fighting|C|Des 19, Combate con dos armas mejorado, ataque base +11|Un tercer ataque con la mano torpe (−10).
Golpe vital mayor|Greater Vital Strike|C|Golpe vital mejorado, ataque base +16|Golpe vital con cuatro veces los dados de daño.
Soltura mayor con un arma|Greater Weapon Focus|C|Soltura con un arma, nivel 8 de guerrero|+1 más al ataque con esa arma.
Especialización mayor en un arma|Greater Weapon Specialization|C|Soltura mayor con un arma, Especialización en un arma, nivel 12 de guerrero|+2 más al daño con esa arma.
Elevar conjuro|Heighten Spell|M||Lanzas el conjuro como si fuera de nivel más alto.
Embestida mejorada|Improved Bull Rush|C|Fue 13, Ataque poderoso, ataque base +1|Embestir no provoca; +2 a embestir y a la DMC contra embestidas.
Canalizar mejorado|Improved Channel|G|Canalizar energía|+2 a la CD de tu canalización.
Contraconjuro mejorado|Improved Counterspell|G||Contrarrestas con cualquier conjuro de la misma escuela y nivel superior.
Crítico mejorado|Improved Critical|C|Competencia con el arma, ataque base +8|Duplica el rango de amenaza de un arma.
Desarme mejorado|Improved Disarm|C|Int 13, Pericia en combate|Desarmar no provoca; +2 a desarmar y a la DMC contra desarmes.
Familiar mejorado|Improved Familiar|G|Poder obtener un familiar, nivel de lanzador suficiente|Un familiar más poderoso.
Finta mejorada|Improved Feint|C|Int 13, Pericia en combate|Fintar es acción de movimiento.
Presa mejorada|Improved Grapple|C|Des 13, Impacto sin armas mejorado|Apresar no provoca; +2 a apresar y a la DMC contra presas.
Gran fortaleza mejorada|Improved Great Fortitude|G|Gran fortaleza|1/día repites una salvación de Fortaleza.
Iniciativa mejorada|Improved Initiative|C||+4 a la iniciativa.
Voluntad de hierro mejorada|Improved Iron Will|G|Voluntad de hierro|1/día repites una salvación de Voluntad.
Reflejos rápidos mejorados|Improved Lightning Reflexes|G|Reflejos rápidos|1/día repites una salvación de Reflejos.
Arrollar mejorado|Improved Overrun|C|Fue 13, Ataque poderoso, ataque base +1|Arrollar no provoca; +2 a arrollar y el objetivo no puede apartarse.
Disparo preciso mejorado|Improved Precise Shot|C|Des 19, Disparo a bocajarro, Disparo preciso, ataque base +11|Ignoras la cobertura y ocultación que no sean totales al disparar.
Ataque con escudo mejorado|Improved Shield Bash|C|Competencia con escudo|Golpeas con el escudo sin perder su bonificador a la CA.
Romper mejorado|Improved Sunder|C|Fue 13, Ataque poderoso, ataque base +1|Romper no provoca; +2 a romper y a la DMC contra roturas.
Derribo mejorado|Improved Trip|C|Int 13, Pericia en combate|Derribar no provoca; +2 a derribar y a la DMC contra derribos.
Combate con dos armas mejorado|Improved Two-Weapon Fighting|C|Des 17, Combate con dos armas, ataque base +6|Un segundo ataque con la mano torpe (−5).
Impacto sin armas mejorado|Improved Unarmed Strike|C||Tus golpes sin armas no provocan y pueden hacer daño letal.
Golpe vital mejorado|Improved Vital Strike|C|Golpe vital, ataque base +11|Golpe vital con tres veces los dados de daño.
Maestría con armas improvisadas|Improvised Weapon Mastery|C|Pillar desprevenido o Arrojar cualquier cosa, ataque base +8|+1 al ataque con armas improvisadas y hacen más daño.
Destreza intimidatoria|Intimidating Prowess|C||Sumas tu mod. de Fue a Intimidar además del de Car.
Voluntad de hierro|Iron Will|G||+2 a Voluntad.
Liderazgo|Leadership|G|Nivel 7|Atraes un lugarteniente y seguidores.
Reflejos rápidos|Lightning Reflexes|G||+2 a Reflejos.
Postura del relámpago|Lightning Stance|C|Des 17, Esquiva, Postura del viento, ataque base +11|50 % de ocultación si te mueves dos veces o retiras.
Estocada|Lunge|C|Ataque base +6|+5 pies de alcance este asalto a cambio de −2 a la CA.
Aptitud mágica|Magical Aptitude|G||+2 a Conocimiento de conjuros y Usar objeto mágico (+4 con 10 rangos).
Disparo múltiple|Manyshot|C|Des 17, Disparo a bocajarro, Disparo rápido, ataque base +6|El primer ataque de un ataque completo con arco dispara dos flechas.
Competencia con arma marcial|Martial Weapon Proficiency|C||Competente con un arma marcial.
Maestro artesano|Master Craftsman|G|5 rangos en Artesanía o Profesión|Usas esa habilidad para fabricar objetos mágicos y ganas Fabricar armas y armaduras mágicas o Fabricar objeto maravilloso.
Maximizar conjuro|Maximize Spell|M||Las variables numéricas del conjuro dan el máximo. Ocupa +3 niveles.
Ira de la medusa|Medusa's Wrath|C|Impacto sin armas mejorado, Puño de la gorgona, Estilo del escorpión, ataque base +11|Dos golpes sin armas más contra un enemigo aturdido, tambaleante o desprevenido.
Movilidad|Mobility|C|Des 13, Esquiva|+4 a la CA contra ataques de oportunidad al moverte.
Arquería montada|Mounted Archery|C|Montar 1 rango, Combate montado|Mitad de penalización al disparar a caballo.
Combate montado|Mounted Combat|C|Montar 1 rango|1/asalto, prueba de Montar para anular un golpe a tu montura.
Conjuro natural|Natural Spell|G|Sab 13, forma salvaje|Lanzas conjuros en forma salvaje.
Movimientos ágiles|Nimble Moves|G|Des 13|Te mueves 5 pies por terreno difícil por asalto como si fuera normal.
Golpe penetrante|Penetrating Strike|C|Soltura con un arma, nivel 12 de guerrero|Con esa arma ignoras 5 de RD.
Persuasivo|Persuasive|G||+2 a Diplomacia e Intimidar (+4 con 10 rangos).
Puntería certera|Pinpoint Targeting|C|Des 19, Disparo preciso mejorado, Disparo a bocajarro, Disparo preciso, ataque base +16|Un disparo contra la CA de toque ignorando armadura y escudo.
Disparo a bocajarro|Point-Blank Shot|C||+1 al ataque y al daño a distancia a 30 pies o menos.
Ataque poderoso|Power Attack|C|Fue 13, ataque base +1|−1 al ataque cuerpo a cuerpo y +2 al daño (+3 a dos manos); cada 4 de ataque base, −1/+2 más.
Disparo preciso|Precise Shot|C|Disparo a bocajarro|Sin −4 por disparar contra quien está en cuerpo a cuerpo.
Desenvainado rápido|Quick Draw|C|Ataque base +1|Desenvainas como acción gratuita.
Acelerar conjuro|Quicken Spell|M||Lanzas el conjuro como acción rápida. Ocupa +4 niveles.
Recarga rápida|Rapid Reload|C|Competencia con el arma (ballesta)|Recargar la ballesta ligera es acción gratuita (pesada: de movimiento).
Disparo rápido|Rapid Shot|C|Des 13, Disparo a bocajarro|Un ataque a distancia más, todos con −2.
Ataque al galope|Ride-By Attack|C|Montar 1 rango, Combate montado|Cargas a caballo y sigues moviéndote después.
Correr|Run|G||Corres a ×5 la velocidad; +4 a Acrobacias para saltar con carrerilla.
Estilo del escorpión|Scorpion Style|C|Impacto sin armas mejorado|Golpe sin armas: la velocidad del objetivo baja a 5 pies. Fort niega.
Escribir pergamino|Scribe Scroll|F|Nivel 1 de lanzador|Fabricas pergaminos.
Canalizar selectivo|Selective Channeling|G|Car 13, Canalizar energía|Excluyes de tu canalización a tantos objetivos como tu mod. de Car.
Autosuficiente|Self-Sufficient|G||+2 a Sanar y Supervivencia (+4 con 10 rangos).
Destrozar defensas|Shatter Defenses|C|Soltura con un arma, Exhibición deslumbrante, ataque base +6|Un enemigo estremecido, asustado o aterrorizado al que golpeas queda desprevenido ante ti.
Soltura con escudo|Shield Focus|C|Competencia con escudo, ataque base +1|+1 a la CA con escudo.
Maestro del escudo|Shield Master|C|Ataque con escudo mejorado, Competencia con escudo, Golpe con escudo, Combate con dos armas, ataque base +11|Sin penalización al atacar con escudo; suma su mejora al ataque.
Competencia con escudo|Shield Proficiency|C||Sin penalizador del escudo a los ataques.
Golpe con escudo|Shield Slam|C|Ataque con escudo mejorado, Competencia con escudo, Combate con dos armas, ataque base +6|Al golpear con el escudo, embistes gratis.
Disparo en movimiento|Shot on the Run|C|Des 13, Esquiva, Movilidad, Disparo a bocajarro, ataque base +4|Te mueves antes y después de un ataque a distancia.
Crítico nauseabundo|Sickening Critical|C|Soltura con los críticos, ataque base +11|Al confirmar un crítico, el objetivo queda indispuesto.
Conjuro silencioso|Silent Spell|M||Lanzas sin componente verbal. Ocupa +1 nivel.
Soltura con una habilidad|Skill Focus|G||+3 a una habilidad (+6 con 10 rangos).
Agarrar flechas|Snatch Arrows|C|Des 15, Desviar flechas, Impacto sin armas mejorado|Atrapas el proyectil que desvías y puedes devolverlo.
Soltura con una escuela de magia|Spell Focus|G||+1 a la CD de los conjuros de una escuela.
Dominio de conjuros|Spell Mastery|G|Nivel 1 de mago|Preparas unos conjuros elegidos sin libro.
Penetración de conjuros|Spell Penetration|G||+2 para superar la resistencia a conjuros.
Rompeconjuros|Spellbreaker|C|Disruptivo, nivel 10 de guerrero|Ataque de oportunidad a quien falle al lanzar a la defensiva junto a ti.
Carga briosa|Spirited Charge|C|Montar 1 rango, Combate montado, Ataque al galope|Doble daño al cargar a caballo (triple con lanza de caballería).
Ataque elástico|Spring Attack|C|Des 13, Esquiva, Movilidad, ataque base +4|Te mueves antes y después de un ataque cuerpo a cuerpo.
Crítico tambaleante|Staggering Critical|C|Soltura con los críticos, ataque base +13|Al confirmar un crítico, el objetivo queda tambaleante 1d4+1 asaltos.
Mantenerse firme|Stand Still|C|Reflejos de combate|Con un ataque de oportunidad, frenas en seco al que pasa por tu lado.
Sigiloso|Stealthy|G||+2 a Escapismo y Sigilo (+4 con 10 rangos).
Avanzar|Step Up|C|Ataque base +1|Si un enemigo adyacente se aparta 5 pies, le sigues.
Conjuro inmóvil|Still Spell|M||Lanzas sin componente somático. Ocupa +1 nivel.
Contraatacar|Strike Back|C|Ataque base +11|Preparas una acción para atacar al que te golpea desde fuera de tu alcance.
Crítico aturdidor|Stunning Critical|C|Soltura con los críticos, Crítico tambaleante, ataque base +17|Al confirmar un crítico, el objetivo queda aturdido 1d4 asaltos.
Puñetazo aturdidor|Stunning Fist|C|Des 13, Sab 13, Impacto sin armas mejorado, ataque base +8|1/día cada 4 niveles: golpe sin armas que aturde 1 asalto. Fort niega.
Arrojar cualquier cosa|Throw Anything|C||Sin penalización con armas improvisadas arrojadizas; +1 con armas de proyectil de área.
Crítico extenuante|Tiring Critical|C|Soltura con los críticos, ataque base +13|Al confirmar un crítico, el objetivo queda fatigado.
Dureza|Toughness|G||+3 PG, +1 por DG a partir del 4.º.
Competencia con escudo pavés|Tower Shield Proficiency|C|Competencia con escudo|Usas el escudo pavés sin penalización a los ataques.
Pisotear|Trample|C|Montar 1 rango, Combate montado|A caballo, arrollar no deja apartarse y la montura pisotea al caído.
Expulsar muertos vivientes|Turn Undead|G|Canalizar energía positiva|Gastas una canalización para que los muertos vivientes huyan. Vol niega.
Defensa con dos armas|Two-Weapon Defense|C|Des 15, Combate con dos armas|+1 de escudo a la CA con dos armas (+2 si luchas a la defensiva).
Combate con dos armas|Two-Weapon Fighting|C|Des 15|Reduce las penalizaciones por luchar con dos armas (−4/−4, o −2/−2 con arma ligera en la torpe).
Desgarro con dos armas|Two-Weapon Rend|C|Des 17, Doble tajo, Combate con dos armas mejorado, ataque base +11|Si aciertas con las dos armas, 1d10 + 1½ Fue más.
Desmontar|Unseat|C|Fue 13, Montar 1 rango, Combate montado, Embestida mejorada, Ataque poderoso, ataque base +1|Al acertar con la lanza a caballo, embistes para desmontar.
Golpe vital|Vital Strike|C|Ataque base +6|Acción de ataque: un solo golpe con el doble de dados de daño.
Sutileza con las armas|Weapon Finesse|C||Usas el mod. de Des en vez del de Fue al atacar con armas ligeras, estoque, látigo o cadena armada.
Soltura con un arma|Weapon Focus|C|Competencia con el arma, ataque base +1|+1 al ataque con un arma.
Especialización en un arma|Weapon Specialization|C|Soltura con el arma, nivel 4 de guerrero|+2 al daño con un arma.
Ataque en remolino|Whirlwind Attack|C|Des 13, Int 13, Pericia en combate, Esquiva, Movilidad, Ataque elástico, ataque base +4|Acción completa: un ataque contra cada enemigo a tu alcance.
Ampliar conjuro|Widen Spell|M||Duplica el área del conjuro. Ocupa +3 niveles.
Postura del viento|Wind Stance|C|Des 15, Esquiva, ataque base +6|20 % de ocultación contra ataques a distancia si te mueves más de 5 pies.
Competencia con arma exótica|Exotic Weapon Proficiency|C|Ataque base +1|Competente con un arma exótica.
Competencia con arma sencilla|Simple Weapon Proficiency|C||Competente con todas las armas sencillas.
`;

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const DOTES: Dote[] = DATOS.trim().split("\n").filter((l) => l.trim()).map((l) => {
  const [nombre, ingles, tipo, requisitos, texto] = l.split("|");
  return { clave: slug(nombre), nombre, ingles, tipo: TIPOS[tipo] ?? "general", requisitos, texto };
}).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

export { slug };
