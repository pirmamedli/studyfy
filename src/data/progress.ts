import type { Mistake, SubjectId, UserState } from "./types";
import { rankForXp, type RankProgress } from "./ranks";
import { SUBJECTS, TESTS, getTest, subjectTitle } from "./content";
import { FOCUS_BONUS_XP, normalizeLives } from "./store";
import { daysBetween, today } from "../lib/date";

export interface SubjectProgress {
  subjectId: SubjectId;
  title: string;
  icon: string;
  /** 0..100 готовность = пройдено тестов / всего */
  percent: number;
  /** 0..100 точность по пройденным тестам */
  accuracy: number;
  completed: number;
  total: number;
  doneTasks: number;
  mistakes: number;
}

export interface WeakTopic {
  topic: string;
  subjectId: SubjectId;
  subjectTitle: string;
  icon: string;
  count: number;
  testId?: string;
}

export interface FocusPlanItem {
  testId: string;
  title: string;
  subjectId: SubjectId;
  icon: string;
  xp: number;
  done: boolean;
}

export interface UpcomingItem {
  id: string;
  title: string;
  subjectId: SubjectId;
  date: string;
  xp: number;
  testId?: string;
  kind: string;
  done: boolean;
}

export interface Derived {
  totalXp: number;
  rank: RankProgress;
  streak: number;
  tasksDone: number;
  testsDone: number;
  correctTotal: number;
  incorrectTotal: number;
  accuracy: number;
  overallPercent: number;
  daysToExam: number;
  lives: number;
  dailyLivesLimit: number;
  unlimitedLives: boolean;
  subjects: SubjectProgress[];
  weakTopics: WeakTopic[];
  todayPlan: FocusPlanItem[];
  focusComplete: boolean;
  focusBonusEarned: boolean;
  focusBonusXp: number;
  upcoming: UpcomingItem[];
  favoritesCount: number;
}

function subjectProgress(subjectId: SubjectId, state: UserState): SubjectProgress {
  const tests = TESTS.filter((t) => t.subjectId === subjectId);
  const completedList = tests.filter((t) => state.completedTests[t.id]);
  const correct = completedList.reduce((s, t) => s + (state.completedTests[t.id]?.bestCorrect ?? 0), 0);
  const totalQ = completedList.reduce((s, t) => s + (state.completedTests[t.id]?.questionCount ?? 0), 0);
  const percent = tests.length ? Math.round((completedList.length / tests.length) * 100) : 0;
  const accuracy = totalQ ? Math.round((correct / totalQ) * 100) : 0;
  const subj = SUBJECTS.find((s) => s.id === subjectId);
  return {
    subjectId,
    title: subj?.title ?? subjectId,
    icon: subj?.icon ?? subjectId,
    percent,
    accuracy,
    completed: completedList.length,
    total: tests.length,
    doneTasks: completedList.length,
    mistakes: state.mistakes.filter((m) => m.subjectId === subjectId).length,
  };
}

function weakTopics(state: UserState): WeakTopic[] {
  const agg = new Map<string, WeakTopic>();
  for (const m of state.mistakes) {
    const key = `${m.subjectId}:${m.topic}`;
    const subj = SUBJECTS.find((s) => s.id === m.subjectId);
    const cur = agg.get(key) ?? {
      topic: m.topic,
      subjectId: m.subjectId,
      subjectTitle: subjectTitle(m.subjectId),
      icon: subj?.icon ?? "basic-math",
      count: 0,
      testId: m.testId,
    };
    cur.count += 1;
    agg.set(key, cur);
  }
  return [...agg.values()].sort((a, b) => b.count - a.count);
}

export function computeDerived(state: UserState): Derived {
  const lives = normalizeLives(state);
  const rank = rankForXp(state.xp);
  const answered = state.correct + state.wrong;
  const accuracy = answered ? Math.round((state.correct / answered) * 100) : 0;

  const selected = state.profile.subjectIds.length
    ? state.profile.subjectIds
    : SUBJECTS.map((s) => s.id);
  const subjects = selected.map((id) => subjectProgress(id, state));
  const overallPercent = subjects.length
    ? Math.round(subjects.reduce((a, s) => a + s.percent, 0) / subjects.length)
    : 0;

  const todayPlan: FocusPlanItem[] = state.focusIds
    .map((f) => {
      const test = getTest(f.id);
      if (!test) return null;
      const subj = SUBJECTS.find((s) => s.id === test.subjectId);
      return {
        testId: test.id,
        title: test.title,
        subjectId: test.subjectId,
        icon: subj?.icon ?? "basic-math",
        xp: test.xpReward,
        done: Boolean(state.completedTests[test.id]),
      };
    })
    .filter((x): x is FocusPlanItem => x !== null);
  const focusComplete = todayPlan.length > 0 && todayPlan.every((p) => p.done);

  const t = today();
  const upcoming: UpcomingItem[] = state.activities
    .filter((a) => a.date > t)
    .sort((x, y) => x.date.localeCompare(y.date))
    .map((a) => ({
      id: a.id,
      title: a.title,
      subjectId: a.subjectId,
      date: a.date,
      xp: a.xp,
      testId: a.testId,
      kind: a.kind,
      done: a.status === "done",
    }));

  return {
    totalXp: state.xp,
    rank,
    streak: state.streak,
    tasksDone: state.tasksDone,
    testsDone: state.testsDone,
    correctTotal: state.correct,
    incorrectTotal: state.wrong,
    accuracy,
    overallPercent,
    daysToExam: Math.max(0, daysBetween(t, state.profile.examDate)),
    lives: lives.lives,
    dailyLivesLimit: state.dailyLivesLimit,
    unlimitedLives: state.unlimitedLives,
    subjects,
    weakTopics: weakTopics(state),
    todayPlan,
    focusComplete,
    focusBonusEarned: state.focusBonusEarned,
    focusBonusXp: FOCUS_BONUS_XP,
    upcoming,
    favoritesCount: state.favorites.length,
  };
}

export function collectMistakes(state: UserState): Mistake[] {
  return [...state.mistakes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
