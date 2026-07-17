import type {
  CalendarActivity,
  SubjectId,
  TestAttempt,
  TopicId,
  UserState,
} from "./types";
import { rankForXp, type RankProgress } from "./ranks";
import { SUBJECTS, TESTS, TOPICS, getTopic, subjectTitle } from "./content";
import { addDays, daysBetween, today } from "../lib/date";

export interface SubjectProgress {
  subjectId: SubjectId;
  title: string;
  icon: string;
  /** 0..100 средняя готовность по тестам предмета */
  percent: number;
  /** сколько заданий (попыток) выполнено по предмету */
  doneTasks: number;
  totalTests: number;
  passedTests: number;
}

export interface WeakTopic {
  topicId: TopicId;
  title: string;
  subjectId: SubjectId;
  subjectTitle: string;
  icon: string;
  accuracy: number; // 0..100
  wrong: number;
  total: number;
}

export interface DayPlanItem extends CalendarActivity {
  done: boolean;
}

export interface Derived {
  totalXp: number;
  rank: RankProgress;
  streak: number;
  attemptsCompleted: number;
  solvedTasks: number;
  testsPassed: number;
  correctTotal: number;
  incorrectTotal: number;
  accuracy: number; // 0..100
  overallPercent: number; // средняя готовность по выбранным предметам
  daysToExam: number;
  xpToday: number;
  goalXp: number;
  goalPercent: number; // 0..100 выполнение дневной цели
  subjects: SubjectProgress[];
  weakTopics: WeakTopic[];
  todayPlan: DayPlanItem[];
  upcoming: DayPlanItem[];
}

function completedAttempts(state: UserState): TestAttempt[] {
  return state.attempts.filter((a) => a.completed);
}

/** Лучший результат (%) по каждому тесту. */
function bestPercentByTest(state: UserState): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of completedAttempts(state)) {
    map.set(a.testId, Math.max(map.get(a.testId) ?? 0, a.percent));
  }
  return map;
}

