import type { Question } from "./types";

// ─── нормализация сырого JSON (форма из старого сайта) → union Question ────────

function toIndexArray(c: unknown): number[] {
  if (Array.isArray(c)) return c.filter((x) => typeof x === "number");
  if (typeof c === "number") return [c];
  return [];
}

interface RawQuestion {
  type?: string;
  question: string;
  hint?: string;
  image?: string;
  answers?: string[];
  correct?: number | number[];
  pairs?: { left: string; right: string }[];
  leftItems?: string[];
  rightItems?: string[];
  items?: string[];
  correctOrder?: number[];
  acceptedAnswers?: string[];
}

export function normalizeQuestion(raw: RawQuestion): Question {
  const base = { question: raw.question, hint: raw.hint, image: raw.image };
  switch (raw.type) {
    case "multiple-choice":
      return { ...base, type: "multiple", answers: raw.answers ?? [], correct: toIndexArray(raw.correct) };
    case "matching": {
      const pairs = raw.pairs ?? [];
      const leftItems = raw.leftItems ?? pairs.map((p) => p.left);
      const rightItems = raw.rightItems ?? pairs.map((p) => p.right);
      const correctRight = leftItems.map((l) => pairs.find((p) => p.left === l)?.right ?? "");
      return { ...base, type: "matching", leftItems, rightItems, correctRight };
    }
    case "sequence":
      return {
        ...base,
        type: "sequence",
        items: raw.items ?? [],
        correctOrder: raw.correctOrder ?? (raw.items ?? []).map((_, i) => i),
      };
    case "free-response":
      return { ...base, type: "free", acceptedAnswers: raw.acceptedAnswers ?? [] };
    case "single-choice":
    default:
      return { ...base, type: "single", answers: raw.answers ?? [], correct: toIndexArray(raw.correct) };
  }
}

// ─── начальное состояние ответа ───────────────────────────────────────────────

export function emptyResponse(q: Question): unknown {
  switch (q.type) {
    case "single": return null;
    case "multiple": return [] as number[];
    case "matching": return q.leftItems.map(() => null) as (number | null)[];
    case "sequence": return q.items.map((_, i) => i); // текущий порядок 0..n-1
    case "free": return "";
  }
}

export function isAnswered(q: Question, response: unknown): boolean {
  switch (q.type) {
    case "single": return response !== null && response !== undefined;
    case "multiple": return Array.isArray(response) && response.length > 0;
    case "matching": return Array.isArray(response) && response.every((r) => r !== null);
    case "sequence": return true;
    case "free": return typeof response === "string" && response.trim() !== "";
  }
}

// ─── проверка правильности ────────────────────────────────────────────────────

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function normText(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
}

export function gradeQuestion(q: Question, response: unknown): boolean {
  switch (q.type) {
    case "single":
      return typeof response === "number" && q.correct[0] === response;
    case "multiple":
      return Array.isArray(response) && sameSet(response as number[], q.correct);
    case "matching":
      return (
        Array.isArray(response) &&
        response.length === q.leftItems.length &&
        q.correctRight.every((right, i) => {
          const chosenIdx = (response as (number | null)[])[i];
          return chosenIdx != null && q.rightItems[chosenIdx] === right;
        })
      );
    case "sequence":
      return (
        Array.isArray(response) &&
        response.length === q.correctOrder.length &&
        (response as number[]).every((v, i) => v === q.correctOrder[i])
      );
    case "free":
      return (
        typeof response === "string" &&
        q.acceptedAnswers.some((a) => normText(a) === normText(response))
      );
  }
}

// ─── текст правильного ответа (для разбора ошибок) ────────────────────────────

export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case "single":
      return q.answers[q.correct[0]] ?? "—";
    case "multiple":
      return q.correct.map((i) => q.answers[i]).join(", ");
    case "matching":
      return q.leftItems.map((l, i) => `${l} → ${q.correctRight[i]}`).join("; ");
    case "sequence":
      return q.correctOrder.map((i) => q.items[i]).join(" → ");
    case "free":
      return q.acceptedAnswers.join(" / ");
  }
}
