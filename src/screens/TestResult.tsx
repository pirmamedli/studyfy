import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { Ring } from "../components/Ring";
import { getTest } from "../data/content";
import type { TestResultData } from "../data/types";

export function TestResult() {
  const { testId = "" } = useParams();
  const location = useLocation();
  const { state, derived, isFavorite, toggleFavorite } = useApp();
  const nav = useNavigate();

  // результат передаётся через navigation state; при перезагрузке — реконструкция
  let result = (location.state as { result?: TestResultData } | null)?.result;
  if (!result) {
    const ct = state.completedTests[testId];
    const test = getTest(testId);
    if (ct && test) {
      result = {
        testId,
        title: test.title,
        resultTitle: test.resultTitle ?? "Тест завершён",
        subjectId: test.subjectId,
        total: ct.questionCount,
        correctCount: ct.bestCorrect,
        percent: ct.bestPercent,
        earnedXp: ct.xpEarned,
        alreadyDone: true,
        retryMode: "full",
        wrong: state.mistakes.filter((m) => m.testId === testId),
      };
    }
  }

  if (!result) {
    return <div className="empty" style={{ paddingTop: 80 }}>Результат не найден</div>;
  }

  const fav = isFavorite(result.testId);
  const passed = result.percent >= 70;
  const { rank } = derived;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ flex: "0 0 auto", textAlign: "center", paddingTop: 12 }}>
        <Ring
          value={result.percent}
          size={132}
          stroke={10}
          fontSize={30}
          color={passed ? "var(--accent)" : "var(--warning)"}
        />
        <h1 className="t-h1" style={{ fontSize: 22, margin: "20px 0 6px" }}>{result.resultTitle}</h1>
        <p style={{ color: "var(--muted)", fontSize: 15, margin: 0 }}>
          {result.correctCount} из {result.total} правильных ответов
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <span className="badge badge-xp">
            {result.retryMode === "mistakes"
              ? "Повтор без XP"
              : result.alreadyDone
                ? "XP уже начислены"
                : `+${result.earnedXp} XP`}
          </span>
          <span className={"badge " + (passed ? "badge-success" : "")}>
            {passed ? "Зачёт" : "Повтори тему"}
          </span>
        </div>
        {rank.next && (
          <div style={{ maxWidth: 280, margin: "16px auto 0" }}>
            <div className="row-sub" style={{ marginBottom: 6 }}>
              До «{rank.next.title}» — {rank.xpToNext} XP
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${rank.percentToNext}%` }} />
            </div>
          </div>
        )}
      </div>

      {result.wrong.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <div className="eyebrow">Ошибки для повторения</div>
          <div className="list">
            {result.wrong.map((m, i) => (
              <div key={i} className="list-row" style={{ alignItems: "flex-start" }}>
                <span
                  className="check-circle"
                  style={{ border: 0, background: "color-mix(in srgb, var(--danger) 16%, transparent)", color: "var(--danger)", display: "grid", placeItems: "center" }}
                >
                  <Icon name="close" size={13} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title" style={{ fontWeight: 500, fontSize: 14, whiteSpace: "pre-line" }}>{m.question}</div>
                  <div className="row-sub" style={{ color: "var(--success)" }}>Верно: {m.correctAnswer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <button className="btn btn-primary btn-block" onClick={() => nav(`/test/${result.testId}`, { replace: true })}>
          <Icon name="refresh" size={18} /> Пройти заново
        </button>
        {result.wrong.length > 0 && (
          <button className="btn btn-secondary btn-block" onClick={() => nav(`/test/${result.testId}?mode=mistakes`, { replace: true })}>
            Повторить ошибки
          </button>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => toggleFavorite(result.testId)}>
            <Icon name={fav ? "star-fill" : "star"} size={18} />
            {fav ? "В избранном" : "В избранное"}
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => nav("/tasks")}>К заданиям</button>
        </div>
      </div>
    </div>
  );
}