export function computeStreak(activeDays: Record<string, boolean>): number {
  // серия — подряд идущие активные дни, заканчивающиеся сегодня или вчера
  let cursor = today();
  if (!activeDays[cursor]) {
    cursor = addDays(cursor, -1);
    if (!activeDays[cursor]) return 0;
  }
  let streak = 0;
  while (activeDays[cursor]) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function subjectProgress(
  subjectId: SubjectId,
  best: Map<string, number>,
  attempts: TestAttempt[],
): SubjectProgress {
  const tests = TESTS.filter((t) => t.subjectId === subjectId);
  const totalTests = tests.length;
  const sum = tests.reduce((acc, t) => acc + (best.get(t.id) ?? 0), 0);
  const percent = totalTests ? Math.round(sum / totalTests) : 0;
  const passedTests = tests.filter((t) => (best.get(t.id) ?? 0) > 0).length;
  const doneTasks = attempts.filter((a) => a.subjectId === subjectId).length;
  const subj = SUBJECTS.find((s) => s.id === subjectId);
  return {
    subjectId,
    title: subj?.title ?? subjectId,
    icon: subj?.icon ?? subjectId,
    percent,
    doneTasks,
    totalTests,
    passedTests,
  };
}

function weakTopics(state: UserState): WeakTopic[] {
  const attempts = completedAttempts(state);
  const agg = new Map<TopicId, { wrong: number; total: number }>();
  for (const a of attempts) {
    const cur = agg.get(a.topicId) ?? { wrong: 0, total: 0 };
    cur.total += a.total;
    cur.wrong += a.total - a.correctCount;
    agg.set(a.topicId, cur);
  }
  const weak: WeakTopic[] = [];
  for (const [topicId, s] of agg) {
    if (s.total === 0) continue;
    const accuracy = Math.round(((s.total - s.wrong) / s.total) * 100);
    // слабая тема: есть заметные ошибки и точность ниже 70%
    if (s.wrong >= 2 && accuracy < 70) {
      const topic = getTopic(topicId);
      const subj = SUBJECTS.find((x) => x.id === topic?.subjectId);
      weak.push({
        topicId,
        title: topic?.title ?? topicId,
        subjectId: topic?.subjectId ?? "",
        subjectTitle: topic ? subjectTitle(topic.subjectId) : "",
        icon: subj?.icon ?? "basic-math",
        accuracy,
        wrong: s.wrong,
        total: s.total,
      });
    }
  }
  return weak.sort((a, b) => a.accuracy - b.accuracy);
}

export function computeDerived(state: UserState): Derived {
  const attempts = completedAttempts(state);
  const best = bestPercentByTest(state);
  const totalXp = state.xp.reduce((acc, x) => acc + x.amount, 0);
  const rank = rankForXp(totalXp);

  const correctTotal = attempts.reduce((acc, a) => acc + a.correctCount, 0);
  const answeredTotal = attempts.reduce((acc, a) => acc + a.total, 0);
  const incorrectTotal = answeredTotal - correctTotal;
  const accuracy = answeredTotal
    ? Math.round((correctTotal / answeredTotal) * 100)
    : 0;

  const selected = state.profile.subjectIds.length
    ? state.profile.subjectIds
    : SUBJECTS.map((s) => s.id);
  const subjects = selected.map((id) => subjectProgress(id, best, attempts));
  const overallPercent = subjects.length
    ? Math.round(subjects.reduce((a, s) => a + s.percent, 0) / subjects.length)
    : 0;

  const t = today();
  const xpToday = state.xp
    .filter((x) => x.at.slice(0, 10) === t)
    .reduce((acc, x) => acc + x.amount, 0);
  const goalXp = state.profile.dailyGoalXp;
  const goalPercent = goalXp ? Math.min(100, Math.round((xpToday / goalXp) * 100)) : 0;

  const withDone = (a: CalendarActivity): DayPlanItem => ({
    ...a,
    done: a.status === "done",
  });
  const todayPlan = state.activities.filter((a) => a.date === t).map(withDone);
  const upcoming = state.activities
    .filter((a) => a.date > t)
    .sort((x, y) => x.date.localeCompare(y.date))
    .map(withDone);

  const daysToExam = Math.max(0, daysBetween(t, state.profile.examDate));

  return {
    totalXp,
    rank,
    streak: computeStreak(state.activeDays),
    attemptsCompleted: attempts.length,
    solvedTasks: attempts.length,
    testsPassed: best.size,
    correctTotal,
    incorrectTotal,
    accuracy,
    overallPercent,
    daysToExam,
    xpToday,
    goalXp,
    goalPercent,
    subjects,
    weakTopics: weakTopics(state),
    todayPlan,
    upcoming,
  };
}

/** Ошибки для повторения: список неверно отвеченных вопросов из попыток. */
export interface MistakeItem {
  testId: string;
  subjectId: SubjectId;
  topicTitle: string;
  question: string;
  correctAnswer: string;
  chosenAnswer: string | null;
  at: string;
}

export function collectMistakes(state: UserState): MistakeItem[] {
  const items: MistakeItem[] = [];
  for (const a of completedAttempts(state)) {
    const test = TESTS.find((t) => t.id === a.testId);
    if (!test) continue;
    for (const ans of a.answers) {
      if (ans.correct) continue;
      const q = test.questions[ans.questionIndex];
      if (!q) continue;
      items.push({
        testId: test.id,
        subjectId: test.subjectId,
        topicTitle: test.topicTitle,
        question: q.question,
        correctAnswer: q.answers[q.correct],
        chosenAnswer: ans.selected != null ? q.answers[ans.selected] : null,
        at: a.finishedAt ?? a.startedAt,
      });
    }
  }
  return items.sort((x, y) => y.at.localeCompare(x.at));
}

export const ALL_TOPICS = TOPICS;
