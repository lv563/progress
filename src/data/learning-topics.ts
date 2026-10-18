export type LearningCategory =
  | 'psicologia'
  | 'neurociencia'
  | 'filosofia'
  | 'historia'
  | 'geografia'
  | 'ciencia'
  | 'biologia'
  | 'astronomia'
  | 'tecnologia'
  | 'programacion'
  | 'ia'
  | 'economia'
  | 'negocios'
  | 'comunicacion'
  | 'liderazgo'
  | 'literatura'
  | 'politica'
  | 'matematicas'
  | 'salud'
  | 'religion'

export type Difficulty = 'basico' | 'intermedio' | 'avanzado'

export interface LearningTopic {
  id: string
  title: string
  category: LearningCategory
  difficulty: Difficulty
  centralQuestion: string
  whatYouWillLearn: string
  threeQuestions: string[]
  definition: string
  explanation: string
  keyConcepts: { term: string; definition: string }[]
  examples: string[]
  realApplications: string[]
  sources: { title: string; url?: string; type: 'libro' | 'artículo' | 'video' | 'web' }[]
  relatedTopics: string[]
}

export const LEARNING_TOPICS: LearningTopic[] = [
  // PSICOLOGÍA
  {
    id: 'sesgo-confirmacion',
    title: 'Sesgo de confirmación',
    category: 'psicologia',
    difficulty: 'basico',
    centralQuestion: '¿Por qué buscamos información que confirma lo que ya creemos?',
    whatYouWillLearn: 'Entenderás por qué el cerebro humano tiende a favorecer la información que confirma sus creencias previas y cómo esto afecta la toma de decisiones.',
    threeQuestions: [
      '¿Qué es el sesgo de confirmación y cómo se manifiesta en la vida cotidiana?',
      '¿Por qué ocurre neurológicamente el sesgo de confirmación?',
      '¿Qué estrategias existen para contrarrestarlo?',
    ],
    definition: 'El sesgo de confirmación es la tendencia cognitiva a buscar, interpretar, recordar y favorecer la información que confirma nuestras creencias o hipótesis previas.',
    explanation: 'Cuando formamos una creencia, nuestro cerebro automáticamente filtra la información nueva para reforzarla. Ignoramos o minimizamos la evidencia contradictoria. Este sesgo fue documentado por Peter Wason en 1960 mediante experimentos de selección de tarjetas. Es uno de los sesgos cognitivos más documentados y tiene impacto en política, medicina, negocios e inversión.',
    keyConcepts: [
      { term: 'Sesgo cognitivo', definition: 'Error sistemático de pensamiento que afecta las decisiones y juicios' },
      { term: 'Disonancia cognitiva', definition: 'Malestar de tener creencias contradictorias; el sesgo de confirmación la reduce' },
      { term: 'Pensamiento crítico', definition: 'Habilidad de evaluar información de forma objetiva y sin sesgos' },
    ],
    examples: [
      'Un inversor que solo lee noticias favorables sobre su acción favorita',
      'Una persona que solo sigue en redes a quienes comparten su visión política',
      'Un médico que busca síntomas que confirmen su diagnóstico inicial',
    ],
    realApplications: [
      'Busca activamente opiniones contrarias a las tuyas antes de tomar decisiones importantes',
      'Pregúntate "¿Qué evidencia me haría cambiar de opinión?" sobre cada creencia importante',
      'Diversifica las fuentes de información que consumes intencionalmente',
    ],
    sources: [
      { title: 'Thinking, Fast and Slow — Daniel Kahneman', type: 'libro' },
      { title: 'Confirmation Bias: A Ubiquitous Phenomenon in Many Guises — Raymond Nickerson', type: 'artículo' },
    ],
    relatedTopics: ['efecto-dunning-kruger', 'pensamiento-critico', 'toma-decisiones'],
  },
  {
    id: 'efecto-dunning-kruger',
    title: 'Efecto Dunning-Kruger',
    category: 'psicologia',
    difficulty: 'basico',
    centralQuestion: '¿Por qué los menos competentes suelen ser los más seguros de sí mismos?',
    whatYouWillLearn: 'Comprenderás el fenómeno por el cual las personas con poco conocimiento sobreestiman su competencia, mientras que los expertos tienden a subestimarse.',
    threeQuestions: [
      '¿Qué es el efecto Dunning-Kruger?',
      '¿Cómo se relaciona con la metacognición?',
      '¿Cómo evitar caer en este sesgo?',
    ],
    definition: 'Sesgo cognitivo por el cual personas con conocimiento limitado sobreestiman su habilidad en un área, mientras que los verdaderos expertos dudan más de sus capacidades.',
    explanation: 'Estudiado por David Dunning y Justin Kruger en 1999 en Cornell. Los participantes con menor rendimiento se autoevaluaban por encima del promedio. La explicación: las mismas habilidades cognitivas necesarias para ser bueno en algo son las necesarias para reconocer que eres bueno. Sin esas habilidades, no puedes evaluar tu propia incompetencia.',
    keyConcepts: [
      { term: 'Metacognición', definition: 'Capacidad de pensar sobre el propio pensamiento y conocimiento' },
      { term: 'Sobreconfianza', definition: 'Evaluación excesivamente positiva de las propias capacidades' },
      { term: 'Valle de la desesperación', definition: 'Etapa en que el aprendizaje revela cuánto falta por aprender' },
    ],
    examples: [
      'Un principiante en guitarra que cree tocar mejor que músicos con años de práctica',
      'Alguien que lee un artículo sobre economía y cree poder gestionar mejor el banco central',
    ],
    realApplications: [
      'Busca feedback externo en áreas donde crees ser muy competente',
      'Rodéate de personas que sepan más que tú en tus áreas de interés',
      'Sé escéptico de tu primera evaluación de tu propio trabajo',
    ],
    sources: [
      { title: 'Unskilled and Unaware of It — Kruger & Dunning, 1999', type: 'artículo' },
      { title: 'The Intelligence Trap — David Robson', type: 'libro' },
    ],
    relatedTopics: ['sesgo-confirmacion', 'inteligencia-emocional', 'aprendizaje-deliberado'],
  },
  // NEUROCIENCIA
  {
    id: 'neuroplasticidad',
    title: 'Neuroplasticidad',
    category: 'neurociencia',
    difficulty: 'basico',
    centralQuestion: '¿Puede el cerebro cambiar y aprender a cualquier edad?',
    whatYouWillLearn: 'Entenderás cómo el cerebro se reorganiza y forma nuevas conexiones en respuesta al aprendizaje, la experiencia y el daño, y qué implica esto para el desarrollo personal.',
    threeQuestions: [
      '¿Qué es la neuroplasticidad y por qué fue un descubrimiento revolucionario?',
      '¿Cómo se forman y refuerzan las conexiones neuronales?',
      '¿Cómo aprovechar la neuroplasticidad para aprender mejor?',
    ],
    definition: 'La neuroplasticidad es la capacidad del sistema nervioso de cambiar su estructura y función en respuesta a la experiencia, el aprendizaje, el daño o nuevas demandas ambientales.',
    explanation: 'Durante décadas se creyó que el cerebro adulto era fijo. Las investigaciones de Michael Merzenich y otros mostraron que el cerebro forma nuevas conexiones (sinapsis) y puede reorganizarse. "Las neuronas que se activan juntas, se conectan juntas" — principio de Hebb. El aprendizaje literalmente cambia la estructura cerebral.',
    keyConcepts: [
      { term: 'Sinapsis', definition: 'Conexión entre dos neuronas por donde se transmiten señales' },
      { term: 'Mielinización', definition: 'Proceso de recubrir axones con mielina para acelerar señales' },
      { term: 'Principio de Hebb', definition: '"Las neuronas que se activan juntas, se conectan juntas"' },
    ],
    examples: [
      'Los taxistas de Londres desarrollan mayor volumen en el hipocampo (navegación)',
      'Los músicos tienen mayor desarrollo en áreas motoras finas',
      'La recuperación parcial de funciones después de un ACV',
    ],
    realApplications: [
      'La repetición espaciada refuerza conexiones neuronales más efectivamente que el estudio masivo',
      'El ejercicio físico aumenta el BDNF, proteína que favorece nuevas conexiones',
      'Aprender algo nuevo activamente siempre cambia físicamente tu cerebro',
    ],
    sources: [
      { title: 'The Brain That Changes Itself — Norman Doidge', type: 'libro' },
      { title: 'Soft-Wired — Michael Merzenich', type: 'libro' },
    ],
    relatedTopics: ['aprendizaje-deliberado', 'memoria-trabajo', 'habitos-cerebrales'],
  },
  // FILOSOFÍA
  {
    id: 'estoicismo',
    title: 'Estoicismo',
    category: 'filosofia',
    difficulty: 'basico',
    centralQuestion: '¿Cómo vivir bien independientemente de las circunstancias externas?',
    whatYouWillLearn: 'Conocerás los principios fundamentales del estoicismo y cómo esta filosofía griega y romana ofrece herramientas prácticas para la serenidad, el liderazgo y la resiliencia.',
    threeQuestions: [
      '¿Qué es el estoicismo y quiénes fueron sus principales filósofos?',
      '¿Cuál es la dicotomía del control que propone el estoicismo?',
      '¿Cómo aplicar principios estoicos en la vida cotidiana?',
    ],
    definition: 'Escuela filosófica fundada por Zenón de Citio (~300 a.C.) que enseña que la virtud es el único bien verdadero y que debemos distinguir lo que depende de nosotros de lo que no depende.',
    explanation: 'El estoicismo distingue entre lo que está "en nuestra mano" (juicios, impulsos, deseos) y lo que no (el cuerpo, la reputación, la riqueza, los resultados). La felicidad no depende de lo externo, sino de nuestra respuesta. Marco Aurelio, Epicteto y Séneca son sus representantes más conocidos.',
    keyConcepts: [
      { term: 'Dicotomía del control', definition: 'Solo nuestros pensamientos y acciones dependen de nosotros; lo demás, no' },
      { term: 'Virtud', definition: 'Para los estoicos, el único bien real: sabiduría, justicia, valentía, templanza' },
      { term: 'Amor fati', definition: '"Amor al destino" — aceptar todo lo que ocurre como necesario y bueno' },
    ],
    examples: [
      'Marco Aurelio, emperador de Roma y filósofo estoico, escribió sus reflexiones en Meditaciones',
      'Epicteto, esclavo que se convirtió en maestro de filosofía',
    ],
    realApplications: [
      'Antes de reaccionar, pregúntate: "¿Está esto en mi control?"',
      'Practica la visualización negativa: contempla perder lo que valoras para apreciar el presente',
      'Separa el resultado del esfuerzo: controla lo que puedes, acepta el resto',
    ],
    sources: [
      { title: 'Meditaciones — Marco Aurelio', type: 'libro' },
      { title: 'El Enchiridión — Epicteto', type: 'libro' },
      { title: 'Daily Stoic — Ryan Holiday', type: 'libro' },
    ],
    relatedTopics: ['inteligencia-emocional', 'resiliencia', 'habitos'],
  },
  // HISTORIA
  {
    id: 'segunda-guerra-mundial',
    title: 'Segunda Guerra Mundial: causas y consecuencias',
    category: 'historia',
    difficulty: 'basico',
    centralQuestion: '¿Cómo una crisis económica y una ideología radical llevaron al mayor conflicto de la historia?',
    whatYouWillLearn: 'Comprenderás las causas estructurales de la Segunda Guerra Mundial, los principales frentes y actores, y las consecuencias que redefinieron el orden mundial.',
    threeQuestions: [
      '¿Cuáles fueron las principales causas de la Segunda Guerra Mundial?',
      '¿Cuáles fueron los puntos de inflexión del conflicto?',
      '¿Qué instituciones y acuerdos surgieron para prevenir una nueva guerra?',
    ],
    definition: 'Conflicto armado global (1939–1945) que involucró a la mayoría de las naciones del mundo. Resultó en aproximadamente 70-85 millones de muertes, el Holocausto y la reestructuración del orden mundial.',
    explanation: 'Las causas incluyen el Tratado de Versalles (1919) que humilló a Alemania, la Gran Depresión (1929), el ascenso del fascismo en Europa y el expansionismo japonés en Asia. El conflicto involucró dos bloques: Aliados (UK, URSS, EE.UU., Francia) vs. Potencias del Eje (Alemania Nazi, Italia, Japón).',
    keyConcepts: [
      { term: 'Blitzkrieg', definition: 'Táctica militar alemana de guerra relámpago combinando tanques, aviación e infantería' },
      { term: 'Holocausto', definition: 'Genocidio sistemático de 6 millones de judíos y millones más por el régimen nazi' },
      { term: 'ONU', definition: 'Organización de las Naciones Unidas, fundada en 1945 para mantener la paz internacional' },
    ],
    examples: [
      'La Battle of Britain (1940) donde la RAF resistió el bombardeo alemán',
      'El Día D (6 de junio de 1944), desembarco en Normandía',
      'Las bombas atómicas sobre Hiroshima y Nagasaki (agosto 1945)',
    ],
    realApplications: [
      'Estudiar historia previene repetir errores: identificar los patrones que llevaron al fascismo',
      'Las instituciones internacionales (ONU, OTAN) nacen de las lecciones de este conflicto',
      'La importancia de la diplomacia y el orden internacional para prevenir conflictos',
    ],
    sources: [
      { title: 'The Second World War — Antony Beevor', type: 'libro' },
      { title: 'The Rise and Fall of the Third Reich — William L. Shirer', type: 'libro' },
    ],
    relatedTopics: ['guerra-fria', 'holocausto', 'fascismo'],
  },
  // CIENCIA
  {
    id: 'metodo-cientifico',
    title: 'El método científico',
    category: 'ciencia',
    difficulty: 'basico',
    centralQuestion: '¿Cómo generamos conocimiento confiable sobre el mundo?',
    whatYouWillLearn: 'Entenderás el proceso sistemático mediante el cual la ciencia genera y verifica conocimiento, y por qué este método es más confiable que la intuición o la autoridad.',
    threeQuestions: [
      '¿Cuáles son los pasos del método científico?',
      '¿Qué es la falsabilidad y por qué es central en la ciencia?',
      '¿Cuál es la diferencia entre correlación y causalidad?',
    ],
    definition: 'El método científico es un proceso sistemático de observación, formulación de hipótesis, experimentación y revisión para generar conocimiento verificable y replicable.',
    explanation: 'Pasos fundamentales: Observación → Pregunta → Hipótesis → Experimento → Análisis → Conclusión → Publicación y revisión por pares. Karl Popper introdujo el concepto de falsabilidad: una hipótesis científica debe poder ser demostrada falsa. La replicabilidad es esencial.',
    keyConcepts: [
      { term: 'Hipótesis', definition: 'Explicación tentativa y comprobable de un fenómeno observado' },
      { term: 'Falsabilidad', definition: 'Criterio de Popper: una afirmación científica debe poder ser refutada' },
      { term: 'Variables controladas', definition: 'Factores que se mantienen constantes para aislar el efecto estudiado' },
    ],
    examples: [
      'El experimento de Pasteur con el cuello de cisne que refutó la generación espontánea',
      'Los ensayos clínicos aleatorizados con placebo en medicina',
    ],
    realApplications: [
      'Aplicar el pensamiento científico al evaluar afirmaciones: ¿qué evidencia lo sustenta?',
      'Diseñar experimentos mentales antes de tomar decisiones importantes',
      'Distinguir correlación de causalidad en noticias y estudios',
    ],
    sources: [
      { title: 'The Logic of Scientific Discovery — Karl Popper', type: 'libro' },
      { title: 'A Short History of Nearly Everything — Bill Bryson', type: 'libro' },
    ],
    relatedTopics: ['sesgo-confirmacion', 'pensamiento-critico', 'estadistica'],
  },
  // TECNOLOGÍA
  {
    id: 'internet-como-funciona',
    title: 'Cómo funciona Internet',
    category: 'tecnologia',
    difficulty: 'basico',
    centralQuestion: '¿Cómo viaja información desde tu dispositivo hasta cualquier servidor del mundo en milisegundos?',
    whatYouWillLearn: 'Entenderás la arquitectura básica de Internet: protocolos, DNS, TCP/IP, y cómo los datos se dividen en paquetes que viajan por la red.',
    threeQuestions: [
      '¿Qué es el protocolo TCP/IP y para qué sirve?',
      '¿Cómo funciona el DNS (sistema de nombres de dominio)?',
      '¿Qué diferencia hay entre Internet y la Web?',
    ],
    definition: 'Internet es una red global de redes interconectadas que permite la comunicación entre dispositivos usando protocolos estandarizados (principalmente TCP/IP).',
    explanation: 'Los datos se dividen en paquetes pequeños, cada uno viaja de forma independiente por la red, y se reensamblan en el destino. El DNS traduce nombres de dominio a direcciones IP. HTTP/HTTPS son protocolos de aplicación que usan TCP/IP. La Web (www) es solo una aplicación que corre sobre Internet.',
    keyConcepts: [
      { term: 'IP address', definition: 'Número único que identifica cada dispositivo conectado a Internet' },
      { term: 'DNS', definition: 'Sistema de Nombres de Dominio: traduce "google.com" a una dirección IP numérica' },
      { term: 'Paquetes', definition: 'Unidades pequeñas en que se divide la información para transmitirla por la red' },
    ],
    examples: [
      'Cuando abres google.com: tu dispositivo consulta el DNS → obtiene la IP → envía petición HTTP → recibe la página',
      'Un videollamada usa UDP (no TCP) porque es mejor perder algunos paquetes que esperar retransmisiones',
    ],
    realApplications: [
      'Entender por qué una VPN redirige tu tráfico y qué implicaciones de privacidad tiene',
      'Diagnosticar problemas de red básicos usando el modelo TCP/IP',
      'Comprender qué significa HTTPS y por qué es importante para la seguridad',
    ],
    sources: [
      { title: 'How the Internet Works — Preston Gralla', type: 'libro' },
      { title: 'Computer Networking: A Top-Down Approach — Kurose & Ross', type: 'libro' },
    ],
    relatedTopics: ['seguridad-informatica', 'cloud-computing', 'http-https'],
  },
  // IA
  {
    id: 'que-es-ia',
    title: '¿Qué es la Inteligencia Artificial?',
    category: 'ia',
    difficulty: 'basico',
    centralQuestion: '¿Qué significa que una máquina sea "inteligente" y qué puede y no puede hacer la IA actual?',
    whatYouWillLearn: 'Entenderás qué es la IA, los tipos principales (narrow vs. general), cómo funciona el aprendizaje automático básicamente, y cuáles son sus limitaciones reales.',
    threeQuestions: [
      '¿Qué diferencia hay entre IA estrecha e IA general?',
      '¿Cómo aprende una máquina?',
      '¿Qué puede y qué no puede hacer la IA actual?',
    ],
    definition: 'La Inteligencia Artificial es el campo de la informática dedicado a crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana: razonamiento, aprendizaje, percepción y resolución de problemas.',
    explanation: 'La IA actual es "estrecha" (narrow AI): excelente en tareas específicas pero sin comprensión general. El aprendizaje automático (ML) entrena modelos con datos. El deep learning usa redes neuronales artificiales. Los LLMs (como GPT) son modelos de lenguaje entrenados en enormes cantidades de texto.',
    keyConcepts: [
      { term: 'Machine Learning', definition: 'Subcampo de IA donde los sistemas aprenden patrones a partir de datos' },
      { term: 'Red neuronal', definition: 'Arquitectura computacional inspirada en el cerebro biológico' },
      { term: 'LLM', definition: 'Large Language Model: modelo de IA entrenado en texto para generar y entender lenguaje' },
    ],
    examples: [
      'Recomendaciones de Netflix: IA estrecha entrenada en comportamiento de usuarios',
      'ChatGPT: LLM que predice el siguiente token, no "entiende" en sentido humano',
      'AlphaGo: IA que vence a campeones mundiales de Go mediante aprendizaje por refuerzo',
    ],
    realApplications: [
      'Evaluar afirmaciones sobre IA con pensamiento crítico: ¿es hype o capacidad real?',
      'Entender qué trabajos se transformarán por la IA y en cuáles la creatividad humana sigue siendo insustituible',
      'Usar herramientas de IA (GitHub Copilot, ChatGPT) de forma más efectiva conociendo sus limitaciones',
    ],
    sources: [
      { title: 'Human Compatible — Stuart Russell', type: 'libro' },
      { title: 'The Alignment Problem — Brian Christian', type: 'libro' },
    ],
    relatedTopics: ['machine-learning', 'etica-ia', 'futuro-trabajo'],
  },
  // ECONOMÍA
  {
    id: 'inflacion',
    title: 'Inflación: ¿qué es y cómo afecta tu vida?',
    category: 'economia',
    difficulty: 'basico',
    centralQuestion: '¿Por qué suben los precios y qué pueden hacer los gobiernos al respecto?',
    whatYouWillLearn: 'Comprenderás qué causa la inflación, cómo la miden los gobiernos, su impacto en el poder adquisitivo y qué herramientas tienen los bancos centrales para controlarla.',
    threeQuestions: [
      '¿Qué es la inflación y cómo se mide?',
      '¿Cuáles son las principales causas de la inflación?',
      '¿Cómo afecta la inflación a ahorradores, deudores y la economía en general?',
    ],
    definition: 'La inflación es el aumento generalizado y sostenido del nivel de precios de bienes y servicios en una economía durante un período de tiempo.',
    explanation: 'Se mide mediante el IPC (Índice de Precios al Consumidor). Las causas incluyen: demanda excesiva (inflación de demanda), costos de producción más altos (inflación de costos), o exceso de dinero en circulación (inflación monetaria). Los bancos centrales usan tasas de interés para controlarla.',
    keyConcepts: [
      { term: 'IPC', definition: 'Índice de Precios al Consumidor: canasta de bienes representativa para medir inflación' },
      { term: 'Tasa de interés', definition: 'Herramienta del banco central para enfriar o estimular la economía' },
      { term: 'Hiperinflación', definition: 'Inflación extrema (>50% mensual) que destruye el valor de la moneda' },
    ],
    examples: [
      'Alemania 1923: una carretilla de marcos para comprar pan — hiperinflación post-WWI',
      'Venezuela 2018: inflación del 1,000,000% — el bolívar perdió casi todo su valor',
    ],
    realApplications: [
      'Si tienes deudas a tasa fija, la inflación trabaja a tu favor (pagas con dinero que vale menos)',
      'El efectivo bajo el colchón pierde valor; entender dónde proteger ahorros',
      'Los activos reales (bienes raíces, commodities) suelen ser refugio ante inflación alta',
    ],
    sources: [
      { title: 'Economics — Paul Samuelson', type: 'libro' },
      { title: 'The Ascent of Money — Niall Ferguson', type: 'libro' },
    ],
    relatedTopics: ['banco-central', 'ahorro-inversion', 'ciclos-economicos'],
  },
  // LIDERAZGO
  {
    id: 'liderazgo-servicial',
    title: 'Liderazgo servicial',
    category: 'liderazgo',
    difficulty: 'basico',
    centralQuestion: '¿Puede un líder ser más efectivo poniendo a otros primero?',
    whatYouWillLearn: 'Conocerás el concepto de liderazgo servicial, su evidencia en resultados organizacionales, y cómo aplicar sus principios en contextos de equipo, familia y comunidad.',
    threeQuestions: [
      '¿Qué es el liderazgo servicial y en qué se diferencia del liderazgo tradicional?',
      '¿Cuáles son las características de un líder servicial?',
      '¿Qué evidencia existe sobre su efectividad?',
    ],
    definition: 'El liderazgo servicial es un estilo de liderazgo en el que el líder prioriza las necesidades de su equipo por encima de las propias, con el objetivo de desarrollar a las personas y lograr resultados sostenibles.',
    explanation: 'Acuñado por Robert K. Greenleaf en 1970. En contraste con el liderazgo de "mando y control", el líder servicial pregunta: "¿Cómo puedo ayudar a mi equipo a tener éxito?" Características: escucha activa, empatía, construcción de comunidad, compromiso con el crecimiento de las personas.',
    keyConcepts: [
      { term: 'Liderazgo situacional', definition: 'Adaptar el estilo de liderazgo según la madurez y necesidad del colaborador' },
      { term: 'Empowerment', definition: 'Dar a los colaboradores autoridad y recursos para tomar decisiones' },
      { term: 'Trust leadership', definition: 'Liderazgo basado en la confianza mutua como fundamento' },
    ],
    examples: [
      'Southwest Airlines: sus líderes apoyan primero a empleados, luego a clientes, resultando en décadas de rentabilidad',
      'Nelson Mandela: servicio al pueblo por encima del poder personal',
    ],
    realApplications: [
      'Como padre, pareja o jefe: pregunta cada semana "¿qué necesitas de mí para tener éxito?"',
      'Celebra los logros de tu equipo públicamente antes que los propios',
      'Invierte en el desarrollo profesional de las personas de tu equipo',
    ],
    sources: [
      { title: 'The Servant as Leader — Robert K. Greenleaf', type: 'libro' },
      { title: 'Leaders Eat Last — Simon Sinek', type: 'libro' },
    ],
    relatedTopics: ['inteligencia-emocional', 'cultura-organizacional', 'comunicacion-efectiva'],
  },
  // COMUNICACIÓN
  {
    id: 'escucha-activa',
    title: 'Escucha activa',
    category: 'comunicacion',
    difficulty: 'basico',
    centralQuestion: '¿Por qué escuchar bien es más difícil y más valioso que hablar bien?',
    whatYouWillLearn: 'Aprenderás las diferencias entre oír y escuchar, las técnicas de escucha activa y cómo esta habilidad transforma las relaciones personales y profesionales.',
    threeQuestions: [
      '¿Qué diferencia hay entre oír y escuchar activamente?',
      '¿Cuáles son las barreras más comunes para escuchar bien?',
      '¿Qué técnicas concretas mejoran la escucha activa?',
    ],
    definition: 'La escucha activa es la habilidad de prestar atención completa al interlocutor, comprender su mensaje tanto verbal como no verbal, y responder de forma que la persona sepa que fue escuchada.',
    explanation: 'Carl Rogers la desarrolló en el contexto terapéutico. La escucha activa implica: presencia total (sin pensar en la respuesta), reflejo del contenido emocional, parafraseo para verificar comprensión, preguntas abiertas. Las barreras incluyen: distracciones, juicios previos, preparar la respuesta mientras el otro habla.',
    keyConcepts: [
      { term: 'Parafraseo', definition: 'Repetir con tus palabras lo que escuchaste para verificar comprensión' },
      { term: 'Reflejo emocional', definition: 'Nombrar la emoción que percibes en el interlocutor' },
      { term: 'Preguntas abiertas', definition: 'Preguntas que invitan a expandir en lugar de responder sí/no' },
    ],
    examples: [
      'Un médico que escucha activamente diagnostica mejor que uno que asume el diagnóstico rápidamente',
      'Las negociaciones exitosas casi siempre empiezan con escuchar antes de proponer',
    ],
    realApplications: [
      'En la próxima conversación importante, evita planear tu respuesta mientras el otro habla',
      'Practica el parafraseo: "Lo que escucho es que...¿es correcto?"',
      'Observa el lenguaje no verbal: tono, postura, expresión facial son parte del mensaje',
    ],
    sources: [
      { title: 'The Lost Art of Listening — Michael Nichols', type: 'libro' },
      { title: 'Never Split the Difference — Chris Voss', type: 'libro' },
    ],
    relatedTopics: ['comunicacion-no-verbal', 'negociacion', 'empatia'],
  },
  // MATEMÁTICAS
  {
    id: 'probabilidad-basica',
    title: 'Probabilidad: pensar en términos de posibilidades',
    category: 'matematicas',
    difficulty: 'basico',
    centralQuestion: '¿Por qué somos tan malos intuitivamente estimando probabilidades?',
    whatYouWillLearn: 'Entenderás los conceptos básicos de probabilidad, por qué nuestro cerebro la distorsiona, y cómo pensar probabilísticamente mejora la toma de decisiones.',
    threeQuestions: [
      '¿Qué es la probabilidad y cómo se calcula básicamente?',
      '¿Qué es la falacia del jugador y por qué nos engaña?',
      '¿Cómo aplicar el pensamiento probabilístico en decisiones cotidianas?',
    ],
    definition: 'La probabilidad es la medida matemática de la posibilidad de que ocurra un evento, expresada entre 0 (imposible) y 1 (certeza), o entre 0% y 100%.',
    explanation: 'P(evento) = casos favorables / casos posibles. Los errores comunes incluyen: la falacia del jugador (creer que los eventos pasados afectan probabilidades futuras independientes), la falacia del pequeño número (sacar conclusiones de pocas muestras), y el sesgo de disponibilidad (sobrestimar lo que se nos ocurre fácilmente).',
    keyConcepts: [
      { term: 'Probabilidad condicional', definition: 'P(A|B): probabilidad de A dado que B ya ocurrió' },
      { term: 'Falacia del jugador', definition: 'Creer que el pasado afecta eventos independientes futuros (moneda sin memoria)' },
      { term: 'Teorema de Bayes', definition: 'Actualizar creencias con nueva evidencia de forma matemáticamente correcta' },
    ],
    examples: [
      'Si una moneda cae cara 10 veces seguidas, la probabilidad de cara en el lanzamiento 11 sigue siendo 50%',
      'El Teorema de Bayes aplicado a diagnósticos médicos: el valor predictivo varía según la prevalencia',
    ],
    realApplications: [
      'Antes de una decisión importante, estima probabilidades explícitamente en vez de intuirlas',
      'Reconoce la falacia del jugador en apuestas, inversiones y vida cotidiana',
      'Usa el pensamiento bayesiano: ¿qué tan probable era X antes de este evento? ¿cómo lo actualiza?',
    ],
    sources: [
      { title: 'The Drunkard\'s Walk — Leonard Mlodinow', type: 'libro' },
      { title: 'Thinking in Bets — Annie Duke', type: 'libro' },
    ],
    relatedTopics: ['sesgo-cognitivo', 'estadistica', 'toma-decisiones'],
  },
  // SALUD
  {
    id: 'sueno-ciencia',
    title: 'La ciencia del sueño',
    category: 'salud',
    difficulty: 'basico',
    centralQuestion: '¿Por qué dormir bien es la variable de salud más subestimada?',
    whatYouWillLearn: 'Entenderás qué ocurre en el cerebro durante el sueño, las fases del sueño, las consecuencias del déficit y las estrategias basadas en evidencia para dormir mejor.',
    threeQuestions: [
      '¿Qué ocurre en el cerebro durante el sueño profundo y el sueño REM?',
      '¿Cuáles son los efectos documentados del déficit crónico de sueño?',
      '¿Qué prácticas mejoran la calidad del sueño según la evidencia?',
    ],
    definition: 'El sueño es un estado biológico activo esencial para la consolidación de la memoria, la regulación emocional, la reparación celular, la función inmune y la eliminación de toxinas cerebrales.',
    explanation: 'El sueño tiene ciclos de ~90 min con fases NREM (N1, N2, N3/sueño profundo) y REM. El sueño profundo consolida la memoria declarativa; el REM procesa emociones y la memoria procedimental. El sistema glinfático elimina toxinas (beta-amiloide) durante el sueño. La privación de sueño deteriora cognición equivalente a la ebriedad.',
    keyConcepts: [
      { term: 'Sueño REM', definition: 'Fase de movimientos oculares rápidos: sueños vívidos, procesamiento emocional' },
      { term: 'Sistema glinfático', definition: 'Sistema de limpieza cerebral que opera principalmente durante el sueño profundo' },
      { term: 'Ritmo circadiano', definition: 'Reloj biológico interno de ~24 horas que regula el ciclo sueño-vigilia' },
    ],
    examples: [
      '17 horas sin dormir equivalen cognitivamente a 0.05% BAC (legalmente borracho para conducir)',
      'El Alzheimer se asocia con acumulación de beta-amiloide — exactamente lo que el sistema glinfático limpia',
    ],
    realApplications: [
      'Mantén un horario de sueño consistente incluso en fines de semana',
      'La temperatura del cuarto (18-20°C) es el factor ambiental más potente para el sueño',
      'Evita pantallas 1h antes de dormir: la luz azul suprime la melatonina',
    ],
    sources: [
      { title: 'Why We Sleep — Matthew Walker', type: 'libro' },
      { title: 'The Sleep Revolution — Arianna Huffington', type: 'libro' },
    ],
    relatedTopics: ['neurociencia', 'productividad', 'habitos-saludables'],
  },
  // PROGRAMACIÓN
  {
    id: 'algoritmos-basicos',
    title: 'Algoritmos: el corazón de la computación',
    category: 'programacion',
    difficulty: 'basico',
    centralQuestion: '¿Qué hace que una solución computacional sea eficiente?',
    whatYouWillLearn: 'Comprenderás qué es un algoritmo, cómo se mide su eficiencia con Big O notation, y cómo los algoritmos clásicos de ordenación y búsqueda resuelven problemas fundamentales.',
    threeQuestions: [
      '¿Qué es un algoritmo y qué lo hace bueno?',
      '¿Qué significa la notación Big O?',
      '¿Cuáles son los algoritmos de ordenación más conocidos y cuándo usar cada uno?',
    ],
    definition: 'Un algoritmo es una secuencia finita de instrucciones bien definidas para resolver un problema o realizar una computación.',
    explanation: 'La eficiencia de un algoritmo se mide en tiempo (cuántas operaciones realiza) y espacio (cuánta memoria usa). La notación Big O expresa el peor caso. O(1) es constante, O(n) lineal, O(n²) cuadrático. Quicksort O(n log n) promedio es más eficiente que Bubble Sort O(n²) para grandes conjuntos.',
    keyConcepts: [
      { term: 'Big O', definition: 'Notación que describe cómo crece el tiempo/espacio de un algoritmo con el tamaño del input' },
      { term: 'Recursión', definition: 'Función que se llama a sí misma con un caso base para terminar' },
      { term: 'Divide y vencerás', definition: 'Estrategia de dividir el problema en subproblemas más pequeños y combinar soluciones' },
    ],
    examples: [
      'Buscar un nombre en agenda: búsqueda binaria O(log n) vs. secuencial O(n)',
      'Google usa algoritmos de grafos (PageRank) para determinar la relevancia de páginas web',
    ],
    realApplications: [
      'Entender Big O ayuda a elegir la estructura de datos correcta para el problema',
      'La recursión es la base de programación funcional, árboles y grafos',
      'Conocer algoritmos clásicos mejora las entrevistas técnicas de trabajo',
    ],
    sources: [
      { title: 'Introduction to Algorithms — CLRS', type: 'libro' },
      { title: 'Grokking Algorithms — Aditya Bhargava', type: 'libro' },
    ],
    relatedTopics: ['estructuras-datos', 'complejidad-computacional', 'programacion-funcional'],
  },
  // ASTRONOMÍA
  {
    id: 'sistema-solar',
    title: 'El sistema solar',
    category: 'astronomia',
    difficulty: 'basico',
    centralQuestion: '¿Qué tan pequeños somos en el universo?',
    whatYouWillLearn: 'Aprenderás la composición del sistema solar, las características de cada planeta, la escala real de distancias y cómo se formó hace 4.600 millones de años.',
    threeQuestions: [
      '¿Cómo se formó el sistema solar?',
      '¿Cuáles son las características principales de cada planeta?',
      '¿Qué tan grande es el sistema solar en comparación con el resto del universo?',
    ],
    definition: 'El sistema solar es el sistema planetario formado por el Sol y todos los objetos que orbitan a su alrededor: 8 planetas, planetas enanos, lunas, asteroides, cometas y el medio interplanetario.',
    explanation: 'Se formó hace ~4.600 millones de años a partir de una nube de gas y polvo (nebulosa solar) que colapsó por gravedad. El Sol concentra el 99.86% de la masa. Los planetas interiores (Mercurio, Venus, Tierra, Marte) son rocosos. Los exteriores (Júpiter, Saturno, Urano, Neptuno) son gigantes gaseosos e helados.',
    keyConcepts: [
      { term: 'Unidad Astronómica (UA)', definition: 'Distancia promedio Tierra-Sol = 150 millones km; unidad de medida en el sistema solar' },
      { term: 'Cinturón de Kuiper', definition: 'Región más allá de Neptuno con cuerpos helados; incluye a Plutón' },
      { term: 'Heliósfera', definition: 'Burbuja de plasma solar que envuelve el sistema solar' },
    ],
    examples: [
      'Si el Sol fuera una pelota de baloncesto, la Tierra sería un guisante a 26 metros de distancia',
      'La luz tarda 8 minutos en llegar del Sol a la Tierra, pero 4.2 años en llegar de la estrella más cercana',
    ],
    realApplications: [
      'La escala del universo ayuda a mantener perspectiva sobre los problemas humanos',
      'Entender la mecánica orbital es la base de la exploración espacial y la navegación por satélite',
      'Los fenómenos solares (tormentas solares) afectan directamente la tecnología terrestre',
    ],
    sources: [
      { title: 'Cosmos — Carl Sagan', type: 'libro' },
      { title: 'Astrophysics for People in a Hurry — Neil deGrasse Tyson', type: 'libro' },
    ],
    relatedTopics: ['fisica-cuantica', 'relatividad', 'exoplanetas'],
  },
]

