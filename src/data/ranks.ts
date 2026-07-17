import type { Rank } from "./types";

/**
 * Последовательность званий Studyfy.
 * Пороги XP подобраны как растущая кривая — чем выше звание, тем дороже шаг.
 */
export const RANKS: Rank[] = [
  { id: "novice", title: "Новичок", minXp: 0 },
  { id: "pupil", title: "Ученик", minXp: 120 },
  { id: "explorer", title: "Исследователь", minXp: 320 },
  { id: "adept", title: "Знаток", minXp: 650 },
  { id: "expert", title: "Эксперт", minXp: 1100 },
  { id: "master", title: "Магистр", minXp: 1700 },
  { id: "professor", title: "Профессор", minXp: 2500 },
  { id: "academic", title: "Академик", minXp: 3500 },
];

export interface RankProgress {
  current: Rank;
  next: Rank | null;
  /** XP, набранный внутри текущего звания */
  xpIntoRank: number;
  /** XP от начала текущего звания до следующего */
  xpRankSpan: number;
  /** сколько XP осталось до следующего звания (0 если максимум) */
  xpToNext: number;
  /** 0..100 прогресс до следующего звания */
  percentToNext: number;
}

export function rankForXp(totalXp: number): RankProgress {
  let currentIndex = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (totalXp >= RANKS[i].minXp) currentIndex = i;
  }
  const current = RANKS[currentIndex];
  const next = RANKS[currentIndex + 1] ?? null;

  if (!next) {
    return {
      current,
      next: null,
      xpIntoRank: totalXp - current.minXp,
      xpRankSpan: 0,
      xpToNext: 0,
      percentToNext: 100,
    };
  }

  const xpRankSpan = next.minXp - current.minXp;
  const xpIntoRank = totalXp - current.minXp;
  const xpToNext = Math.max(0, next.minXp - totalXp);
  const percentToNext = Math.min(
    100,
    Math.round((xpIntoRank / xpRankSpan) * 100),
  );

  return { current, next, xpIntoRank, xpRankSpan, xpToNext, percentToNext };
}
