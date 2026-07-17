import type { Material } from "../types";

/** Учебная библиотека: конспекты, карточки, гайды по пробникам. */
export const MATERIALS: Material[] = [
  {
    id: "russian-orthoepy-note",
    subjectId: "russian",
    topicId: "russian-orthoepy",
    kind: "note",
    title: "Орфоэпия: как не ошибиться в ударении",
    subtitle: "Русский язык · конспект",
    minutes: 8,
    body: "Ударение в русском языке разноместное и подвижное. Опорные группы:\n\n• Глаголы прош. вр. ж.р.: часто ударение на окончании — бралА, звалА, началА (но клАла, крАла).\n• Причастия на -ённый: ударение на «ё» — заселЁнный, включЁнный.\n• Существительные: тОрты, бАнты, шАрфы, но каталОг, договОр.\n\nУчите словами-«магнитами»: звонИт → перезвонИт, позвонИт.",
  },
  {
    id: "russian-orthography-cards",
    subjectId: "russian",
    topicId: "russian-orthography",
    kind: "flashcards",
    title: "Корни с чередованием — карточки",
    subtitle: "Русский язык · карточки",
    minutes: 10,
    body: "гар/гор, зар/зор, кас/кос, лаг/лож, раст/ращ/рос, бер/бир, тер/тир…",
  },
  {
    id: "math-percents-note",
    subjectId: "basic-math",
    topicId: "math-arithmetic",
    kind: "note",
    title: "Проценты за 10 минут",
    subtitle: "Базовая математика · конспект",
    minutes: 6,
    body: "1% = сотая часть. Чтобы найти p% от N: N·p/100. Увеличение на p%: ×(1+p/100). Уменьшение: ×(1−p/100). Обратная задача: N = часть ÷ (p/100).",
  },
  {
    id: "history-dates-flashcards",
    subjectId: "history",
    topicId: "history-dates",
    kind: "flashcards",
    title: "Ключевые даты XIX–XX века",
    subtitle: "История · карточки",
    minutes: 12,
    body: "1825 — декабристы · 1861 — отмена крепостного права · 1864 — судебная реформа · 1905 — первая революция · 1914 — начало ПМВ.",
  },
  {
    id: "history-trial-guide",
    subjectId: "history",
    topicId: "history-dates",
    kind: "trial-guide",
    title: "Как проходить пробник по истории",
    subtitle: "История · гайд по пробнику",
    minutes: 5,
    body: "Сначала — задания на даты и последовательность, они быстрые. Работу с текстом и картой оставляйте на конец. Следите за таймингом: 1-я часть — не больше 90 минут.",
  },
  {
    id: "social-law-note",
    subjectId: "social",
    topicId: "social-law",
    kind: "note",
    title: "Право: система и источники",
    subtitle: "Обществознание · конспект",
    minutes: 9,
    body: "Иерархия НПА: Конституция → ФКЗ → ФЗ → указы Президента → постановления Правительства. Отрасли: конституционное, гражданское, уголовное, административное, трудовое, семейное.",
  },
  {
    id: "english-tenses-note",
    subjectId: "english",
    topicId: "english-grammar",
    kind: "note",
    title: "Present Simple vs Continuous",
    subtitle: "Английский язык · конспект",
    minutes: 7,
    body: "Simple — регулярное, факты, расписание (every day, usually). Continuous — сейчас/временно (now, at the moment, Look!). Маркеры решают выбор времени.",
  },
];

export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

export function materialsForSubject(subjectId: string): Material[] {
  return MATERIALS.filter((m) => m.subjectId === subjectId);
}
