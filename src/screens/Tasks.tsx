import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { SubjectTile } from "../lib/subjectIcons";
import { SUBJECTS } from "../data/content";

type Filter = "all" | "new" | "wip";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Не начаты" },
  { id: "wip", label: "В работе" },
];

export function Tasks() {
  const { derived } = useApp();
  const nav = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const subjects = derived.subjects.filter((s) => {
    if (filter === "new") return s.percent === 0;
    if (filter === "wip") return s.percent > 0 && s.percent < 100;
    return true;
  });

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

      {subjects.length > 0 ? (
        <div className="list">
          {subjects.map((s) => (
            <button
              key={s.subjectId}
              className="list-row"
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
          ))}
        </div>
      ) : (
        <div className="card card-pad empty">Нет предметов в этой категории</div>
      )}
    </>
  );
}
