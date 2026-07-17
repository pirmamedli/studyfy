import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { collectMistakes } from "../data/progress";
import { getSubject } from "../data/content";

export function Mistakes() {
  const { state } = useApp();
  const nav = useNavigate();
  const mistakes = collectMistakes(state);

  return (
    <>
      <div className="page-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Назад">
          <Icon name="chevron-left" size={20} />
        </button>
        <h1 className="page-title" style={{ flex: 1 }}>Дневник ошибок</h1>
      </div>

      {mistakes.length === 0 ? (
        <div className="card card-pad empty" style={{ paddingTop: 48 }}>
          <Icon name="check" size={28} />
          <div style={{ marginTop: 8 }}>Ошибок пока нет — так держать!</div>
        </div>
      ) : (
        <div className="list">
          {mistakes.map((m, i) => (
            <button
              key={i}
              className="list-row"
              style={{ alignItems: "flex-start" }}
              onClick={() => nav(`/test/${m.testId}`)}
            >
              <span
                className="check-circle"
                style={{
                  border: 0,
                  background: "color-mix(in srgb, var(--danger) 16%, transparent)",
                  color: "var(--danger)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="close" size={13} />
              </span>
              <div style={{ flex: 1 }}>
                <div className="row-title" style={{ fontWeight: 500, fontSize: 14 }}>
                  {m.question}
                </div>
                <div className="row-sub" style={{ color: "var(--success)" }}>
                  Верно: {m.correctAnswer}
                </div>
                <div className="row-sub">
                  {getSubject(m.subjectId)?.title} · {m.topicTitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
