import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { getTest } from "../data/content";
import type { UserAnswer } from "../data/types";

const LETTERS = ["А", "Б", "В", "Г", "Д", "Е"];

export function TestRunner() {
  const { id = "" } = useParams();
  const { finishTest } = useApp();
  const nav = useNavigate();
  const test = useMemo(() => getTest(id), [id]);
  const startedAt = useRef(new Date().toISOString());

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<(number | null)[]>(() =>
    test ? test.questions.map(() => null) : [],
  );

  if (!test) {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        Тест не найден
      </div>
    );
  }

  const total = test.questions.length;
  const q = test.questions[index];
  const isLast = index === total - 1;
  const progress = Math.round(((index + 1) / total) * 100);

  function choose(i: number) {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = i;
      return next;
    });
  }

  function goPrev() {
    if (index > 0) setIndex(index - 1);
    else nav(-1);
  }

  function goNext() {
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    const answers: UserAnswer[] = test!.questions.map((question, qi) => ({
      questionIndex: qi,
      selected: selected[qi],
      correct: selected[qi] === question.correct,
    }));
    const attempt = finishTest({ test: test!, answers, startedAt: startedAt.current });
    nav(`/result/${attempt.id}`, { replace: true });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* прогресс */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <button className="icon-btn" onClick={goPrev} aria-label="Назад">
          <Icon name="chevron-left" size={20} />
        </button>
        <div className="progress-track" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {index + 1}/{total}
        </span>
      </div>

      <div className="eyebrow eyebrow--accent">
        {test.subtitle} · {test.topicTitle}
      </div>
      <h2
        className="t-h1"
        style={{ fontSize: 21, lineHeight: 1.3, margin: "0 0 24px", textWrap: "balance" }}
      >
        {q.question}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {q.answers.map((ans, i) => (
          <button
            key={i}
            className={"option" + (selected[index] === i ? " is-selected" : "")}
            onClick={() => choose(i)}
          >
            <span className="option-key">{LETTERS[i]}</span>
            <span className="option-text">{ans}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        {index > 0 && (
          <button className="btn btn-secondary" onClick={() => setIndex(index - 1)}>
            Назад
          </button>
        )}
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={goNext}
        >
          {isLast ? "Завершить" : "Далее"}
        </button>
      </div>
    </div>
  );
}
