import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { Ring } from "../components/Ring";
import { getTest } from "../data/content";

export function TestResult() {
  const { attemptId = "" } = useParams();
  const { state, isFavorite, toggleFavorite } = useApp();
  const nav = useNavigate();

  const attempt = state.attempts.find((a) => a.id === attemptId);
  if (!attempt) {
    return (
      <div className="empty" style={{ paddingTop: 80 }}>
        Результат не найден
      </div>
    );
  }
  const test = getTest(attempt.testId);
  const fav = isFavorite(attempt.testId);
  const passed = attempt.percent >= 70;
  const wrong = test
    ? attempt.answers
        .filter((a) => !a.correct)
        .map((a) => test.questions[a.questionIndex])
        .filter(Boolean)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ flex: "0 0 auto", textAlign: "center", paddingTop: 12 }}>
        <Ring
          value={attempt.percent}
          size={132}
          stroke={10}
          fontSize={30}
          color={passed ? "var(--accent)" : "var(--warning)"}
        />
        <h1 className="t-h1" style={{ fontSize: 22, margin: "20px 0 6px" }}>
          {test?.resultTitle ?? (passed ? "Отличный результат" : "Есть над чем поработать")}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, margin: 0 }}>
          {attempt.correctCount} из {attempt.total} верно
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}>
          <span className="badge badge-xp">+{attempt.xpEarned} XP</span>
          <span className={"badge " + (passed ? "badge-success" : "")}>
            {passed ? "Зачёт" : "Повтори тему"}
          </span>
        </div>
      </div>

      {wrong.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div className="eyebrow">Ошибки для повторения</div>
          <div className="list">
            {wrong.map((question, i) => (
              <div key={i} className="list-row" style={{ alignItems: "flex-start" }}>
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
                    {question.question}
                  </div>
                  <div className="row-sub" style={{ color: "var(--success)" }}>
                    Верно: {question.answers[question.correct]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <button
          className="btn btn-primary btn-block"
          onClick={() => nav(`/test/${attempt.testId}`, { replace: true })}
        >
          <Icon name="refresh" size={18} /> Пройти заново
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => toggleFavorite(attempt.testId)}
          >
            <Icon name={fav ? "star-fill" : "star"} size={18} />
            {fav ? "В избранном" : "В избранное"}
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => nav("/")}>
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}
