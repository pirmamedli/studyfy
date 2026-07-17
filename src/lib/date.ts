/** Локальная дата YYYY-MM-DD (без сдвига таймзоны). */
export function ymd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return ymd(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return ymd(d);
}

export function daysBetween(fromStr: string, toStr: string): number {
  const a = new Date(fromStr + "T00:00:00").getTime();
  const b = new Date(toStr + "T00:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAYS_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

export function humanDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function weekdayShort(dateStr: string): string {
  return WEEKDAYS_SHORT[new Date(dateStr + "T00:00:00").getDay()];
}

/** «Сегодня» / «Завтра» / «12 июля». */
export function relativeDay(dateStr: string): string {
  const diff = daysBetween(today(), dateStr);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  if (diff === -1) return "Вчера";
  return humanDate(dateStr);
}

/** Правильная форма слова «день» для числа. */
export function pluralDays(n: number): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return "дней";
  if (d === 1) return "день";
  if (d >= 2 && d <= 4) return "дня";
  return "дней";
}
