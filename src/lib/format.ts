export function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}

export function tasksWord(n: number): string {
  return pluralize(n, "задание", "задания", "заданий");
}

export function testsWord(n: number): string {
  return pluralize(n, "тест", "теста", "тестов");
}

export function cardsWord(n: number): string {
  return pluralize(n, "карточка", "карточки", "карточек");
}

/** Короткое имя: «Мурад Алиев» → «Мурад А.» */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

export function initials(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
