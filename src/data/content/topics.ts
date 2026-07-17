import type { Topic } from "../types";

/** Темы внутри предметов — к ним привязаны тесты, материалы и слабые темы. */
export const TOPICS: Topic[] = [
  { id: "russian-orthoepy", subjectId: "russian", title: "Орфоэпия" },
  { id: "russian-orthography", subjectId: "russian", title: "Орфография" },
  { id: "russian-punctuation", subjectId: "russian", title: "Пунктуация" },

  { id: "math-arithmetic", subjectId: "basic-math", title: "Арифметика и проценты" },
  { id: "math-geometry", subjectId: "basic-math", title: "Геометрия" },

  { id: "history-dates", subjectId: "history", title: "Даты и события" },
  { id: "history-palace", subjectId: "history", title: "Дворцовые перевороты" },

  { id: "social-law", subjectId: "social", title: "Право" },
  { id: "social-economy", subjectId: "social", title: "Экономика" },

  { id: "english-grammar", subjectId: "english", title: "Грамматика" },
  { id: "english-vocab", subjectId: "english", title: "Лексика" },
];
