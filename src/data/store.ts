import type {
  CalendarActivity,
  CompletedTest,
  FocusItem,
  Mistake,
  RetryMode,
  Test,
  TestDraft,
  TestResultData,
  UserProfile,
  UserState,
} from "./types";
import { TESTS, getTest } from "./content";
import { gradeQuestion, correctAnswerText } from "./questions";
import { addDays, today } from "../lib/date";

const STORAGE_KEY = "studyfy.state.v3";
const STATE_VERSION = 3;

export const DAILY_LIVES = 10;
export const MAX_DAILY_LIVES_LIMIT = 99;
export const STREAK_BONUS_XP = 5;
export const FOCUS_BONUS_XP = 10;
export const FOCUS_SIZE = 3;

/** Целевая дата ЕГЭ по классу. */
const EXAM_TARGET_BY_GRADE: Record<number, string> = {
  10: "2028-05-26",
  11: "2027-05-26",
};
const EXAM_FALLBACK = "2027-05-26";

export function examDateForGrade(grade: number): string {
  return EXAM_TARGET_BY_GRADE[grade] ?? EXAM_FALLBACK;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── local-first репозиторий (заменяемый на Supabase) ─────────────────────────

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
      return { ...defaultState(), ...parsed };
    } catch {
      return null;
    }
  }
  save(state: UserState): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch {
      /* приватный режим / переполнение */
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
  const base = defaultState();
  return { ...base, profile: { ...base.profile, ...(old.profile ?? {}) } };
}

// ─── дефолтное состояние ──────────────────────────────────────────────────────

export function defaultProfile(): UserProfile {
  const grade = 11;
  return {
    name: "",
    nickname: "",
    grade,
    subjectIds: ["russian", "basic-math", "history"],
    theme: "system",
    dailyGoalXp: 45,
    examDate: examDateForGrade(grade),
    notifications: {
      dailyReminder: true,
      unfinishedTest: true,
      newTestInSubject: true,
      streakWarning: true,
      newTrialExam: true,
    },
  };
}

export function defaultState(): UserState {
  const profile = defaultProfile();
  return {
    version: STATE_VERSION,
    authed: false,
    profile,
    xp: 0,
    streak: 0,
    lastVisitDate: "",
    streakBonusDates: [],
    lives: DAILY_LIVES,
    livesDate: "",
    dailyLivesLimit: DAILY_LIVES,
    unlimitedLives: false,
    correct: 0,
    wrong: 0,
    tasksDone: 0,
    testsDone: 0,
    completedTasks: [],
    completedTests: {},
    favorites: [],
    mistakes: [],
    testDrafts: {},
    focusDate: "",
    focusIds: [],
    focusBonusEarned: false,
    activities: generatePlan(profile.subjectIds),
    activeDays: {},
  };
}

// ─── дневной фокус (сегодняшний план) ─────────────────────────────────────────

export function generateFocus(state: UserState): FocusItem[] {
  const pool = TESTS.filter(
    (t) =>
      state.profile.subjectIds.includes(t.subjectId) && !state.completedTests[t.id],
  );
  return pool.slice(0, FOCUS_SIZE).map((t) => ({ kind: "test" as const, id: t.id }));
}

export function ensureDailyFocus(state: UserState): UserState {
  if (state.focusDate === today() && state.focusIds.length) return state;
  return { ...state, focusDate: today(), focusIds: generateFocus(state), focusBonusEarned: false };
}

function focusComplete(state: UserState): boolean {
  if (!state.focusIds.length) return false;
  return state.focusIds.every((f) => Boolean(state.completedTests[f.id]));
}

function applyFocusBonus(state: UserState): UserState {
  if (state.focusBonusEarned) return state;
  if (!focusComplete(state)) return state;
  return { ...state, xp: state.xp + FOCUS_BONUS_XP, focusBonusEarned: true };
}

// ─── жизни ────────────────────────────────────────────────────────────────────

