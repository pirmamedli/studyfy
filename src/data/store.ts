import type {
  CalendarActivity,
  Test,
  TestAttempt,
  UserAnswer,
  UserProfile,
  UserState,
  XPTransaction,
} from "./types";
import { TESTS } from "./content/tests";
import { addDays, today } from "../lib/date";

const STORAGE_KEY = "studyfy.state.v2";
const STATE_VERSION = 2;

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ─── local-first репозиторий (абстракция, заменяемая на Supabase) ─────────────

export interface StateRepository {
  load(): UserState | null;
  save(state: UserState): void;
  clear(): void;
}

export class LocalStorageRepository implements StateRepository {
  constructor(private key = STORAGE_KEY) {}

  load(): UserState | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as UserState;
      if (parsed.version !== STATE_VERSION) return migrate(parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  save(state: UserState): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch {
      /* приватный режим / переполнение — тихо игнорируем */
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      /* noop */
    }
  }
}

function migrate(old: Partial<UserState>): UserState {
  // Простейшая миграция: сохраняем профиль, сбрасываем несовместимые поля.
  const base = defaultState();
  return {
    ...base,
    profile: { ...base.profile, ...(old.profile ?? {}) },
  };
}

// ─── дефолтное состояние ──────────────────────────────────────────────────────

export function defaultProfile(): UserProfile {
  return {
    name: "",
    nickname: "",
    grade: 11,
    subjectIds: ["russian", "basic-math", "history"],
    theme: "system",
    dailyGoalXp: 45,
    examDate: `${new Date().getFullYear() + (new Date().getMonth() >= 5 ? 1 : 0)}-06-01`,
    notifications: {
      dailyReminder: true,
      unfinishedTest: true,
      newTestInSubject: true,
      streakWarning: true,
      newTrialExam: true,
    },
  };
}

/**
 * План на ближайшие дни строится из контента (не из фейковых показателей).
 * Статус «planned» → становится «done» только при реальном выполнении.
 */
export function generatePlan(subjectIds: string[]): CalendarActivity[] {
  const pool = TESTS.filter((t) => subjectIds.includes(t.subjectId));
  const acts: CalendarActivity[] = [];
  // до 3 активностей на сегодня + по 1–2 на следующие дни
  pool.slice(0, 3).forEach((t) => acts.push(activityFromTest(t, today())));
  pool.slice(3, 5).forEach((t, i) => acts.push(activityFromTest(t, addDays(today(), i + 1))));
  return acts;
}

function activityFromTest(t: Test, date: string): CalendarActivity {
  return {
    id: uid("act"),
    date,
    subjectId: t.subjectId,
    kind: t.kind,
    title: t.title,
    xp: t.xpReward,
    testId: t.id,
    topicId: t.topicId,
    status: "planned",
  };
}

export function defaultState(): UserState {
  const profile = defaultProfile();
  return {
    version: STATE_VERSION,
    authed: false,
    profile,
    attempts: [],
    xp: [],
    favorites: [],
    activities: generatePlan(profile.subjectIds),
    activityDone: {},
    activeDays: {},
  };
}

// ─── чистые редьюсеры над UserState ───────────────────────────────────────────

/** XP за попытку: пропорционально проценту, минимум за старание. */
export function computeXp(test: Test, percent: number): number {
  if (percent >= 100) return test.xpReward;
  const earned = Math.round((test.xpReward * percent) / 100);
  return Math.max(percent > 0 ? 1 : 0, earned);
}

export interface CompleteTestInput {
  test: Test;
  answers: UserAnswer[];
  startedAt: string;
}

export function completeTest(
  state: UserState,
  { test, answers, startedAt }: CompleteTestInput,
): { state: UserState; attempt: TestAttempt } {
  const total = test.questions.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;
  const xpEarned = computeXp(test, percent);
  const now = new Date().toISOString();
  const day = today();

  const attempt: TestAttempt = {
    id: uid("att"),
    testId: test.id,
    subjectId: test.subjectId,
    topicId: test.topicId,
    kind: test.kind,
    startedAt,
    finishedAt: now,
    answers,
    total,
    correctCount,
    percent,
    xpEarned,
    completed: true,
  };

  const xpTx: XPTransaction = {
    id: uid("xp"),
    amount: xpEarned,
    reason: test.kind,
    at: now,
    testId: test.id,
    subjectId: test.subjectId,
  };

  // отметить связанные плановые активности сегодняшнего дня выполненными
  const activities = state.activities.map((a) =>
    a.testId === test.id && a.status !== "done"
      ? { ...a, status: "done" as const }
      : a,
  );

  return {
    state: {
      ...state,
      attempts: [attempt, ...state.attempts],
      xp: [xpTx, ...state.xp],
      activities,
      activeDays: { ...state.activeDays, [day]: true },
    },
    attempt,
  };
}

export function toggleFavorite(state: UserState, testId: string): UserState {
  const exists = state.favorites.some((f) => f.testId === testId);
  return {
    ...state,
    favorites: exists
      ? state.favorites.filter((f) => f.testId !== testId)
      : [{ testId, at: new Date().toISOString() }, ...state.favorites],
  };
}

export function setActivityStatus(
  state: UserState,
  activityId: string,
  status: CalendarActivity["status"],
): UserState {
  return {
    ...state,
    activities: state.activities.map((a) =>
      a.id === activityId ? { ...a, status } : a,
    ),
    activeDays:
      status === "done"
        ? { ...state.activeDays, [today()]: true }
        : state.activeDays,
  };
}

export function updateProfile(
  state: UserState,
  patch: Partial<UserProfile>,
): UserState {
  const profile = { ...state.profile, ...patch };
  // при смене набора предметов — перегенерировать план, не трогая уже
  // выполненные активности и не дублируя тесты, которые уже в плане.
  let activities = state.activities;
  if (patch.subjectIds) {
    const kept = state.activities.filter((a) => a.status !== "planned");
    const keptTestIds = new Set(kept.map((a) => a.testId).filter(Boolean));
    const fresh = generatePlan(profile.subjectIds).filter(
      (a) => !a.testId || !keptTestIds.has(a.testId),
    );
    activities = [...kept, ...fresh];
  }
  return { ...state, profile, activities };
}

export function login(state: UserState): UserState {
  return { ...state, authed: true, activeDays: { ...state.activeDays, [today()]: true } };
}

export function logout(state: UserState): UserState {
  return { ...state, authed: false };
}

/** Полное удаление аккаунта вместе с прогрессом. */
export function wipe(): UserState {
  return defaultState();
}
