import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { getTest } from "../data/content";
import { gradeQuestion, isAnswered } from "../data/questions";
import type { Question, RetryMode } from "../data/types";

const LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З"];

export function TestRunner() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const retryMode: RetryMode = params.get("mode") === "mistakes" ? "mistakes" : "full";
  const app = useApp();
  const { state, finishTest, spendLife, canSolve, saveDraft } = app;
  const nav = useNavigate();
  const test = useMemo(() => getTest(id), [id]);

  // порядок предъявляемых вопросов: все или только ошибочные
  const order = useMemo(() => {
    if (!test) return [];
    if (retryMode === "mistakes") {
      const wrong = state.mistakes.filter((m) => m.testId === id).map((m) => m.questionIndex);
      const uniq = [...new Set(wrong)].sort((a, b) => a - b);
      return uniq.length ? uniq : test.questions.map((_, i) => i);
    }
    return test.questions.map((_, i) => i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, retryMode]);

  // восстановление черновика (только полный режим)
  const draft = retryMode === "full" ? state.testDrafts[id] : undefined;
  const [answers, setAnswers] = useState<unknown[]>(
    () => draft?.answers ?? (test ? test.questions.map(() => null) : []),
  );
  const [confirmed, setConfirmed] = useState<boolean[]>(
    () => draft?.confirmed ?? (test ? test.questions.map(() => false) : []),
  );
  const [pos, setPos] = useState(() => Math.min(order.length - 1, Math.max(0, draft?.activeQuestion ?? 0)));
  const [livesModal, setLivesModal] = useState(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const confirmedRef = useRef(confirmed);
  confirmedRef.current = confirmed;

  if (!test) {
    return <div className="empty" style={{ paddingTop: 80 }}>Тест не найден</div>;
  }

  const qIndex = order[pos];
  const q = test.questions[qIndex];
  const isConfirmed = confirmed[qIndex];
  const isLast = pos === order.length - 1;
  const progress = Math.round(((pos + 1) / order.length) * 100);
  const answered = isAnswered(q, answers[qIndex]);

  const persist = (a: unknown[], c: boolean[], p: number) => {
    if (retryMode === "full") saveDraft(id, { activeQuestion: p, answers: a, confirmed: c });
  };

  const setAnswer = (value: unknown) => {
    const next = [...answers];
    next[qIndex] = value;
    setAnswers(next);
  };

  const confirm = () => {
    if (!canSolve()) {
      setLivesModal(true);
      return;
    }
    const correct = gradeQuestion(q, answers[qIndex]);
    const nextConfirmed = [...confirmed];
    nextConfirmed[qIndex] = true;
    setConfirmed(nextConfirmed);
    persist(answers, nextConfirmed, pos);
    if (!correct) spendLife();
  };

  const go = (delta: number) => {
    const np = pos + delta;
    if (np < 0) {
      nav(-1);
      return;
    }
    if (np >= order.length) {
      finish();
      return;
    }
    persist(answers, confirmed, np);
    setPos(np);
  };

  const exitTest = () => {
    persist(answersRef.current, confirmedRef.current, pos);
    nav(`/subject/${test.subjectId}`);
  };

  const finish = () => {
    const result = finishTest({ test, answers: answersRef.current, questionIndices: order, retryMode });
    nav(`/result/${test.id}`, { replace: true, state: { result } });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* верхняя панель: выход · прогресс · счётчик · жизни */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button className="icon-btn" onClick={exitTest} aria-label="Выйти из теста">
          <Icon name="close" size={20} />
        </button>
        <div className="progress-track" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        {!state.unlimitedLives && (
          <span className="badge" style={{ gap: 4, color: "var(--danger)" }} title="Жизни на сегодня">
            <Icon name="star-fill" size={14} style={{ color: "var(--danger)" }} />
            {state.lives}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
          {pos + 1}/{order.length}
        </span>
      </div>

      <div className="eyebrow eyebrow--accent">
        {retryMode === "mistakes" ? "Повтор ошибок · " : ""}
        {test.subtitle || test.topicTitle} · {test.topicTitle}
      </div>
      {(q.contextTitle || q.contextText) && (
        <div
          className="card-inset"
          style={{
            padding: 14,
            marginBottom: 14,
            maxHeight: 180,
            overflow: "auto",
          }}
        >
          {q.contextTitle && (
            <div className="eyebrow" style={{ marginBottom: q.contextText ? 8 : 0 }}>
              {q.contextTitle}
            </div>
          )}
          {q.contextText && (
            <p style={{ margin: 0, whiteSpace: "pre-line", color: "var(--ink-2)", fontSize: 15, lineHeight: 1.55 }}>
              {q.contextText}
            </p>
          )}
        </div>
      )}
      <h2 className="t-h1" style={{ fontSize: 21, lineHeight: 1.3, margin: "0 0 16px", textWrap: "balance", whiteSpace: "pre-line" }}>
        {q.question}
      </h2>

      {q.image && (
        <figure style={{ margin: "0 0 16px" }}>
          <img
            src={q.image}
            alt={q.imageAlt ?? ""}
            style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 12, background: "var(--surface-2)" }}
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
          {q.caption && (
            <figcaption className="t-caption" style={{ marginTop: 8, textAlign: "center" }}>
              {q.caption}
            </figcaption>
          )}
        </figure>
      )}

      <div style={{ flex: 1 }}>
        <QuestionBody q={q} response={answers[qIndex]} confirmed={isConfirmed} onChange={setAnswer} />
      </div>

      {/* обратная связь после подтверждения */}
      {isConfirmed && <Feedback q={q} response={answers[qIndex]} />}

      {/* действия */}
      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        {pos > 0 && (
          <button className="btn btn-secondary" onClick={() => go(-1)}>Назад</button>
        )}
        {!isConfirmed ? (
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!answered} onClick={confirm}>
            Отправить ответ
          </button>
        ) : (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => go(1)}>
            {isLast ? "Завершить" : "Дальше"}
          </button>
        )}
      </div>

      {livesModal && <LivesModal onClose={() => setLivesModal(false)} onPro={() => { app.setUnlimitedLives(true); setLivesModal(false); }} />}
    </div>
  );
}

