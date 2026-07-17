/**
 * Studyfy — доменная модель.
 *
 * Ключевой принцип: единая связанная система.
 *   предмет → тема → материал/тест → попытка → ответы/ошибки → XP →
 *   прогресс предмета → слабые темы → план и календарь.
 *
 * КОНТЕНТ (Subject, Topic, Test, Material) — статичен, поставляется приложением.
 * ПОЛЬЗОВАТЕЛЬСКОЕ СОСТОЯНИЕ (attempts, xp, favorites, streak, prefs, calendar)
 * хранится в local-first репозитории и целиком выводит все показатели экранов.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Контент
// ─────────────────────────────────────────────────────────────────────────────

export type SubjectId = string;
export type TopicId = string;
export type TestId = string;
export type MaterialId = string;

export interface Subject {
  id: SubjectId;
  title: string;
  /** ключ монохромной иконки из subjectIcons */
  icon: string;
}

export interface Topic {
  id: TopicId;
  subjectId: SubjectId;
  title: string;
}

export interface AnswerOption {
  /** текст варианта ответа */
  text: string;
}

export interface Question {
  question: string;
  answers: string[];
  /** индекс правильного варианта в answers */
  correct: number;
  hint?: string;
}

/** Тип контента-активности — единая базовая логика, разные правила. */
export type ContentKind =
  | "test" // обычный тест
  | "trial" // пробный экзамен
  | "mini" // мини-задание
  | "flashcards" // карточки
  | "review" // повторение ошибок
  | "weak"; // работа со слабой темой

export interface Test {
  id: TestId;
  subjectId: SubjectId;
  topicId: TopicId;
  topicTitle: string;
  kind: ContentKind;
  title: string;
  subtitle?: string;
  resultTitle?: string;
  xpReward: number;
  questions: Question[];
}

export type MaterialKind = "note" | "flashcards" | "trial-guide";

export interface Material {
  id: MaterialId;
  subjectId: SubjectId;
  topicId?: TopicId;
  kind: MaterialKind;
  title: string;
  subtitle?: string;
  /** минуты чтения / прохождения */
  minutes?: number;
  /** markdown-подобный текст конспекта */
  body?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Геймификация
// ─────────────────────────────────────────────────────────────────────────────

export interface Rank {
  id: string;
  title: string;
  /** минимальный суммарный XP для звания */
  minXp: number;
}

export type XPReason =
  | "test"
  | "trial"
  | "mini"
  | "flashcards"
  | "review"
  | "weak"
  | "streak-bonus";

export interface XPTransaction {
  id: string;
  amount: number;
  reason: XPReason;
  /** ISO datetime */
  at: string;
  testId?: TestId;
  subjectId?: SubjectId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Попытки и ответы
// ─────────────────────────────────────────────────────────────────────────────

export interface UserAnswer {
  questionIndex: number;
  /** выбранный индекс варианта; null — пропущено */
  selected: number | null;
  correct: boolean;
}

export interface TestAttempt {
  id: string;
  testId: TestId;
  subjectId: SubjectId;
  topicId: TopicId;
  kind: ContentKind;
  /** ISO datetime старта */
  startedAt: string;
  /** ISO datetime завершения; отсутствует у незавершённого */
  finishedAt?: string;
  answers: UserAnswer[];
  /** число вопросов на момент попытки */
  total: number;
  correctCount: number;
  /** 0..100 */
  percent: number;
  xpEarned: number;
  completed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Календарь
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityStatus = "planned" | "done" | "skipped";

export interface CalendarActivity {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  subjectId: SubjectId;
  kind: ContentKind;
  title: string;
  xp: number;
  /** привязка к конкретному тесту, если есть */
  testId?: TestId;
  topicId?: TopicId;
  status: ActivityStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Профиль, настройки, уведомления
// ─────────────────────────────────────────────────────────────────────────────

export type ThemePref = "light" | "dark" | "system";

export interface NotificationPreference {
  dailyReminder: boolean;
  unfinishedTest: boolean;
  newTestInSubject: boolean;
  streakWarning: boolean;
  newTrialExam: boolean;
}

export interface UserProfile {
  name: string;
  nickname: string;
  grade: number; // класс обучения
  /** выбранные предметы ЕГЭ */
  subjectIds: SubjectId[];
  theme: ThemePref;
  /** дневная цель по XP */
  dailyGoalXp: number;
  /** ISO date целевого ЕГЭ, для «дней до ЕГЭ» */
  examDate: string;
  notifications: NotificationPreference;
}

// ─────────────────────────────────────────────────────────────────────────────
// Персистентное состояние (сериализуется целиком)
// ─────────────────────────────────────────────────────────────────────────────

export interface Favorite {
  testId: TestId;
  at: string;
}

/** Всё изменяемое пользовательское состояние — единый источник истины. */
export interface UserState {
  version: number;
  authed: boolean;
  profile: UserProfile;
  attempts: TestAttempt[];
  xp: XPTransaction[];
  favorites: Favorite[];
  activities: CalendarActivity[];
  /** отметки выполнения дневного плана: ключ `${date}:${activityId}` */
  activityDone: Record<string, boolean>;
  /** дни активности как YYYY-MM-DD → true (для серии) */
  activeDays: Record<string, boolean>;
}
