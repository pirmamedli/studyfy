import { useApp } from "../state/AppProvider";
import { Ring } from "../components/Ring";
import { Icon } from "../lib/icons";
import { SubjectTile } from "../lib/subjectIcons";
import { RANKS } from "../data/ranks";

export function Progress() {
  const { derived } = useApp();
  const { rank } = derived;

  return (
    <>
      <h1 className="page-title" style={{ margin: "4px 0 18px" }}>
        Прогресс
      </h1>

      {/* общий прогресс */}
      <div
        className="hero"
        style={{ padding: 22, display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}
      >
        <Ring
          value={derived.overallPercent}
          size={88}
          stroke={8}
          fontSize={22}
          track="rgba(244,238,231,.16)"
          centerColor="var(--on-card)"
        />
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: "var(--accent)", letterSpacing: ".14em", marginBottom: 6 }}>
            Общий прогресс
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--on-card)", marginBottom: 4 }}>
            {rank.current.title} · {derived.totalXp} XP
          </div>
          <div style={{ fontSize: 13, color: "var(--on-card-mut)" }}>
            {rank.next ? `до «${rank.next.title}» ${rank.xpToNext} XP` : "максимальное звание"}
          </div>
        </div>
      </div>

      {/* статы */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div className="stat-card">
          <div className="big">{derived.streak}</div>
          <div className="cap">дней серия</div>
        </div>
        <div className="stat-card">
          <div className="big">{derived.tasksDone}</div>
          <div className="cap">решено заданий</div>
        </div>
        <div className="stat-card">
          <div className="big">{derived.accuracy}%</div>
          <div className="cap">точность ответов</div>
        </div>
        <div className="stat-card">
          <div className="big">{derived.testsDone}</div>
          <div className="cap">пройдено тестов</div>
        </div>
      </div>

      {/* верно / неверно */}
      <div className="card card-pad" style={{ marginBottom: 22, display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--success)" }} />
            <span className="row-sub">Правильные</span>
          </div>
          <div className="t-num" style={{ fontSize: 22, color: "var(--ink)", marginTop: 4 }}>
            {derived.correctTotal}
          </div>
        </div>
        <div style={{ width: 1, background: "var(--line)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "var(--danger)" }} />
            <span className="row-sub">Ошибки</span>
          </div>
          <div className="t-num" style={{ fontSize: 22, color: "var(--ink)", marginTop: 4 }}>
            {derived.incorrectTotal}
          </div>
        </div>
      </div>

      {/* прогресс по предметам */}
      <div className="eyebrow">По предметам</div>
      <div className="list" style={{ marginBottom: 22 }}>
        {derived.subjects.map((s) => (
          <div key={s.subjectId} className="list-row">
            <SubjectTile icon={s.icon} active={s.percent >= 100} />
            <div style={{ flex: 1 }}>
              <div className="row-title" style={{ marginBottom: 6 }}>
                {s.title}
              </div>
              <div className="bar">
                <span style={{ width: `${s.percent}%` }} />
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
              {s.percent}%
            </span>
          </div>
        ))}
      </div>

      {/* лестница званий */}
      <div className="eyebrow">Звания</div>
      <div className="list" style={{ marginBottom: 22 }}>
        {RANKS.map((r) => {
          const reached = derived.totalXp >= r.minXp;
          const current = r.id === rank.current.id;
          return (
            <div key={r.id} className="list-row">
              <span
                className={"check-circle" + (reached ? " check-circle--done" : "")}
                style={current ? { outline: "3px solid var(--accent-tint)" } : undefined}
              >
                {reached && <Icon name="check" size={14} />}
              </span>
              <div style={{ flex: 1 }}>
                <div className="row-title" style={current ? { color: "var(--accent-ink)" } : undefined}>
                  {r.title}
                </div>
                <div className="row-sub">от {r.minXp} XP</div>
              </div>
              {current && <span className="badge badge-xp">сейчас</span>}
            </div>
          );
        })}
      </div>

      {/* рейтинг — будущая функция */}
      <div className="eyebrow">Рейтинг класса</div>
      <div className="card card-pad empty" style={{ padding: "28px 20px" }}>
        <Icon name="trophy" size={28} />
        <div style={{ marginTop: 8, fontWeight: 600, color: "var(--ink-2)" }}>Скоро</div>
        <div style={{ fontSize: 13 }}>Соревнование с одноклассниками появится в следующем обновлении</div>
      </div>
    </>
  );
}