// ─── обратная связь ───────────────────────────────────────────────────────────

function Feedback({ q, response }: { q: Question; response: unknown }) {
  const correct = gradeQuestion(q, response);
  const text = correct
    ? q.hint || "Верно!"
    : `Неверно. ${correctAnswerLine(q)}${q.hint ? ` ${q.hint}` : ""}`;
  return (
    <div
      className="card-inset"
      style={{
        marginTop: 14,
        padding: 14,
        borderLeft: `3px solid ${correct ? "var(--success)" : "var(--danger)"}`,
        fontSize: 14,
        color: "var(--ink-2)",
      }}
    >
      <b style={{ color: correct ? "var(--success)" : "var(--danger)" }}>
        {correct ? "Верно! " : ""}
      </b>
      {text}
    </div>
  );
}

function correctAnswerLine(q: Question): string {
  switch (q.type) {
    case "single":
      return `Правильный ответ: ${q.answers[q.correct[0]] ?? "—"}.`;
    case "multiple":
      return `Правильный ответ: ${q.correct.map((i) => q.answers[i]).join(", ")}.`;
    case "matching":
      return `Верные пары: ${q.leftItems.map((l, i) => `${l} → ${q.correctRight[i]}`).join("; ")}.`;
    case "sequence":
      return `Верный порядок: ${q.correctOrder.map((i) => q.items[i]).join(" → ")}.`;
    case "free":
      return `Правильный ответ: ${q.acceptedAnswers[0] ?? "—"}.`;
  }
}

// ─── тело вопроса (с раскрытием после подтверждения) ─────────────────────────

