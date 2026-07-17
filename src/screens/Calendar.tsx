import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { SubjectTile } from "../lib/subjectIcons";
import { getSubject } from "../data/content";
import { kindLabel } from "../lib/labels";
import { relativeDay, weekdayShort } from "../lib/date";
import type { CalendarActivity } from "../data/types";

export function Calendar() {
  const { state, derived, setActivity } = useApp();
  const nav = useNavigate();

  // сгруппировать активности по дате (от сегодня и вперёд + прошедшие)
  const byDate = new Map<string, CalendarActivity[]>();
  for (const a of [...state.activities].sort((x, y) => x.date.localeCompare(y.date))) {
    const arr = byDate.get(a.date) ?? [];
    arr.push(a);
    byDate.set(a.date, arr);
  }

  return (
    <>
      <div className="page-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Назад">
          <Icon name="chevron-left" size={20} />
        </button>
        <h1 className="page-title" style={{ flex: 1 }}>Календарь</h1>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20, display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="t-num" style={{ fontSize: 22, color: "var(--ink)" }}>
            {derived.xpToday}
          </div>
          <div className="row-sub">XP сегодня из {derived.goalXp}</div>
        </div>
        <div style={{ width: 1, background: "var(--line)" }} />
        <div style={{ flex: 1 }}>
          <div className="t-num" style={{ fontSize: 22, color: "var(--ink)" }}>
            {derived.todayPlan.filter((p) => p.done).length}/{derived.todayPlan.length}
          </div>
          <div className="row-sub">план на сегодня</div>
        </div>
      </div>

      {[...byDate.entries()].map(([date, acts]) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
            {relativeDay(date)}
            <span style={{ color: "var(--line-2)" }}>· {weekdayShort(date)}</span>
          </div>
          <div className="list">
            {acts.map((a) => {
              const subj = getSubject(a.subjectId);
              const done = a.status === "done";
              return (
                <div key={a.id} className="list-row">
                  <SubjectTile icon={subj?.icon ?? "basic-math"} active={done} />
                  <button
                    style={{ flex: 1, textAlign: "left", background: "none" }}
                    onClick={() => a.testId && nav(`/test/${a.testId}`)}
                  >
                    <div className={"row-title" + (done ? " row-title--done" : "")}>
                      {a.title}
                    </div>
                    <div className="row-sub">
                      {kindLabel(a.kind)} · {subj?.title} · {a.xp} XP
                    </div>
                  </button>
                  <button
                    className={"check-circle" + (done ? " check-circle--done" : "")}
                    aria-label={done ? "Отменить" : "Отметить выполненным"}
                    onClick={() => setActivity(a.id, done ? "planned" : "done")}
                  >
                    {done && <Icon name="check" size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