export const LEARNING_CATEGORIES: { id: LearningCategory; label: string; emoji: string; description: string }[] = [
  { id: 'psicologia',    label: 'Psicología',         emoji: '🧠', description: 'Comportamiento humano y procesos mentales' },
  { id: 'neurociencia',  label: 'Neurociencia',        emoji: '🔬', description: 'El cerebro y el sistema nervioso' },
  { id: 'filosofia',     label: 'Filosofía',           emoji: '🤔', description: 'Pensamiento crítico e ideas fundamentales' },
  { id: 'historia',      label: 'Historia',            emoji: '📜', description: 'Eventos y procesos históricos universales' },
  { id: 'geografia',     label: 'Geografía',           emoji: '🌍', description: 'Culturas, lugares y pueblos del mundo' },
  { id: 'ciencia',       label: 'Ciencia',             emoji: '⚗️', description: 'Física, química y el método científico' },
  { id: 'biologia',      label: 'Biología',            emoji: '🌱', description: 'Vida, ecosistemas y evolución' },
  { id: 'astronomia',    label: 'Astronomía',          emoji: '🔭', description: 'El universo, estrellas y cosmología' },
  { id: 'tecnologia',    label: 'Tecnología',          emoji: '💻', description: 'Internet, hardware y sistemas digitales' },
  { id: 'programacion',  label: 'Programación',        emoji: '⌨️', description: 'Algoritmos, código y desarrollo de software' },
  { id: 'ia',            label: 'Inteligencia Artificial', emoji: '🤖', description: 'IA, ML y sus implicaciones' },
  { id: 'economia',      label: 'Economía',            emoji: '📈', description: 'Finanzas, mercados y decisiones económicas' },
  { id: 'negocios',      label: 'Negocios',            emoji: '🚀', description: 'Emprendimiento y estrategia empresarial' },
  { id: 'comunicacion',  label: 'Comunicación',        emoji: '🗣️', description: 'Oratoria, escritura y habilidades sociales' },
  { id: 'liderazgo',     label: 'Liderazgo',           emoji: '🎯', description: 'Liderazgo, productividad y equipos' },
  { id: 'literatura',    label: 'Literatura y Arte',   emoji: '📚', description: 'Libros, arte y expresión cultural' },
  { id: 'politica',      label: 'Política',            emoji: '🏛️', description: 'Sistemas políticos e instituciones' },
  { id: 'matematicas',   label: 'Matemáticas',         emoji: '🔢', description: 'Lógica, estadística y matemáticas aplicadas' },
  { id: 'salud',         label: 'Salud',               emoji: '❤️', description: 'Bienestar físico y hábitos saludables' },
  { id: 'religion',      label: 'Religiones e Ideas',  emoji: '☯️', description: 'Historia de las religiones y filosofías' },
]
