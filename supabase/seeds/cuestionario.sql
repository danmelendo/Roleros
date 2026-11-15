-- =============================================================================
-- Cuestionario "inocente" para preparar los personajes.
--
--   npm run sql -- supabase/seeds/cuestionario.sql
--
-- Idempotente y SIN borrar respuestas: actualiza por id. OJO: la validación
-- compara el texto exacto de la opción, así que cambiar el texto de una opción
-- deja fuera las respuestas ya dadas con el texto viejo (se siguen viendo en
-- el panel, solo dejan de salir marcadas).
--
-- Público a propósito: no dice nada de la trama. La interpretación de cada
-- respuesta (qué clase, atributo o habilidad sugiere) va en master/, fuera de git.
-- =============================================================================

insert into public.cuestionario_preg (id, orden, texto, opciones, libre, activa) values
(1, 1, 'Una puerta cerrada con llave os separa de algo que necesitáis. ¿Qué haces?',
 '["La echo abajo.",
   "Busco otra forma de entrar: una ventana, el tejado, una rendija.",
   "Fuerzo la cerradura con calma.",
   "Llamo y convenzo a quien esté dentro de que me abra.",
   "Examino la puerta: seguro que tiene algún truco."]', true, true),

(2, 2, 'Empieza una pelea. ¿Dónde te ves?',
 '["En primera línea, aguantando los golpes para que no lleguen a los demás.",
   "Pegando lo más fuerte que pueda, aunque me lleve algún golpe.",
   "A distancia, con arco o ballesta.",
   "Moviéndome por los lados, buscando el punto débil.",
   "Detrás, con algo más poderoso que un arma."]', true, true),

(3, 3, 'Alguien del grupo cae herido en mitad del combate. ¿Qué haces?',
 '["Le curo yo, como sea.",
   "Me pongo delante para que nadie le remate.",
   "Acabo cuanto antes con lo que le ha herido.",
   "Busco un sitio seguro y pienso un plan."]', true, true),

(4, 4, 'En el mercado puedes llevarte una sola cosa. ¿Cuál eliges?',
 '["Un arma de buena calidad.",
   "Una armadura que no me estorbe al moverme.",
   "Un libro antiguo que nadie sabe leer.",
   "Un amuleto que dicen que trae suerte.",
   "Un poco de todo: cuerda, ganzúas, una linterna…",
   "Un animal: un perro, un halcón, un caballo."]', true, true),

(5, 5, 'Llegáis a la taberna de un pueblo. ¿Qué haces?',
 '["Me siento en un rincón y escucho los rumores.",
   "Invito a una ronda y hago amigos.",
   "Echo un pulso o apuesto a los dados.",
   "Pregunto por el sacerdote o por el sabio del lugar.",
   "Me quedo fuera: prefiero el aire libre."]', true, true),

(6, 6, '¿Cómo te imaginas a tu personaje?',
 '["Humano, como cualquiera.",
   "Enano: bajo, fuerte y testarudo.",
   "Elfo: esbelto y de oído fino.",
   "Mediano: pequeño, ágil y con suerte.",
   "Gnomo: pequeño, curioso y algo raro.",
   "Semiorco: grande y que impone.",
   "Semielfo: entre dos mundos."]', true, true),

(7, 7, '¿Qué es lo que más te divierte de una partida?',
 '["Tirar muchos dados y hacer mucho daño.",
   "Ver cómo mi personaje se va haciendo más fuerte.",
   "Resolver misterios y atar cabos.",
   "Hablar con los personajes y meterme en el papel.",
   "Explorar sitios nuevos y encontrar cosas."]', true, true)

on conflict (id) do update set
  orden = excluded.orden, texto = excluded.texto, opciones = excluded.opciones,
  libre = excluded.libre, activa = excluded.activa;

-- Que el próximo id automático no choque con los fijos de arriba.
select setval(pg_get_serial_sequence('public.cuestionario_preg', 'id'),
              greatest((select max(id) from public.cuestionario_preg), 1));
