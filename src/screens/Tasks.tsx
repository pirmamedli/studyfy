import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { SubjectTile } from "../lib/subjectIcons";
import { getSubject, SUBJECTS, testsForSubject } from "../data/content";
import { draftProgressLabel } from "../data/store";
import { Icon } from "../lib/icons";
import type { Test } from "../data/types";

type Filter = "all" | "new" | "wip";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Не начаты" },
  { id: "wip", label: "В работе" },
];

export function Tasks() {
  const { state, derived } = useApp();
  const nav = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const subjects = derived.subjects.filter((s) => {
    if (filter === "new") return s.percent === 0;
    if (filter === "wip") return s.percent > 0 && s.percent < 100;
    return true;
  });

  const testProgress = (testId: string) => draftProgressLabel(state, testId);
  const subjectNextTests = (subjectId: string): Test[] => {
    const tests = testsForSubject(subjectId);
    const drafts = tests.filter((t) => state.testDrafts[t.id] && !state.completedTests[t.id]);
    const fresh = tests.filter((t) => !state.completedTests[t.id] && !state.testDrafts[t.id]);
    const repeat = tests
      .filter((t) => state.completedTests[t.id])
      .sort(
        (a, b) =>
          (state.completedTests[a.id]?.bestPercent ?? 100) -
          (state.completedTests[b.id]?.bestPercent ?? 100),
      );
    return [...drafts, ...fresh, ...repeat].slice(0, 3);
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Задания</h1>
        <span className="badge badge-xp">
          {derived.subjects.length} / {SUBJECTS.length} предметов
        </span>
      </div>

      <div className="chip-scroller" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={"chip" + (filter === f.id ? " is-active" : "")}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div className="eyebrow eyebrow--accent" style={{ marginBottom: 2 }}>Индивидуальная программа</div>
          <h2 className="t-h2" style={{ fontSize: 18, margin: 0 }}>План на сегодня</h2>
        </div>
        {derived.todayPlan.length > 0 && (
          <span className="badge badge-xp">
            +{derived.todayPlan.filter((p) => !p.done).reduce((sum, p) => sum + p.xp, 0)} XP
          </span>
        )}
      </div>

      {derived.todayPlan.length > 0 ? (
        <div className="list" style={{ marginBottom: 22 }}>
          {derived.todayPlan.map((item) => {
            const progress = testProgress(item.testId);
            return (
              <button key={item.testId} className="list-row" onClick={() => nav(`/test/${item.testId}`)}>
                <SubjectTile icon={item.icon} active={item.done} />
                <div style={{ flex: 1 }}>
                  <div className={"row-title" + (item.done ? " row-title--done" : "")}>{item.title}</div>
                  <div className="row-sub">
                    {getSubject(item.subjectId)?.title} · {item.done ? "готово" : progress.label}
                  </div>
                </div>
                <span className={"check-circle" + (item.done ? " check-circle--done" : "")}>
                  {item.done ? <Icon name="check" size={14} /> : <Icon name="chevron-right" size={16} />}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card card-pad empty" style={{ marginBottom: 22 }}>
          План появится после выбора предметов в профиле
        </div>
      )}

      <div className="eyebrow" style={{ marginBottom: 10 }}>Предметы и следующие тесты</div>

      {subjects.length > 0 ? (
        <div style={{ display: "grid", gap: 14 }}>
          {subjects.map((s) => {
            const nextTests = subjectNextTests(s.subjectId);
            return (
              <section key={s.subjectId} className="card card-pad" style={{ padding: 14 }}>
                <button
                  className="list-row"
                  style={{ padding: 0, background: "transparent", boxShadow: "none" }}
                  onClick={() => nav(`/subject/${s.subjectId}`)}
                >
                  <SubjectTile icon={s.icon} active={s.percent >= 100} />
                  <div style={{ flex: 1 }}>
                    <div className="row-title" style={{ marginBottom: 6 }}>
                      {s.title}
                    </div>
                    <div className="bar">
                      <span style={{ width: `${s.percent}%` }} />
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.percent}%
                  </span>
                </button>

                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  {nextTests.map((test) => {
                    const progress = testProgress(test.id);
                    const done = Boolean(state.completedTests[test.id]);
                    return (
                      <button
                        key={test.id}
                        className="list-row"
                        style={{ padding: "10px 0", background: "transparent", boxShadow: "none" }}
                        onClick={() => nav(`/test/${test.id}`)}
                      >
                        <span className={"check-circle" + (done ? " check-circle--done" : "")}>
                          {done ? <Icon name="check" size={14} /> : <Icon name="clock" size={14} />}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div className={"row-title" + (done ? " row-title--done" : "")} style={{ fontSize: 14 }}>
                            {test.title}
                          </div>
                          <div className="row-sub">
                            {progress.label} · {test.questions.length} вопр. · {test.xpReward} XP
                          </div>
                        </div>
                        <Icon name="chevron-right" size={18} className="row-chev" />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="card card-pad empty">Нет предметов в этой категории</div>
      )}
    </>
  );
}
