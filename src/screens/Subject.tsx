import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { Ring } from "../components/Ring";
import { SubjectTile } from "../lib/subjectIcons";
import {
  getSubject,
  materialsForSubject,
  testsForSubject,
} from "../data/content";
import { kindLabel } from "../lib/labels";

export function Subject() {
  const { id = "" } = useParams();
  const { state, derived } = useApp();
  const nav = useNavigate();
  const subject = getSubject(id);

  if (!subject) {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        Предмет не найден
      </div>
    );
  }

  const prog = derived.subjects.find((s) => s.subjectId === id);
  const percent = prog?.percent ?? 0;
  const tests = testsForSubject(id);
  const materials = materialsForSubject(id);
  const weak = derived.weakTopics.filter((w) => w.subjectId === id);
  const upcoming = derived.upcoming.filter((a) => a.subjectId === id);
  const history = state.attempts
    .filter((a) => a.subjectId === id && a.completed)
    .slice(0, 5);

  const bestFor = (testId: string) =>
    state.attempts
      .filter((a) => a.testId === testId && a.completed)
      .reduce((m, a) => Math.max(m, a.percent), -1);

  return (
    <>
      <div className="page-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Назад">
          <Icon name="chevron-left" size={20} />
        </button>
        <h1 className="page-title" style={{ flex: 1 }}>
          {subject.title}
        </h1>
      </div>

      {/* прогресс предмета */}
      <div
        className="card card-pad"
        style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}
      >
        <Ring value={percent} size={78} stroke={7} fontSize={18} />
        <div style={{ flex: 1 }}>
          <div className="eyebrow eyebrow--accent" style={{ marginBottom: 6 }}>
            Готовность
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>
            {prog?.passedTests ?? 0} из {prog?.totalTests ?? tests.length} тестов
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            выполнено заданий: {prog?.doneTasks ?? 0}
          </div>
        </div>
      </div>

      {/* слабые темы */}
      {weak.length > 0 && (
        <>
          <div className="eyebrow">Слабые темы</div>
          <div className="list" style={{ marginBottom: 20 }}>
            {weak.map((w) => (
              <div key={w.topicId} className="list-row">
                <span className="badge" style={{ background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }}>
                  {w.accuracy}%
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{w.title}</div>
                  <div className="row-sub">
                    ошибок: {w.wrong} из {w.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* тесты и задания */}
      <div className="eyebrow">Тесты и задания</div>
      <div className="list" style={{ marginBottom: 20 }}>
        {tests.map((t) => {
          const best = bestFor(t.id);
          return (
            <button
              key={t.id}
              className="list-row"
              onClick={() => nav(`/test/${t.id}`)}
            >
              <SubjectTile icon={subject.icon} active={best >= 100} />
              <div style={{ flex: 1 }}>
                <div className="row-title">{t.title}</div>
                <div className="row-sub">
                  {kindLabel(t.kind)} · {t.questions.length} вопр. · {t.xpReward} XP
                </div>
              </div>
              {best >= 0 ? (
                <span className="badge badge-success">{best}%</span>
              ) : (
                <Icon name="chevron-right" size={20} className="row-chev" />
              )}
            </button>
          );
        })}
      </div>

      {/* ближайшие активности */}
      {upcoming.length > 0 && (
        <>
          <div className="eyebrow">Ближайшие активности</div>
          <div className="list" style={{ marginBottom: 20 }}>
            {upcoming.map((a) => (
              <div key={a.id} className="list-row">
                <span className="row-lead">
                  <Icon name="calendar" size={20} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{a.title}</div>
                  <div className="row-sub">
                    {kindLabel(a.kind)} · {a.xp} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* материалы */}
      {materials.length > 0 && (
        <>
          <div className="eyebrow">Материалы</div>
          <div className="list" style={{ marginBottom: 20 }}>
            {materials.map((m) => (
              <Link key={m.id} to={`/materials`} className="list-row">
                <span className="row-lead">
                  <Icon name={m.kind === "flashcards" ? "cards" : "book"} size={20} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{m.title}</div>
                  <div className="row-sub">{m.subtitle}</div>
                </div>
                <Icon name="chevron-right" size={20} className="row-chev" />
              </Link>
            ))}
          </div>
        </>
      )}

      {/* история результатов */}
      {history.length > 0 && (
        <>
          <div className="eyebrow">История результатов</div>
          <div className="list">
            {history.map((a) => (
              <div key={a.id} className="list-row">
                <span
                  className="badge"
                  style={{
                    background:
                      a.percent >= 70
                        ? "color-mix(in srgb, var(--success) 14%, transparent)"
                        : "var(--surface-2)",
                    color: a.percent >= 70 ? "var(--success)" : "var(--ink-2)",
                  }}
                >
                  {a.percent}%
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{a.correctCount} / {a.total} верно</div>
                  <div className="row-sub">+{a.xpEarned} XP</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
