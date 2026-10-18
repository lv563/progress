export type BibleCategory =
  | 'patriarcas'
  | 'reyes'
  | 'profetas'
  | 'jueces'
  | 'apostoles'
  | 'mujeres'
  | 'at'
  | 'nt'
  | 'fe-obediencia'
  | 'errores-restauracion'
  | 'menos-conocidos'

export interface BibleCharacter {
  id: string
  name: string
  emoji: string
  categories: BibleCategory[]
  era: string
  summary: string
  context: string
  lessons: string[]
  references: string[]
  passages: { ref: string; summary: string }[]
  studyQuestions: { observation: string[]; interpretation: string[]; application: string[] }
}

export const BIBLE_CHARACTERS: BibleCharacter[] = [
  {
    id: 'abraham',
    name: 'Abraham',
    emoji: '🌟',
    categories: ['patriarcas', 'at', 'fe-obediencia'],
    era: 'c. 2100–1925 a.C.',
    summary: 'Llamado "padre de la fe", Abraham dejó su tierra natal al oír el llamado de Dios y confió en Sus promesas incluso cuando las circunstancias parecían imposibles.',
    context: 'Vivió en Ur de los caldeos (actual Iraq). Dios le prometió tierra, descendencia numerosa y ser bendición para todas las naciones. Su fe fue probada culminando en el mandato de ofrecer a su hijo Isaac.',
    lessons: ['La fe actúa aunque no haya evidencia visible', 'La obediencia a Dios puede requerir dejar lo conocido', 'Dios cumple Sus promesas aunque tarden'],
    references: ['Génesis 12–25', 'Romanos 4', 'Hebreos 11:8-19'],
    passages: [
      { ref: 'Génesis 12:1-9', summary: 'El llamado de Dios y la partida de Abraham' },
      { ref: 'Génesis 15', summary: 'El pacto de Dios con Abraham' },
      { ref: 'Génesis 22:1-19', summary: 'La prueba de Abraham con Isaac' },
    ],
    studyQuestions: {
      observation: ['¿Qué le pidió Dios a Abraham en Génesis 12?', '¿Cuántos años tenía Abraham cuando nació Isaac?'],
      interpretation: ['¿Por qué la fe de Abraham fue contada como justicia (Romanos 4)?', '¿Qué simbolizaba el sacrificio de Isaac?'],
      application: ['¿En qué área de tu vida necesitas confiar en las promesas de Dios?', '¿Qué "tierra conocida" podrías estar aferrando que Dios te pide soltar?'],
    },
  },
  {
    id: 'moises',
    name: 'Moisés',
    emoji: '🔥',
    categories: ['profetas', 'at', 'fe-obediencia'],
    era: 'c. 1526–1406 a.C.',
    summary: 'Libertador del pueblo de Israel, receptor de la Ley de Dios y mediador del pacto del Sinaí. Guió a Israel durante 40 años en el desierto.',
    context: 'Nacido en Egipto durante la esclavitud israelita, criado en el palacio del faraón. Huyó a Madián tras matar a un egipcio. Dios lo llamó desde la zarza ardiente para liberar a su pueblo.',
    lessons: ['Dios usa personas imperfectas y temerosas', 'La humildad es necesaria para el liderazgo', 'La intercesión fiel por otros tiene poder'],
    references: ['Éxodo 1–40', 'Deuteronomio 34', 'Hebreos 11:23-29'],
    passages: [
      { ref: 'Éxodo 3:1-15', summary: 'El llamado de Moisés en la zarza ardiente' },
      { ref: 'Éxodo 14:10-31', summary: 'La apertura del Mar Rojo' },
      { ref: 'Éxodo 20:1-17', summary: 'Los Diez Mandamientos' },
    ],
    studyQuestions: {
      observation: ['¿Qué excusas dio Moisés cuando Dios lo llamó?', '¿Cuáles fueron las 10 plagas de Egipto?'],
      interpretation: ['¿Por qué Moisés no pudo entrar a la tierra prometida?', '¿Qué representa el maná en el desierto?'],
      application: ['¿Qué excusas usas para no obedecer el llamado de Dios?', '¿Cómo puedes interceder por tu familia o comunidad?'],
    },
  },
  {
    id: 'jose',
    name: 'José',
    emoji: '👑',
    categories: ['patriarcas', 'at', 'fe-obediencia', 'errores-restauracion'],
    era: 'c. 1915–1805 a.C.',
    summary: 'Vendido como esclavo por sus hermanos, pasó por falsas acusaciones y prisión, hasta llegar a ser gobernador de Egipto. Su historia muestra cómo Dios obra en el sufrimiento.',
    context: 'Hijo favorito de Jacob, fue traicionado por sus hermanos. En Egipto sirvió a Potifar, fue acusado falsamente, encarcelado, y finalmente exaltado por interpretar los sueños del faraón.',
    lessons: ['Dios puede transformar el sufrimiento en propósito', 'El perdón genuino libera al que perdona', 'La integridad en las pruebas tiene recompensa'],
    references: ['Génesis 37–50', 'Salmo 105:17-22'],
    passages: [
      { ref: 'Génesis 37:1-28', summary: 'La traición y venta de José' },
      { ref: 'Génesis 39', summary: 'José en la casa de Potifar; su integridad' },
      { ref: 'Génesis 45:1-15', summary: 'José revela su identidad y perdona a sus hermanos' },
    ],
    studyQuestions: {
      observation: ['¿Por qué sus hermanos odiaban a José?', '¿Cómo llegó José a ser gobernador de Egipto?'],
      interpretation: ['¿Qué dijo José sobre el propósito divino detrás de su sufrimiento (Génesis 50:20)?', '¿Qué nos enseña la integridad de José ante la esposa de Potifar?'],
      application: ['¿Hay alguien en tu vida a quien necesitas perdonar como José perdonó a sus hermanos?', '¿Cómo puedes mantener integridad cuando nadie te observa?'],
    },
  },
  {
    id: 'david',
    name: 'David',
    emoji: '🎸',
    categories: ['reyes', 'at', 'fe-obediencia', 'errores-restauracion'],
    era: 'c. 1040–970 a.C.',
    summary: 'Pastor, poeta, guerrero y rey de Israel. Llamado "varón conforme al corazón de Dios". Su vida incluye grandes victorias, graves pecados y profundo arrepentimiento.',
    context: 'Elegido rey siendo joven pastor, venció a Goliat y unificó a Israel. Su pecado con Betsabé y contra Urías lo llevó a una crisis espiritual de la que se arrepintió profundamente (Salmo 51).',
    lessons: ['Un corazón arrepentido puede ser restaurado por Dios', 'El orgullo y la ociosidad abren puertas al pecado', 'La alabanza en medio de la prueba fortalece la fe'],
    references: ['1 Samuel 16–31', '2 Samuel 1–24', 'Salmo 23', 'Salmo 51'],
    passages: [
      { ref: '1 Samuel 17:40-51', summary: 'David derrota a Goliat' },
      { ref: '2 Samuel 11:1-27', summary: 'El pecado de David con Betsabé' },
      { ref: 'Salmo 51', summary: 'La oración de arrepentimiento de David' },
    ],
    studyQuestions: {
      observation: ['¿Cuántos años reinó David sobre Israel?', '¿Qué hizo el profeta Natán para confrontar a David?'],
      interpretation: ['¿Por qué Dios describió a David como "varón conforme a su corazón" a pesar de sus pecados?', '¿Qué diferencia hay entre el arrepentimiento de David y el de Saúl?'],
      application: ['¿Cómo respondes al ser confrontado con tus errores?', '¿Qué área de tu vida requiere el tipo de honestidad del Salmo 51?'],
    },
  },
  {
    id: 'daniel',
    name: 'Daniel',
    emoji: '🦁',
    categories: ['profetas', 'at', 'fe-obediencia'],
    era: 'c. 620–536 a.C.',
    summary: 'Joven hebreo llevado cautivo a Babilonia que mantuvo su fe e integridad en un ambiente pagano. Famoso por sobrevivir el foso de los leones y sus profecías.',
    context: 'Fue llevado a Babilonia por Nabucodonosor. Se rehusó a contaminarse con la comida del rey. Dios lo dotó de sabiduría y capacidad para interpretar sueños. Sirvió bajo varios reyes babilonios y persas.',
    lessons: ['La integridad no negocia sus convicciones ante la presión cultural', 'La oración constante y disciplinada es fundamento de la fe', 'Dios honra a quienes lo honran en público'],
    references: ['Daniel 1–12'],
    passages: [
      { ref: 'Daniel 1:1-21', summary: 'Daniel y sus amigos se niegan a contaminarse' },
      { ref: 'Daniel 6:1-23', summary: 'Daniel en el foso de los leones' },
      { ref: 'Daniel 3:8-30', summary: 'Los tres amigos en el horno de fuego' },
    ],
    studyQuestions: {
      observation: ['¿Qué propósito tenía la dieta del rey para los jóvenes hebreos?', '¿Por qué echaron a Daniel al foso de los leones?'],
      interpretation: ['¿Qué nos enseña Daniel 6:10 sobre la disciplina espiritual en tiempos de presión?', '¿Cómo respondió Dario después de ver el milagro?'],
      application: ['¿Qué compromisos espirituales mantienes incluso bajo presión social?', '¿Cómo cultivas una vida de oración disciplinada como Daniel?'],
    },
  },
  {
    id: 'ester',
    name: 'Ester',
    emoji: '👸',
    categories: ['mujeres', 'at', 'fe-obediencia'],
    era: 'c. 480 a.C.',
    summary: 'Joven judía que se convirtió en reina de Persia y arriesgó su vida para salvar a su pueblo del genocidio planeado por Amán.',
    context: 'Huérfana criada por su primo Mardoqueo, fue elegida reina por el rey Asuero. Cuando Amán tramó exterminar a los judíos, Ester se acercó al rey sin ser llamada, arriesgando su vida.',
    lessons: ['Dios coloca personas en posiciones estratégicas con un propósito mayor', '"¿Y quién sabe si para esta hora has llegado al reino?" — Ester 4:14', 'El valor es actuar a pesar del miedo, no la ausencia de miedo'],
    references: ['Ester 1–10'],
    passages: [
      { ref: 'Ester 4:1-17', summary: 'Mardoqueo pide a Ester que interceda por el pueblo' },
      { ref: 'Ester 5:1-8', summary: 'Ester se presenta ante el rey' },
      { ref: 'Ester 8:1-17', summary: 'El decreto de salvación para los judíos' },
    ],
    studyQuestions: {
      observation: ['¿Por qué era peligroso para Ester acercarse al rey sin ser llamada?', '¿Qué preparación hizo Ester antes de acercarse al rey?'],
      interpretation: ['¿Por qué es significativa la frase "para esta hora" en el contexto del libro?', '¿Qué papel jugó el ayuno en la historia de Ester?'],
      application: ['¿En qué posición o momento de tu vida sientes que Dios te tiene "para esta hora"?', '¿Hay algo que necesitas hacer con valentía aunque sea riesgoso?'],
    },
  },
  {
    id: 'rut',
    name: 'Rut',
    emoji: '🌾',
    categories: ['mujeres', 'at', 'fe-obediencia'],
    era: 'c. 1100 a.C.',
    summary: 'Mujer moabita que eligió permanecer con su suegra Noemí y adoptar el Dios de Israel. Su lealtad fue recompensada y se convirtió en antepasada de Jesús.',
    context: 'Quedó viuda junto a Noemí. En vez de volver a su pueblo, eligió ir con Noemí a Belén. Recogía espigas en los campos de Booz, quien la notó y eventualmente se casó con ella, siendo "pariente redentor".',
    lessons: ['La lealtad y el amor comprometido reflejan el carácter de Dios', 'Dios honra a quienes confían en Él fuera de sus circunstancias naturales', 'El servicio humilde abre puertas que el orgullo cierra'],
    references: ['Rut 1–4', 'Mateo 1:5'],
    passages: [
      { ref: 'Rut 1:14-18', summary: 'La declaración de lealtad de Rut a Noemí' },
      { ref: 'Rut 2:1-23', summary: 'Rut recoge espigas en el campo de Booz' },
      { ref: 'Rut 4:13-17', summary: 'El matrimonio y el nacimiento de Obed' },
    ],
    studyQuestions: {
      observation: ['¿Qué significa "pariente redentor" en la cultura israelita?', '¿Qué respondió Rut cuando Noemí le pidió que regresara a Moab?'],
      interpretation: ['¿Cómo refleja la historia de Booz y Rut la redención de Cristo?', '¿Por qué es significativo que Rut, una extranjera, esté en la genealogía de Jesús?'],
      application: ['¿A quién necesitas mostrar lealtad incondicional en tu vida?', '¿Cómo defines el compromiso en tus relaciones más importantes?'],
    },
  },
  {
    id: 'nehemias',
    name: 'Nehemías',
    emoji: '🏗️',
    categories: ['at', 'menos-conocidos', 'fe-obediencia'],
    era: 'c. 445 a.C.',
    summary: 'Copero del rey persa que lideró la reconstrucción de los muros de Jerusalén con visión, oración, planificación y determinación ante la oposición.',
    context: 'Al enterarse de que los muros de Jerusalén estaban destruidos, lloró, ayunó y oró. Pidió permiso al rey Artajerjes, regresó a Jerusalén y organizó al pueblo para reconstruir los muros en 52 días a pesar de la oposición de Sanbalat y Tobías.',
    lessons: ['La oración precede a la acción', 'Una visión clara mueve a la comunidad', 'La perseverancia ante la oposición es señal de llamado genuino'],
    references: ['Nehemías 1–13'],
    passages: [
      { ref: 'Nehemías 1:1-11', summary: 'La oración de Nehemías por Jerusalén' },
      { ref: 'Nehemías 2:1-18', summary: 'Nehemías obtiene permiso y regresa a Jerusalén' },
      { ref: 'Nehemías 6:1-16', summary: 'Los muros son terminados en 52 días' },
    ],
    studyQuestions: {
      observation: ['¿Cuánto tiempo tardaron en reconstruir los muros?', '¿Cuáles fueron las tácticas de Sanbalat para detener la obra?'],
      interpretation: ['¿Por qué es significativo que Nehemías orara antes de hablar con el rey?', '¿Qué nos enseña Nehemías 4:9 sobre la relación entre oración y acción?'],
      application: ['¿Qué "muro" necesitas reconstruir en tu vida (relaciones, disciplinas, fe)?', '¿Qué oposición enfrentas y cómo puedes persistir como Nehemías?'],
    },
  },
  {
    id: 'pedro',
    name: 'Pedro',
    emoji: '⛵',
    categories: ['apostoles', 'nt', 'errores-restauracion'],
    era: 'c. 1–68 d.C.',
    summary: 'Pescador llamado por Jesús que se convirtió en líder de los apóstoles. Conocido por su impulsividad, su negación de Cristo y su radical restauración y proclamación del evangelio.',
    context: 'Simón Pedro era pescador en el Mar de Galilea. Fue uno de los primeros llamados por Jesús y parte del círculo íntimo. Negó a Cristo tres veces pero fue restaurado y predicó el primer sermón de Pentecostés (Hechos 2).',
    lessons: ['La restauración de Dios es más grande que nuestros fracasos', 'El llamado de Dios no depende de la perfección sino de la disposición', 'La humildad viene después de la caída'],
    references: ['Mateo 4:18-20', 'Mateo 16:13-20', 'Lucas 22:54-62', 'Juan 21:15-19', 'Hechos 2'],
    passages: [
      { ref: 'Mateo 14:28-31', summary: 'Pedro camina sobre el agua' },
      { ref: 'Lucas 22:54-62', summary: 'Pedro niega a Jesús tres veces' },
      { ref: 'Juan 21:15-19', summary: 'Jesús restaura a Pedro' },
    ],
    studyQuestions: {
      observation: ['¿Cuántas veces negó Pedro a Jesús y en qué circunstancias?', '¿Qué pregunta le hizo Jesús a Pedro tres veces en Juan 21?'],
      interpretation: ['¿Por qué la restauración de Pedro fue individual y personal?', '¿Qué significa que Jesús le llamara "piedra" a alguien tan inestable?'],
      application: ['¿Cómo te relacionas con el fracaso espiritual personal?', '¿Qué necesitas para ser restaurado como Pedro?'],
    },
  },
  {
    id: 'pablo',
    name: 'Pablo',
    emoji: '✉️',
    categories: ['apostoles', 'nt', 'fe-obediencia', 'errores-restauracion'],
    era: 'c. 5–67 d.C.',
    summary: 'De perseguidor de la Iglesia a su más prolífico misionero y escritor. Sus cartas forman gran parte del Nuevo Testamento. Transformado por un encuentro radical con Cristo.',
    context: 'Fariseo educado con Gamaliel que perseguía a los cristianos, presenció la muerte de Esteban. En el camino a Damasco tuvo un encuentro con Cristo resucitado. Realizó tres viajes misioneros por el Mediterráneo y escribió 13 epístolas.',
    lessons: ['Nadie está más allá de la gracia de Dios', 'El sufrimiento por Cristo tiene un propósito eterno', 'Aprender a estar contento en toda circunstancia (Filipenses 4:11)'],
    references: ['Hechos 9', 'Gálatas 1–2', 'Filipenses 3', '2 Corintios 11:23-33'],
    passages: [
      { ref: 'Hechos 9:1-19', summary: 'La conversión de Pablo en el camino a Damasco' },
      { ref: 'Filipenses 4:11-13', summary: '"Todo lo puedo en Cristo que me fortalece"' },
      { ref: '2 Corintios 12:7-10', summary: 'La gracia de Dios en la debilidad' },
    ],
    studyQuestions: {
      observation: ['¿Cuántos años pasaron entre la conversión de Pablo y su primer viaje misionero?', '¿Qué sufrimientos enumeró Pablo en 2 Corintios 11?'],
      interpretation: ['¿Qué significa que "la gracia es suficiente" en el contexto del aguijón de Pablo?', '¿Por qué Pablo consideró su pasado de perseguidor como "pérdida" (Filipenses 3)?'],
      application: ['¿Qué "aguijón en la carne" llevas tú y cómo lo ves a la luz de 2 Corintios 12?', '¿Cómo puedes "aprender el contentamiento" como Pablo?'],
    },
  },
  {
    id: 'maria-magdalena',
    name: 'María Magdalena',
    emoji: '🕊️',
    categories: ['mujeres', 'nt', 'errores-restauracion'],
    era: 'c. 1–70 d.C.',
    summary: 'Primera testigo de la resurrección de Jesús. Fue liberada de siete demonios y se convirtió en seguidora fiel hasta la crucifixión y más allá.',
    context: 'De Magdala, fue liberada por Jesús de siete demonios. Estuvo presente en la crucifixión cuando muchos discípulos huyeron. Fue la primera persona en ver a Jesús resucitado y la primera en anunciarlo.',
    lessons: ['La gratitud profunda nace de haber recibido mucho perdón', 'Fidelidad en los momentos difíciles define el carácter', 'Dios confía la primera proclamación de la resurrección a quien fue fiel'],
    references: ['Lucas 8:1-3', 'Juan 19:25', 'Juan 20:1-18', 'Marcos 16:9'],
    passages: [
      { ref: 'Lucas 8:1-3', summary: 'María Magdalena entre las seguidoras de Jesús' },
      { ref: 'Juan 19:25', summary: 'Presente en la crucifixión' },
      { ref: 'Juan 20:11-18', summary: 'Primer testigo de la resurrección' },
    ],
    studyQuestions: {
      observation: ['¿Por qué María Magdalena no reconoció a Jesús al principio en el huerto?', '¿Qué le dijo Jesús que le fuera a decir a los discípulos?'],
      interpretation: ['¿Por qué es significativo que Jesús se apareciera primero a una mujer en la cultura del siglo I?', '¿Qué nos dice sobre el carácter de Dios el hecho de que Jesús liberara a María?'],
      application: ['¿Qué te ha liberado Dios que te lleva a seguirle con fidelidad?', '¿Estás presente en los momentos difíciles o tiendes a retirarte cuando hay presión?'],
    },
  },
  {
    id: 'debora',
    name: 'Débora',
    emoji: '⚖️',
    categories: ['jueces', 'mujeres', 'at', 'fe-obediencia'],
    era: 'c. 1200 a.C.',
    summary: 'Única jueza y profetisa de Israel, lideró al pueblo en un momento de opresión y condujo la victoria sobre el ejército de Sísara.',
    context: 'En un período donde "cada uno hacía lo que bien le parecía", Débora juzgaba a Israel bajo una palmera. Llamó a Barac para enfrentar al general Sísara, y cuando él titubeó, ella fue a la batalla como había prometido.',
    lessons: ['El liderazgo efectivo no requiere género ni condiciones perfectas', 'La sabiduría y la valentía pueden coexistir', 'Dios levanta líderes inesperados cuando el pueblo necesita dirección'],
    references: ['Jueces 4–5'],
    passages: [
      { ref: 'Jueces 4:1-10', summary: 'Débora llama a Barac y acepta ir a la batalla' },
      { ref: 'Jueces 4:14-24', summary: 'La victoria sobre Sísara' },
      { ref: 'Jueces 5', summary: 'El cántico de Débora' },
    ],
    studyQuestions: {
      observation: ['¿Qué cargos tenía Débora simultáneamente?', '¿Cuál fue la consecuencia que anunció Débora por la duda de Barac?'],
      interpretation: ['¿Por qué fue notable el liderazgo de Débora en el contexto cultural de Israel?', '¿Qué indica el cántico de Débora sobre cómo celebraba las victorias?'],
      application: ['¿Cómo ejerces liderazgo en el área donde Dios te ha colocado?', '¿Qué victorias celebras con gratitud a Dios?'],
    },
  },
  {
    id: 'elias',
    name: 'Elías',
    emoji: '⚡',
    categories: ['profetas', 'at', 'fe-obediencia'],
    era: 'c. 875–850 a.C.',
    summary: 'Profeta de fuego que desafió a 450 profetas de Baal en el Monte Carmelo. También conocido por su vulnerabilidad humana después de la victoria.',
    context: 'Sirvió durante el reinado del malvado Acab. Anunció la sequía, sobrevivió milagrosamente, confrontó al rey, y venció a los profetas de Baal. Luego entró en depresión severa, pero Dios lo ministró con agua y comida.',
    lessons: ['Los grandes hombres de Dios también pasan por depresión', 'Dios se manifiesta en la voz apacible y delicada, no siempre en el espectáculo', 'El celo por Dios requiere descanso y cuidado del cuerpo'],
    references: ['1 Reyes 17–21', '2 Reyes 2', 'Santiago 5:17-18'],
    passages: [
      { ref: '1 Reyes 18:20-40', summary: 'El desafío en el Monte Carmelo' },
      { ref: '1 Reyes 19:1-18', summary: 'La depresión de Elías y el cuidado de Dios' },
      { ref: '2 Reyes 2:1-12', summary: 'Elías es llevado al cielo en torbellino' },
    ],
    studyQuestions: {
      observation: ['¿Cuántos profetas de Baal desafió Elías en el Carmelo?', '¿Qué le dijo Dios a Elías cuando quería morir?'],
      interpretation: ['¿Por qué Dios aparece en una "voz apacible" en vez del fuego o el viento?', '¿Qué nos enseña la depresión de Elías sobre la humanidad de los héroes de fe?'],
      application: ['¿Cómo cuidas tu salud emocional y física en el servicio a Dios?', '¿Escuchas la voz apacible de Dios o buscas solo lo espectacular?'],
    },
  },
  {
    id: 'josias',
    name: 'Josías',
    emoji: '📜',
    categories: ['reyes', 'at', 'fe-obediencia'],
    era: 'c. 640–609 a.C.',
    summary: 'Uno de los mejores reyes de Judá, comenzó a reinar a los 8 años. Redescubrió el libro de la Ley y lideró una reforma religiosa profunda.',
    context: 'Nieto del malvado rey Manasés, rompió el patrón familiar. A los 16 años comenzó a buscar a Dios. A los 26, mientras restauraban el templo, encontraron el libro de la Ley. Al oírlo, rasgó sus vestidos y guió al pueblo al arrepentimiento.',
    lessons: ['Un líder joven puede marcar diferencia cuando busca a Dios', 'El retorno a la Palabra de Dios produce transformación', 'No estamos destinados a repetir los pecados de nuestros padres'],
    references: ['2 Reyes 22–23', '2 Crónicas 34–35'],
    passages: [
      { ref: '2 Reyes 22:1-13', summary: 'Josías encuentra el libro de la Ley' },
      { ref: '2 Reyes 23:1-25', summary: 'La reforma religiosa de Josías' },
      { ref: '2 Crónicas 34:3-7', summary: 'La búsqueda temprana de Dios por Josías' },
    ],
    studyQuestions: {
      observation: ['¿A qué edad empezó Josías a buscar a Dios?', '¿Qué reformas específicas llevó a cabo Josías?'],
      interpretation: ['¿Por qué fue impactante que Josías llorara al escuchar la Ley?', '¿Qué dice este hecho sobre el poder de la Palabra de Dios sobre un corazón receptivo?'],
      application: ['¿Hay patrones de tu familia de origen que necesitas romper por decisión propia?', '¿Cuándo fue la última vez que la lectura de la Biblia te movió al arrepentimiento?'],
    },
  },
  {
    id: 'bernabe',
    name: 'Bernabé',
    emoji: '🤝',
    categories: ['apostoles', 'nt', 'fe-obediencia', 'menos-conocidos'],
    era: 'c. 1–61 d.C.',
    summary: '"Hijo de consolación". Fue el mentor que abrió puertas a Pablo, defendió a Juan Marcos, y sirvió como modelo de generosidad y generosidad en la Iglesia primitiva.',
    context: 'Levita chipriota que vendió un terreno y donó el dinero a los apóstoles. Fue quien introdujo a Pablo (recién convertido) a los apóstoles cuando todos le temían. Más tarde defendió a Juan Marcos cuando Pablo no quiso llevarlo.',
    lessons: ['El discipulado y la segunda oportunidad son esenciales para el cuerpo de Cristo', 'La generosidad extravagante impacta comunidades enteras', 'A veces el llamado es respaldar a otros, no ser el protagonista'],
    references: ['Hechos 4:36-37', 'Hechos 9:26-27', 'Hechos 11:22-26', 'Hechos 15:36-41'],
    passages: [
      { ref: 'Hechos 4:36-37', summary: 'Bernabé dona sus tierras a la comunidad' },
      { ref: 'Hechos 9:26-27', summary: 'Bernabé presenta a Pablo ante los apóstoles' },
      { ref: 'Hechos 15:36-41', summary: 'Bernabé defiende a Juan Marcos' },
    ],
    studyQuestions: {
      observation: ['¿Por qué el nombre Bernabé fue dado por los apóstoles?', '¿Por qué Pablo y Bernabé se separaron?'],
      interpretation: ['¿Por qué Bernabé defendió a Pablo cuando todos le temían?', '¿Qué nos enseña el conflicto de Bernabé con Pablo sobre las segundas oportunidades?'],
      application: ['¿A quién estás siendo mentor o dando una segunda oportunidad?', '¿Cuándo fue la última vez que tu generosidad implicó un sacrificio real?'],
    },
  },
  {
    id: 'noe',
    name: 'Noé',
    emoji: '🚢',
    categories: ['patriarcas', 'at', 'fe-obediencia'],
    era: 'c. 2900 a.C. (cronología bíblica)',
    summary: 'Hombre justo en su generación que obedeció a Dios construyendo el arca durante décadas, preservando la vida en la tierra durante el diluvio.',
    context: 'En un mundo corrompido, Noé "halló gracia ante los ojos de Jehová". Construyó el arca según instrucciones precisas y salvó a su familia y a los animales del diluvio. Después del diluvio, Dios estableció un pacto con él.',
    lessons: ['La obediencia a largo plazo requiere fe sostenida sin ver resultados inmediatos', 'Ser diferente a la cultura no es error, es llamado', 'Los pactos de Dios tienen señales visibles (el arcoíris)'],
    references: ['Génesis 6–9', 'Hebreos 11:7', '1 Pedro 3:20'],
    passages: [
      { ref: 'Génesis 6:5-22', summary: 'Dios llama a Noé a construir el arca' },
      { ref: 'Génesis 7:1-24', summary: 'El diluvio' },
      { ref: 'Génesis 9:1-17', summary: 'El pacto del arcoíris' },
    ],
    studyQuestions: {
      observation: ['¿Cuántos años tardó Noé en construir el arca?', '¿Cuántas personas se salvaron en el arca?'],
      interpretation: ['¿Por qué Noé es mencionado en el "salón de la fe" de Hebreos 11?', '¿Qué simboliza el arcoíris como señal del pacto?'],
      application: ['¿Estás dispuesto a hacer algo que te haga ver "diferente" por obediencia a Dios?', '¿Qué proyectos de obediencia a largo plazo has abandonado por falta de resultados inmediatos?'],
    },
  },
  {
    id: 'jeremias',
    name: 'Jeremías',
    emoji: '😢',
    categories: ['profetas', 'at', 'errores-restauracion'],
    era: 'c. 627–586 a.C.',
    summary: 'El "profeta llorón". Llamado desde joven, predijo la caída de Jerusalén y sufrió persecución por décadas sin ver resultados. Modelo de fidelidad en el sufrimiento.',
    context: 'Fue llamado siendo joven, se resistió ("soy un niño"). Predicó durante 40 años sin ver conversiones masivas. Fue encarcelado, arrojado a un pozo y vio la destrucción de Jerusalén. Escribió Lamentaciones.',
    lessons: ['La fidelidad no siempre se mide por resultados visibles', 'La honestidad con Dios sobre el dolor es parte de la fe', 'El mensaje de Dios debe proclamarse aunque nadie lo reciba'],
    references: ['Jeremías 1–52', 'Lamentaciones 3:22-23'],
    passages: [
      { ref: 'Jeremías 1:4-10', summary: 'El llamado y la resistencia de Jeremías' },
      { ref: 'Jeremías 20:7-18', summary: 'La queja honesta de Jeremías ante Dios' },
      { ref: 'Lamentaciones 3:22-26', summary: '"Sus misericordias son nuevas cada mañana"' },
    ],
    studyQuestions: {
      observation: ['¿Cuánto tiempo predicó Jeremías antes de la caída de Jerusalén?', '¿Cuáles fueron algunas de las persecuciones que sufrió Jeremías?'],
      interpretation: ['¿Por qué es válido quejarse ante Dios como Jeremías en el capítulo 20?', '¿Qué esperanza encontró Jeremías en medio del desastre (Lamentaciones 3)?'],
      application: ['¿Sigues siendo fiel en un área donde no ves resultados?', '¿Cómo procesas el dolor y la decepción espiritual?'],
    },
  },
  {
    id: 'juan-bautista',
    name: 'Juan el Bautista',
    emoji: '🌊',
    categories: ['profetas', 'nt', 'fe-obediencia'],
    era: 'c. 5 a.C.–c. 30 d.C.',
    summary: '"La voz que clama en el desierto." Preparó el camino para Jesús, lo bautizó, y declaró "es necesario que él crezca y que yo mengüe" — el mayor ejemplo de humildad ministerial.',
    context: 'Hijo de Zacarías e Isabel (prima de María). Vivía en el desierto, vestía de pelo de camello. Predicaba arrepentimiento y bautizaba en el río Jordán. Fue encarcelado por Herodes por confrontar su adulterio y finalmente decapitado.',
    lessons: ['"Es necesario que él crezca y que yo mengüe" — Juan 3:30', 'La grandeza en el reino viene del servicio, no del reconocimiento', 'Incluso los siervos de Dios enfrentan dudas en el sufrimiento'],
    references: ['Lucas 1', 'Mateo 3', 'Juan 1:19-34', 'Juan 3:22-36', 'Mateo 11:2-15'],
    passages: [
      { ref: 'Mateo 3:1-17', summary: 'Juan bautiza a Jesús' },
      { ref: 'Juan 3:22-30', summary: '"Él debe crecer y yo debo menguar"' },
      { ref: 'Mateo 11:2-15', summary: 'Juan duda desde la cárcel; Jesús lo elogia' },
    ],
    studyQuestions: {
      observation: ['¿Por qué fue Jesús a bautizarse por Juan si no tenía pecado?', '¿Qué le preguntó Juan a Jesús desde la cárcel?'],
      interpretation: ['¿Qué significa la actitud de Juan de "menguar"?', '¿Por qué Jesús dijo que Juan era el más grande entre los nacidos de mujer?'],
      application: ['¿Puedes celebrar genuinamente el éxito de otros sin sentir amenaza?', '¿Qué área de tu vida necesitas "menguar" para que Cristo crezca?'],
    },
  },
  {
    id: 'jacobo',
    name: 'Santiago (Jacobo)',
    emoji: '⚓',
    categories: ['apostoles', 'nt', 'fe-obediencia'],
    era: 'c. 1–44 d.C.',
    summary: 'Hermano de Juan e hijo de Zebedeo. Primer apóstol martirizado. Junto con Pedro y Juan formaba el círculo más íntimo de Jesús.',
    context: 'Pescador llamado por Jesús con su hermano Juan. Ambos fueron llamados "Hijos del Trueno" por su temperamento. Estuvo presente en la Transfiguración y en Getsemaní. Fue ejecutado por Herodes Agripa, convirtiéndose en el primer apóstol mártir.',
    lessons: ['El seguimiento radical de Jesús tiene un costo real', 'Dios transforma el temperamento, no siempre lo elimina', 'La fidelidad hasta la muerte es la forma más alta de testimoniar'],
    references: ['Mateo 4:21-22', 'Mateo 17:1-9', 'Marcos 10:35-45', 'Hechos 12:1-2'],
    passages: [
      { ref: 'Mateo 4:21-22', summary: 'El llamado de Santiago y Juan' },
      { ref: 'Marcos 10:35-45', summary: 'La petición de sentarse a la derecha de Jesús' },
      { ref: 'Hechos 12:1-2', summary: 'El martirio de Santiago' },
    ],
    studyQuestions: {
      observation: ['¿Qué pedían Santiago y Juan en Marcos 10?', '¿Cómo respondió Jesús a su petición?'],
      interpretation: ['¿Qué significa "beber el cáliz" que Jesús les preguntó?', '¿Por qué es significativo que Herodes matara a Santiago y encarcelara a Pedro?'],
      application: ['¿Estás preparado para las consecuencias del seguimiento radical de Jesús?', '¿Hay ambiciones de reconocimiento que necesitas poner en manos de Dios?'],
    },
  },
  {
    id: 'sansón',
    name: 'Sansón',
    emoji: '💪',
    categories: ['jueces', 'at', 'errores-restauracion'],
    era: 'c. 1100 a.C.',
    summary: 'Juez de Israel con fuerza sobrenatural, pero que repetidamente eligió seguir sus pasiones. Su vida muestra cómo el talento sin carácter es autodestructivo, pero también la misericordia de Dios en el arrepentimiento final.',
    context: 'Nacido de una madre estéril, consagrado como nazareo desde el vientre. Tuvo relaciones con mujeres filisteas en contra de los consejos. Dalila descubrió el secreto de su fuerza. Fue cegado y esclavizado, pero en su muerte final derrotó más filisteos que en vida.',
    lessons: ['El talento y el don no compensan la falta de carácter y disciplina', 'Los patrones repetidos de pecado llevan a la destrucción', 'Dios puede usar incluso el último momento de arrepentimiento'],
    references: ['Jueces 13–16'],
    passages: [
      { ref: 'Jueces 13:1-25', summary: 'El nacimiento milagroso de Sansón' },
      { ref: 'Jueces 16:4-22', summary: 'Dalila y la pérdida de la fuerza de Sansón' },
      { ref: 'Jueces 16:23-30', summary: 'La muerte y victoria final de Sansón' },
    ],
    studyQuestions: {
      observation: ['¿Cuáles fueron los tres intentos de Dalila para descubrir la fuerza de Sansón?', '¿Cuántos años fue juez Sansón?'],
      interpretation: ['¿Por qué Sansón es incluido en Hebreos 11 a pesar de sus fracasos?', '¿Qué simboliza el cabello como fuente de la fuerza de Sansón?'],
      application: ['¿Hay un patrón de pecado que se repite en tu vida que necesitas romper?', '¿Cómo equilibras tus talentos con el desarrollo del carácter?'],
    },
  },
]

export const BIBLE_CATEGORIES: { id: BibleCategory; label: string; emoji: string }[] = [
  { id: 'patriarcas',           label: 'Patriarcas',                    emoji: '🏔️' },
  { id: 'reyes',                label: 'Reyes y gobernantes',           emoji: '👑' },
  { id: 'profetas',             label: 'Profetas',                      emoji: '🔥' },
  { id: 'jueces',               label: 'Jueces',                        emoji: '⚖️' },
  { id: 'apostoles',            label: 'Discípulos y apóstoles',        emoji: '✉️' },
  { id: 'mujeres',              label: 'Mujeres de la Biblia',          emoji: '🌸' },
  { id: 'at',                   label: 'Antiguo Testamento',            emoji: '📜' },
  { id: 'nt',                   label: 'Nuevo Testamento',              emoji: '✝️' },
  { id: 'fe-obediencia',        label: 'Fe y obediencia',               emoji: '🌟' },
  { id: 'errores-restauracion', label: 'Errores y restauración',        emoji: '🔄' },
  { id: 'menos-conocidos',      label: 'Personajes menos conocidos',    emoji: '🔍' },
]
