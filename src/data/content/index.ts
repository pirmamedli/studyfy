import type {
  ContentKind,
  Material,
  MaterialSection,
  SubjectId,
  Test,
  Topic,
  TopicId,
} from "../types";
import { normalizeQuestion } from "../questions";
import { SUBJECTS } from "./subjects";
import topicsData from "./topics.json";

export { SUBJECTS } from "./subjects";

export const TOPICS: Topic[] = topicsData as Topic[];

// ─── тесты: загружаются из JSON-файлов (реальная база старого сайта) ───────────

interface RawTest {
  id?: string;
  subjectId: string;
  topicId: string;
  topicTitle: string;
  kind?: string;
  title: string;
  subtitle?: string;
  resultTitle?: string;
  xpReward: number;
  questions: unknown[];
}

const testModules = import.meta.glob<{ default: RawTest }>("./tests/*.json", {
  eager: true,
});

export const TESTS: Test[] = Object.entries(testModules)
  .map(([path, mod]) => {
    const raw = mod.default;
    const slug = path.split("/").pop()!.replace(/\.json$/, "");
    return {
      id: raw.id ?? slug,
      subjectId: raw.subjectId,
      topicId: raw.topicId,
      topicTitle: raw.topicTitle,
      kind: (raw.kind as ContentKind) ?? "test",
      title: raw.title,
      subtitle: raw.subtitle,
      resultTitle: raw.resultTitle,
      xpReward: raw.xpReward,
      questions: (raw.questions ?? []).map((q) => normalizeQuestion(q as never)),
    } satisfies Test;
  })
  .sort((a, b) => a.title.localeCompare(b.title, "ru"));

// ─── материалы ────────────────────────────────────────────────────────────────

interface RawMaterial {
  id?: string;
  subjectId: string;
  topicId?: string;
  section?: string;
  title: string;
  subtitle?: string;
  description?: string;
  minutes?: number;
  blocks?: Material["blocks"];
  cards?: Material["cards"];
}

const materialModules = import.meta.glob<{ default: RawMaterial }>(
  "./materials/*.json",
  { eager: true },
);

export const MATERIALS: Material[] = Object.entries(materialModules)
  .map(([path, mod]) => {
    const raw = mod.default;
    const slug = path.split("/").pop()!.replace(/\.json$/, "");
    return {
      id: raw.id ?? slug,
      subjectId: raw.subjectId,
      topicId: raw.topicId,
      section: (raw.section as MaterialSection) ?? "notes",
      title: raw.title,
      subtitle: raw.subtitle,
      description: raw.description,
      minutes: raw.minutes,
      blocks: raw.blocks,
      cards: raw.cards,
    } satisfies Material;
  })
  .sort((a, b) => a.title.localeCompare(b.title, "ru"));

// ─── выборки ──────────────────────────────────────────────────────────────────

export function getSubject(id: SubjectId) {
  return SUBJECTS.find((s) => s.id === id);
}

export function subjectTitle(id: SubjectId): string {
  return getSubject(id)?.title ?? id;
}

export function getTopic(id: TopicId) {
  return TOPICS.find((t) => t.id === id);
}

export function topicsForSubject(id: SubjectId) {
  return TOPICS.filter((t) => t.subjectId === id);
}

export function getTest(id: string): Test | undefined {
  return TESTS.find((t) => t.id === id);
}

export function testsForSubject(subjectId: SubjectId): Test[] {
  return TESTS.filter((t) => t.subjectId === subjectId);
}

export function testsForTopic(topicId: TopicId): Test[] {
  return TESTS.filter((t) => t.topicId === topicId);
}

export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

export function materialsForSubject(subjectId: SubjectId): Material[] {
  return MATERIALS.filter((m) => m.subjectId === subjectId);
}

export function materialsForTopic(topicId: TopicId): Material[] {
  return MATERIALS.filter((m) => m.topicId === topicId);
}
