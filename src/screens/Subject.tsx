import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { Ring } from "../components/Ring";
import { SubjectTile } from "../lib/subjectIcons";
import { getSubject, getTest, materialsForSubject, testsForSubject } from "../data/content";
import { kindLabel } from "../lib/labels";
import type { MaterialSection } from "../data/types";

function materialIcon(section: MaterialSection) {
  if (section === "flashcards") return "cards";
  if (section === "trials") return "calendar";
  if (section === "errorReview") return "refresh";
  return "book";
}

export function Subject() {
  const { id = "" } = useParams();
  const { state, derived } = useApp();
  const nav = useNavigate();
  const subject = getSubject(id);

  if (!subject) {
    return <div className="empty" style={{ paddingTop: 80 }}>Предмет не найден</div>;
  }

  const prog = derived.subjects.find((s) => s.subjectId === id);
  const percent = prog?.percent ?? 0;
  const tests = testsForSubject(id);
  const materials = materialsForSubject(id);
  const weak = derived.weakTopics.filter((w) => w.subjectId === id);
  const upcoming = derived.upcoming.filter((a) => a.subjectId === id);
  const history = Object.entries(state.completedTests)
    .filter(([tid]) => getTest(tid)?.subjectId === id)
    .sort((a, b) => b[1].completedAt.localeCompare(a[1].completedAt))
    .slice(0, 5);

  return (
    <>
      <div className="page-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Назад">
          <Icon name="chevron-left" size={20} />
        </button>
        <h1 className="page-title" style={{ flex: 1 }}>{subject.title}</h1>
      </div>

      <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
        <Ring value={percent} size={78} stroke={7} fontSize={18} />
        <div style={{ flex: 1 }}>
          <div className="eyebrow eyebrow--accent" style={{ marginBottom: 6 }}>Готовность</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>
            {prog?.completed ?? 0} из {prog?.total ?? tests.length} тестов
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            точность {prog?.accuracy ?? 0}% · ошибок {prog?.mistakes ?? 0}
          </div>
        </div>
      </div>

      {weak.length > 0 && (
        <>
          <div className="eyebrow">Слабые темы</div>
          <div className="list" style={{ marginBottom: 20 }}>
            {weak.map((w) => (
              <button
                key={w.topic}
                className="list-row"
                onClick={() => w.testId && nav(`/test/${w.testId}?mode=mistakes`)}
              >
                <span className="badge" style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}>
                  {w.count}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{w.topic}</div>
                  <div className="row-sub">ошибок для повторения: {w.count}</div>
                </div>
                <Icon name="refresh" size={18} className="row-chev" />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="eyebrow">Тесты и задания</div>
      <div className="list" style={{ marginBottom: 20 }}>
        {tests.map((t) => {
          const ct = state.completedTests[t.id];
          return (
            <button key={t.id} className="list-row" onClick={() => nav(`/test/${t.id}`)}>
              <SubjectTile icon={subject.icon} active={Boolean(ct)} />
              <div style={{ flex: 1 }}>
                <div className="row-title">{t.title}</div>
                <div className="row-sub">
                  {kindLabel(t.kind)} · {t.questions.length} вопр. · {t.xpReward} XP
                </div>
              </div>
              {ct ? (
                <span className="badge badge-success">{ct.bestPercent}%</span>
              ) : (
                <Icon name="chevron-right" size={20} className="row-chev" />
              )}
            </button>
          );
        })}
      </div>

      {upcoming.length > 0 && (
        <>
          <div className="eyebrow">Ближайшие активности</div>
          <div className="list" style={{ marginBottom: 20 }}>
            {upcoming.map((a) => (
              <div key={a.id} className="list-row">
                <span className="row-lead"><Icon name="calendar" size={20} /></span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{a.title}</div>
                  <div className="row-sub">{a.xp} XP</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {materials.length > 0 && (
        <>
          <div className="eyebrow">Материалы</div>
          <div className="list" style={{ marginBottom: 20 }}>
            {materials.map((m) => (
              <Link key={m.id} to={`/material/${m.id}`} className="list-row">
                <span className="row-lead">
                  <Icon name={materialIcon(m.section)} size={20} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{m.title}</div>
                  <div className="row-sub">{m.description ?? m.subtitle}</div>
                </div>
                <Icon name="chevron-right" size={20} className="row-chev" />
              </Link>
            ))}
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <div className="eyebrow">История результатов</div>
          <div className="list">
            {history.map(([tid, ct]) => (
              <button key={tid} className="list-row" onClick={() => nav(`/test/${tid}`)}>
                <span
                  className="badge"
                  style={{
                    background: ct.bestPercent >= 70 ? "color-mix(in srgb, var(--success) 14%, transparent)" : "var(--surface-2)",
                    color: ct.bestPercent >= 70 ? "var(--success)" : "var(--ink-2)",
                  }}
                >
                  {ct.bestPercent}%
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{getTest(tid)?.title ?? tid}</div>
                  <div className="row-sub">попыток: {ct.attempts} · лучший {ct.bestCorrect}/{ct.questionCount}</div>
                </div>
                <Icon name="chevron-right" size={20} className="row-chev" />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
