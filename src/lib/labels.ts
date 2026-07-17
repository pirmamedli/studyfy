import type { ContentKind } from "../data/types";

export const KIND_LABEL: Record<ContentKind, string> = {
  test: "Тест",
  trial: "Пробный экзамен",
  mini: "Мини-задание",
  flashcards: "Карточки",
  review: "Повторение ошибок",
  weak: "Слабая тема",
};

export function kindLabel(kind: ContentKind): string {
  return KIND_LABEL[kind] ?? "Задание";
}
