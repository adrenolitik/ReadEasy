import type { ReaderDocument } from "../types/reader";

export const STARTER_DOCUMENTS: ReaderDocument[] = [
  {
    id: "starter-neuroplasticity-ru",
    title: "Нейропластичность и консолидация долговременной памяти",
    author: "Когнитивный обзор",
    category: "Наука",
    language: "ru",
    createdAt: 1762992000000,
    progress: 0,
    isStarter: true,
    content: `Синаптическая пластичность представляет собой фундаментальный нейробиологический механизм, посредством которого центральная нервная система модифицирует эффективность межнейронной передачи в ответ на повторяющуюся сенсорную или когнитивную стимуляцию. Когда два смежных нейрона систематически активируются синхронно, происходит долговременная потенциация синапсов, сопровождаемая структурной перестройкой дендритных шипиков и увеличением плотности рецепторов на постсинаптической мембране.

Переход кратковременных следов активности в устойчивую долговременную память, именуемый консолидацией, требует синтеза новых белков и координированного взаимодействия между гиппокампом и неокортексом. В период медленноволнового сна гиппокамп многократно реактивирует паттерны дневного опыта, постепенно перераспределяя информационную нагрузку в распределённые корковые ансамбли.

Примечательно, что реконсолидация — повторное обращение к уже сохранённому воспоминанию — временно переводит нейронный след в лабильное состояние. В этот короткий интервал память может быть не только усилена, но и контекстуально дополнена, что объясняет высокую адаптивность человеческого обучения на протяжении всей жизни.`,
  },
  {
    id: "starter-legal-ru",
    title: "Порядок обработки пользовательских данных и телеметрии",
    author: "Юридический регламент",
    category: "Документ",
    language: "ru",
    createdAt: 1762905600000,
    progress: 0,
    isStarter: true,
    content: `Настоящее уведомление регламентирует порядок сбора, систематизации, хранения и обезличивания диагностических сведений, генерируемых клиентским программным обеспечением в процессе штатной эксплуатации цифровой платформы. Оператор обязуется обеспечивать конфиденциальность обрабатываемых атрибутов и применять криптографические протоколы передачи данных в соответствии с применимым законодательством.

Субъект персональных данных вправе в любой момент инициировать отзыв ранее предоставленного согласия на факультативную аналитику посредством направления формализованного уведомления через интерфейс учётной записи, при этом базовый функционал сервиса сохраняется в полном объёме за исключением персонализированных рекомендательных модулей.

В случае выявления несанкционированного доступа к инфраструктуре хранения оператор уведомляет уполномоченные надзорные органы и затронутых пользователей в регламентированный срок, предпринимая незамедлительные меры по локализации инцидента и минимизации потенциальных правовых и имущественных последствий.`,
  },
  {
    id: "starter-attention-en",
    title: "Why Attention Architecture Defines Modern Interfaces",
    author: "Digital Craft Quarterly",
    category: "Design",
    language: "en",
    createdAt: 1762819200000,
    progress: 0,
    isStarter: true,
    content: `Contemporary software frequently mistakes visual density for functional capability, surrounding primary reading surfaces with persistent notification badges, competing navigation chrome, and algorithmic recommendation rails. Under cognitive load theory, every extraneous element in the peripheral field consumes working memory capacity that should otherwise remain dedicated to comprehension and synthesis.

Calm reading architectures reverse this hierarchy by establishing strict typographic measure, generous vertical rhythm, and predictable spatial anchors. When line length remains between sixty and seventy-two characters and contrast is calibrated to paper luminance rather than harsh pure white, saccadic eye fatigue drops measurably across prolonged reading sessions.

Ultimately, accessibility is not an afterthought appended via an external widget; it is the baseline structural discipline through which complex ideas become legible to every reader regardless of neurodivergence, visual stamina, or domain familiarity.`,
  },
  {
    id: "starter-silent-reading-en",
    title: "The Invention of Silent Reading and the Private Mind",
    author: "Historical Monograph",
    category: "History",
    language: "en",
    createdAt: 1762732800000,
    progress: 0,
    isStarter: true,
    content: `Throughout classical antiquity, manuscripts were inscribed in scriptio continua—an unbroken stream of letters devoid of word boundaries, punctuation marks, or paragraph divisions. Because deciphering unspaced characters required vocalizing syllables aloud to hear where one word ended and the next began, reading was overwhelmingly a communal, auditory performance rather than a solitary inward exercise.

Between the seventh and eleventh centuries, monastic scribes in Ireland and continental Europe gradually introduced inter-word spacing and systematic punctuation to aid non-native Latin scholars. This seemingly modest typographic innovation fundamentally reorganized human cognition: once the eye could recognize whole word shapes instantaneously, silent reading proliferated across universities and private libraries.

With silence came speed, critical cross-referencing, and interior reflection—allowing readers to pause, question an argument in the margins, and engage with unfamiliar concepts at their own deliberate pace.`,
  },
];