export function normalizeLives(state: UserState): UserState {
  const t = today();
  if (state.livesDate === t) return state;
  return { ...state, lives: state.dailyLivesLimit, livesDate: t };
}

export function spendLife(state: UserState): UserState {
  if (state.unlimitedLives) return state;
  const norm = normalizeLives(state);
  return { ...norm, lives: Math.max(0, norm.lives - 1), livesDate: today() };
}

export function canSolve(state: UserState): boolean {
  if (state.unlimitedLives) return true;
  return normalizeLives(state).lives > 0;
}

// ─── вход: серия + бонус + сброс жизней ───────────────────────────────────────

export function login(state: UserState): UserState {
  const t = today();
  let next = normalizeLives({ ...state, authed: true });
  next = { ...next, activeDays: { ...next.activeDays, [t]: true } };

  if (next.lastVisitDate !== t) {
    const streak = next.lastVisitDate === addDays(t, -1) ? next.streak + 1 : 1;
    const awardBonus = !next.streakBonusDates.includes(t);
    next = {
      ...next,
      streak,
      lastVisitDate: t,
      lives: next.dailyLivesLimit,
      livesDate: t,
      xp: awardBonus ? next.xp + STREAK_BONUS_XP : next.xp,
      streakBonusDates: awardBonus ? [...next.streakBonusDates, t].slice(-90) : next.streakBonusDates,
    };
  }
  return ensureDailyFocus(next);
}

export function logout(state: UserState): UserState {
  return { ...state, authed: false };
}

// ─── черновики ────────────────────────────────────────────────────────────────

export function saveDraft(state: UserState, testId: string, draft: TestDraft): UserState {
  return { ...state, testDrafts: { ...state.testDrafts, [testId]: draft } };
}

export function clearDraft(state: UserState, testId: string): UserState {
  const next = { ...state.testDrafts };
  delete next[testId];
  return { ...state, testDrafts: next };
}

// ─── завершение теста ─────────────────────────────────────────────────────────

export interface CompleteTestInput {
  test: Test;
  /** ответы, выровненные по индексам test.questions */
  answers: unknown[];
  /** какие вопросы реально предъявлялись (для режима повтора ошибок) */
  questionIndices: number[];
  retryMode: RetryMode;
}

export function completeTest(
  state: UserState,
  { test, answers, questionIndices, retryMode }: CompleteTestInput,
): { state: UserState; result: TestResultData } {
  const indices = questionIndices.length ? questionIndices : test.questions.map((_, i) => i);
  const total = Math.max(1, indices.length);
  const correctCount = indices.filter((i) => gradeQuestion(test.questions[i], answers[i])).length;
  const percent = Math.round((correctCount / total) * 100);

  const wrong: Mistake[] = indices
    .filter((i) => !gradeQuestion(test.questions[i], answers[i]))
    .map((i) => ({
      testId: test.id,
      testTitle: test.title,
      subjectId: test.subjectId,
      questionIndex: i,
      topic: test.topicTitle,
      question: test.questions[i].question,
      hint: test.questions[i].hint ?? "",
      correctAnswer: correctAnswerText(test.questions[i]),
      createdAt: new Date().toISOString(),
    }));

  const taskId = `test-${test.id}`;
  const alreadyDone = state.completedTasks.includes(taskId);
  const possibleXp = retryMode === "full" ? Math.round((correctCount / total) * test.xpReward) : 0;
  const earnedXp = alreadyDone ? 0 : possibleXp;

  const result: TestResultData = {
    testId: test.id,
    title: test.title,
    resultTitle: test.resultTitle ?? "Тест завершён",
    subjectId: test.subjectId,
    total,
    correctCount,
    percent,
    earnedXp,
    alreadyDone,
    retryMode,
    wrong,
  };

  // режим повтора ошибок не меняет прогресс
  if (retryMode === "mistakes") return { state, result };

  const prev = state.completedTests[test.id];
  const completedTests: Record<string, CompletedTest> = {
    ...state.completedTests,
    [test.id]: {
      bestPercent: Math.max(prev?.bestPercent ?? 0, percent),
      lastPercent: percent,
      bestCorrect: Math.max(prev?.bestCorrect ?? 0, correctCount),
      questionCount: test.questions.length,
      xpEarned: prev?.xpEarned ?? earnedXp,
      attempts: (prev?.attempts ?? 0) + 1,
      completedAt: new Date().toISOString(),
    },
  };

  const retainedMistakes = state.mistakes.filter((m) => m.testId !== test.id);

  let next: UserState = {
    ...state,
    xp: state.xp + earnedXp,
    correct: state.correct + correctCount,
    wrong: state.wrong + (total - correctCount),
    tasksDone: state.tasksDone + (alreadyDone ? 0 : 1),
    testsDone: prev ? state.testsDone : state.testsDone + 1,
    completedTasks: alreadyDone ? state.completedTasks : [...state.completedTasks, taskId],
    completedTests,
    mistakes: [...retainedMistakes, ...wrong],
    activeDays: { ...state.activeDays, [today()]: true },
    activities: state.activities.map((a) =>
      a.testId === test.id && a.status !== "done" ? { ...a, status: "done" as const } : a,
    ),
  };
  next = clearDraft(next, test.id);
  next = applyFocusBonus(next);
  return { state: next, result };
}

