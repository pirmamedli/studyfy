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

export type QuestionType = "single" | "multiple" | "matching" | "sequence" | "free";

interface QuestionBase {
  question: string;
  hint?: string;
  /** внешняя картинка к вопросу */
  image?: string;
}

/** Один правильный вариант. */
export interface SingleChoiceQuestion extends QuestionBase {
  type: "single";
  answers: string[];
  correct: number[]; // ровно один индекс
}

/** Несколько правильных вариантов. */
export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple";
  answers: string[];
  correct: number[];
}

/** Сопоставление: для каждого левого пункта выбрать правильный правый. */
export interface MatchingQuestion extends QuestionBase {
  type: "matching";
  leftItems: string[];
  rightItems: string[];
  /** правильный правый текст для каждого leftItems[i] */
  correctRight: string[];
}

/** Расположить пункты в правильном порядке. */
export interface SequenceQuestion extends QuestionBase {
  type: "sequence";
  items: string[];
  /** правильный порядок как перестановка индексов items */
  correctOrder: number[];
}

/** Свободный ответ (текст/число). */
export interface FreeResponseQuestion extends QuestionBase {
  type: "free";
  acceptedAnswers: string[];
}

export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | MatchingQuestion
  | SequenceQuestion
  | FreeResponseQuestion;

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

export type MaterialSection = "notes" | "flashcards" | "trials";

export type MaterialBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

export interface Material {
  id: MaterialId;
  subjectId: SubjectId;
  topicId?: TopicId;
  section: MaterialSection;
  title: string;
  subtitle?: string;
  description?: string;
  /** минуты чтения / прохождения */
  minutes?: number;
  /** структурированное содержимое конспекта */
  blocks?: MaterialBlock[];
  /** карточки для запоминания (section === "flashcards") */
  cards?: { front: string; back: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Геймификация
// ─────────────────────────────────────────────────────────────────────────────

export interface Rank {
  id: string;
  title: string;
  /** минимальный суммарный XP для звания */
  minXp: number;
  /** акцентный цвет звания */
  color: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Прохождение тестов, ошибки, черновики
// ─────────────────────────────────────────────────────────────────────────────

/** Итог по тесту (лучший результат хранится, XP начисляется один раз). */
export interface CompletedTest {
  bestPercent: number;
  lastPercent: number;
  bestCorrect: number;
  questionCount: number;
  xpEarned: number;
  attempts: number;
  completedAt: string;
}

/** Ошибка по конкретному вопросу — для повторения. */
export interface Mistake {
  testId: TestId;
  testTitle: string;
  subjectId: SubjectId;
  questionIndex: number;
  topic: string;
  question: string;
  hint: string;
  correctAnswer: string;
  createdAt: string;
}

/** Черновик прохождения теста — позволяет продолжить с места остановки. */
export interface TestDraft {
  activeQuestion: number;
  /** ответы пользователя по каждому вопросу (форма зависит от типа) */
  answers: unknown[];
  /** подтверждён ли (проверен) ответ на каждый вопрос */
  confirmed: boolean[];
}

export type RetryMode = "full" | "mistakes";

/** Результат только что завершённого прохождения (для экрана результата). */
export interface TestResultData {
  testId: TestId;
  title: string;
  resultTitle: string;
  subjectId: SubjectId;
  total: number;
  correctCount: number;
  percent: number;
  earnedXp: number;
  alreadyDone: boolean;
  retryMode: RetryMode;
  wrong: Mistake[];
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

/** Элемент дневного фокуса (кандидат сегодняшнего плана). */
export interface FocusItem {
  kind: "test";
  id: TestId;
}

/**
 * Всё изменяемое пользовательское состояние — единый источник истины.
 * Модель прогресса повторяет оригинальное приложение Studify.
 */
export interface UserState {
  version: number;
  authed: boolean;
  profile: UserProfile;

  // ── геймификация ──
  xp: number;
  streak: number;
  lastVisitDate: string;
  streakBonusDates: string[];

  // ── жизни (лимит неверных ответов в день) ──
  lives: number;
  livesDate: string;
  dailyLivesLimit: number;
  unlimitedLives: boolean;

  // ── статистика ──
  correct: number;
  wrong: number;
  tasksDone: number;
  testsDone: number;

  // ── прохождение ──
  completedTasks: string[];
  completedTests: Record<TestId, CompletedTest>;
  favorites: TestId[];
  mistakes: Mistake[];
  testDrafts: Record<TestId, TestDraft>;

  // ── дневной фокус ──
  focusDate: string;
  focusIds: FocusItem[];
  focusBonusEarned: boolean;

  // ── календарь ──
  activities: CalendarActivity[];
  activeDays: Record<string, boolean>;
}
