import type { SubjectId, TopicId } from "../types";
import { SUBJECTS } from "./subjects";
import { TOPICS } from "./topics";
import { TESTS } from "./tests";
import { MATERIALS } from "./materials";

export { SUBJECTS } from "./subjects";
export { TOPICS } from "./topics";
export { TESTS, getTest, testsForSubject } from "./tests";
export { MATERIALS, getMaterial, materialsForSubject } from "./materials";

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

export function materialsForTopic(topicId: TopicId) {
  return MATERIALS.filter((m) => m.topicId === topicId);
}

export function testsForTopic(topicId: TopicId) {
  return TESTS.filter((t) => t.topicId === topicId);
}