export function toggleFavorite(state: UserState, testId: string): UserState {
  const has = state.favorites.includes(testId);
  return {
    ...state,
    favorites: has ? state.favorites.filter((id) => id !== testId) : [testId, ...state.favorites],
  };
}

export function updateProfile(state: UserState, patch: Partial<UserProfile>): UserState {
  const profile = { ...state.profile, ...patch };
  // класс определяет дату ЕГЭ, если пользователь её не менял вручную
  if (patch.grade && !patch.examDate && state.profile.examDate === examDateForGrade(state.profile.grade)) {
    profile.examDate = examDateForGrade(patch.grade);
  }
  let next: UserState = { ...state, profile };
  if (patch.subjectIds) {
    const kept = state.activities.filter((a) => a.status !== "planned");
    const keptTestIds = new Set(kept.map((a) => a.testId).filter(Boolean));
    const fresh = generatePlan(profile.subjectIds).filter((a) => !a.testId || !keptTestIds.has(a.testId));
    next = { ...next, activities: [...kept, ...fresh] };
    next = ensureDailyFocus({ ...next, focusDate: "" });
  }
  return next;
}

export function setActivityStatus(
  state: UserState,
  activityId: string,
  status: CalendarActivity["status"],
): UserState {
  return {
    ...state,
    activities: state.activities.map((a) => (a.id === activityId ? { ...a, status } : a)),
    activeDays: status === "done" ? { ...state.activeDays, [today()]: true } : state.activeDays,
  };
}

export function wipe(): UserState {
  return defaultState();
}

// ─── календарь: план из контента ──────────────────────────────────────────────

export function generatePlan(subjectIds: string[]): CalendarActivity[] {
  const pool = TESTS.filter((t) => subjectIds.includes(t.subjectId));
  const acts: CalendarActivity[] = [];
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

/** Метка прогресса теста по черновику. */
export function draftProgressLabel(state: UserState, testId: string): { percent: number; label: string } {
  const test = getTest(testId);
  if (!test) return { percent: 0, label: "Не начат" };
  if (state.completedTests[testId]) {
    return { percent: 100, label: `Пройден · ${state.completedTests[testId].bestPercent}%` };
  }
  const draft = state.testDrafts[testId];
  if (!draft) return { percent: 0, label: "Не начат" };
  const answered = draft.confirmed.filter(Boolean).length;
  const percent = Math.round((answered / test.questions.length) * 100);
  return { percent, label: percent > 0 ? `Продолжить · ${percent}%` : "Не начат" };
}
