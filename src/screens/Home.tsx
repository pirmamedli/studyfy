import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Ring } from "../components/Ring";
import { Icon } from "../lib/icons";
import { SubjectTile } from "../lib/subjectIcons";
import { getSubject } from "../data/content";
import { initials } from "../lib/format";
import { kindLabel } from "../lib/labels";
import { pluralDays } from "../lib/date";

export function Home() {
  const { state, derived } = useApp();
  const nav = useNavigate();
  const firstName = state.profile.name.split(" ")[0] || "Ученик";
  const goalsToday = derived.todayPlan.length;
  const planXpLeft = derived.todayPlan
    .filter((p) => !p.done)
    .reduce((a, p) => a + p.xp, 0);

  return (
    <>
      <div className="page-head" style={{ marginBottom: 20 }}>
        <span className="brandmark">стадифай</span>
        <Link to="/profile" className="avatar" aria-label="Профиль">
          {initials(state.profile.name || "У")}
        </Link>
      </div>

      <h1 className="t-display" style={{ fontSize: 27, margin: "0 0 6px" }}>
        Привет, <span style={{ color: "var(--accent)" }}>{firstName}</span>
      </h1>
      <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 20px" }}>
        До ЕГЭ {derived.daysToExam} {pluralDays(derived.daysToExam)} · сегодня{" "}
        {goalsToday} {goalsToday === 1 ? "цель" : goalsToday < 5 ? "цели" : "целей"}
      </p>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat-cell">
          <div className="stat-key">Звание</div>
          <div className="stat-val">{derived.rank.current.title}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-key">Класс</div>
          <div className="stat-val">{state.profile.grade}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-key">Серия</div>
          <div className="stat-val stat-val--num">{derived.streak}</div>
        </div>
      </div>

      <Link
        to="/materials"
        className="search"
        style={{ marginBottom: 22, textDecoration: "none" }}
      >
        <Icon name="search" size={18} />
        <span style={{ fontSize: 14 }}>Найти тест или материал</span>
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div>
          <div className="eyebrow eyebrow--accent" style={{ marginBottom: 2 }}>
            Фокус на сегодня
          </div>
          <h2 className="t-h2" style={{ fontSize: 18, margin: 0 }}>
            Сегодняшний план
          </h2>
        </div>
        {planXpLeft > 0 && <span className="badge badge-xp">+{planXpLeft} XP</span>}
      </div>

      {derived.todayPlan.length > 0 ? (
        <div className="list" style={{ marginBottom: 16 }}>
          {derived.todayPlan.map((item) => {
            const subj = getSubject(item.subjectId);
            return (
              <button
                key={item.id}
                className="list-row"
                onClick={() =>
                  item.testId ? nav(`/test/${item.testId}`) : undefined
                }
              >
                <SubjectTile icon={subj?.icon ?? "basic-math"} active={item.done} />
                <div style={{ flex: 1 }}>
                  <div className={"row-title" + (item.done ? " row-title--done" : "")}>
                    {subj?.title ?? item.title}
                  </div>
                  <div className="row-sub">
                    {kindLabel(item.kind)} · {item.xp} XP
                  </div>
                </div>
                <span
                  className={"check-circle" + (item.done ? " check-circle--done" : "")}
                >
                  {item.done && <Icon name="check" size={14} />}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card card-pad empty" style={{ marginBottom: 16 }}>
          На сегодня всё выполнено 🎉
        </div>
      )}

      <div
        className="hero"
        style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}
      >
        <div style={{ flex: 1 }}>
          <div
            className="eyebrow"
            style={{ color: "var(--accent)", letterSpacing: ".14em", marginBottom: 7 }}
          >
            Ближайшая цель
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "var(--on-card)", marginBottom: 5 }}>
            {derived.rank.next
              ? `До звания «${derived.rank.next.title}»`
              : "Максимальное звание достигнуто"}
          </div>
          <div style={{ fontSize: 12, color: "var(--on-card-mut)" }}>
            {derived.rank.next ? (
              <>
                осталось{" "}
                <b style={{ color: "var(--on-card)" }}>{derived.rank.xpToNext} XP</b>
              </>
            ) : (
              <>всего {derived.totalXp} XP</>
            )}
          </div>
        </div>
        <Ring
          value={derived.rank.percentToNext}
          size={66}
          track="rgba(244,238,231,.16)"
          centerColor="var(--on-card)"
        />
      </div>
    </>
  );
}
