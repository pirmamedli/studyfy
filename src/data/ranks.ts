import type { Rank } from "./types";

/**
 * Последовательность званий Studyfy — пороги XP из оригинального приложения.
 */
export const RANKS: Rank[] = [
  { id: "novice", title: "Новичок", minXp: 0, color: "#6fb56f" },
  { id: "pupil", title: "Ученик", minXp: 1000, color: "#4f9bd8" },
  { id: "explorer", title: "Исследователь", minXp: 2500, color: "#8b72d9" },
  { id: "adept", title: "Знаток", minXp: 5000, color: "#d99c3a" },
  { id: "expert", title: "Эксперт", minXp: 7500, color: "#e46f52" },
  { id: "master", title: "Магистр", minXp: 10000, color: "#f26a00" },
  { id: "professor", title: "Профессор", minXp: 15000, color: "#c86bde" },
  { id: "academic", title: "Академик", minXp: 20000, color: "#2f2a21" },
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
  /** индекс текущего звания */
  index: number;
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
      index: currentIndex,
    };
  }

  const xpRankSpan = next.minXp - current.minXp;
  const xpIntoRank = totalXp - current.minXp;
  const xpToNext = Math.max(0, next.minXp - totalXp);
  const percentToNext = Math.min(100, Math.round((xpIntoRank / xpRankSpan) * 100));

  return { current, next, xpIntoRank, xpRankSpan, xpToNext, percentToNext, index: currentIndex };
}