function QuestionBody({
  q,
  response,
  confirmed,
  onChange,
}: {
  q: Question;
  response: unknown;
  confirmed: boolean;
  onChange: (v: unknown) => void;
}) {
  switch (q.type) {
    case "single": {
      const sel = response as number | null;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {q.answers.map((ans, i) => {
            const cls = confirmed
              ? q.correct.includes(i)
                ? " is-correct"
                : sel === i
                  ? " is-wrong"
                  : ""
              : sel === i
                ? " is-selected"
                : "";
            return (
              <button key={i} className={"option" + cls} disabled={confirmed} onClick={() => onChange(i)}>
                <span className="option-key">{LETTERS[i]}</span>
                <span className="option-text">{ans}</span>
              </button>
            );
          })}
        </div>
      );
    }
    case "multiple": {
      const sel = (response as number[]) ?? [];
      const toggle = (i: number) => onChange(sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]);
      return (
        <>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Выберите все верные</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {q.answers.map((ans, i) => {
              const chosen = sel.includes(i);
              const cls = confirmed
                ? q.correct.includes(i)
                  ? " is-correct"
                  : chosen
                    ? " is-wrong"
                    : ""
                : chosen
                  ? " is-selected"
                  : "";
              return (
                <button key={i} className={"option" + cls} disabled={confirmed} onClick={() => toggle(i)}>
                  <span className="option-key" style={{ borderRadius: 7 }}>
                    {chosen || (confirmed && q.correct.includes(i)) ? <Icon name="check" size={14} /> : LETTERS[i]}
                  </span>
                  <span className="option-text">{ans}</span>
                </button>
              );
            })}
          </div>
        </>
      );
    }
    case "matching": {
      const sel = (response as (number | null)[]) ?? q.leftItems.map(() => null);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {q.leftItems.map((left, i) => {
            const chosenIdx = sel[i];
            const ok = confirmed && chosenIdx != null && q.rightItems[chosenIdx] === q.correctRight[i];
            const bad = confirmed && !ok;
            return (
              <div
                key={i}
                className="card card-pad"
                style={{
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  borderColor: confirmed ? (ok ? "var(--success)" : "var(--danger)") : undefined,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{left}</div>
                <select
                  className="input"
                  disabled={confirmed}
                  value={chosenIdx ?? ""}
                  onChange={(e) => {
                    const next = [...sel];
                    next[i] = e.target.value === "" ? null : Number(e.target.value);
                    onChange(next);
                  }}
                >
                  <option value="">— выбрать —</option>
                  {q.rightItems.map((r, ri) => (
                    <option key={ri} value={ri}>{r}</option>
                  ))}
                </select>
                {bad && (
                  <div className="row-sub" style={{ color: "var(--success)" }}>Верно: {q.correctRight[i]}</div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    case "sequence": {
      const orderArr = (response as number[]) ?? q.items.map((_, i) => i);
      const move = (p: number, dir: -1 | 1) => {
        const to = p + dir;
        if (to < 0 || to >= orderArr.length) return;
        const next = [...orderArr];
        [next[p], next[to]] = [next[to], next[p]];
        onChange(next);
      };
      return (
        <div className="list">
          {orderArr.map((itemIdx, p) => {
            const ok = confirmed && itemIdx === q.correctOrder[p];
            return (
              <div key={itemIdx} className="list-row" style={{ background: confirmed ? (ok ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--danger) 10%, transparent)") : undefined }}>
                <span className="badge badge-xp" style={{ minWidth: 26, justifyContent: "center" }}>{p + 1}</span>
                <span style={{ flex: 1, fontSize: 15, color: "var(--ink)" }}>{q.items[itemIdx]}</span>
                {!confirmed && (
                  <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button className="icon-btn" style={{ width: 30, height: 26 }} onClick={() => move(p, -1)} disabled={p === 0} aria-label="Вверх">
                      <Icon name="chevron-left" size={16} style={{ transform: "rotate(90deg)" }} />
                    </button>
                    <button className="icon-btn" style={{ width: 30, height: 26 }} onClick={() => move(p, 1)} disabled={p === orderArr.length - 1} aria-label="Вниз">
                      <Icon name="chevron-left" size={16} style={{ transform: "rotate(-90deg)" }} />
                    </button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    case "free": {
      const val = (response as string) ?? "";
      const cls = confirmed ? (gradeQuestion(q, val) ? " is-error-none" : "") : "";
      return (
        <input
          className={"input" + cls}
          placeholder={q.placeholder ?? "Ваш ответ"}
          value={val}
          disabled={confirmed}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          style={
            confirmed
              ? { borderColor: gradeQuestion(q, val) ? "var(--success)" : "var(--danger)" }
              : undefined
          }
        />
      );
    }
  }
}

// ─── модалка «жизни закончились» ──────────────────────────────────────────────

function LivesModal({ onClose, onPro }: { onClose: () => void; onPro: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,14,8,.55)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div className="card card-pad" style={{ maxWidth: 340, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 44 }}>💔</div>
        <div className="eyebrow eyebrow--accent" style={{ justifyContent: "center", marginTop: 6 }}>Лёва грустит</div>
        <h2 className="t-h3" style={{ margin: "6px 0 8px" }}>Лимит неверных ответов на сегодня исчерпан</h2>
        <p className="row-sub" style={{ marginBottom: 16 }}>
          Жизни восстановятся завтра. Можно продолжить без ограничений в режиме ПРО.
        </p>
        <button className="btn btn-primary btn-block" onClick={onPro}>Активировать ПРО</button>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={onClose}>Вернуться к заданиям</button>
      </div>
    </div>
  );
}
