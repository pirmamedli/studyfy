import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { SUBJECTS } from "../data/content";
import { initials, shortName } from "../lib/format";
import type { NotificationPreference } from "../data/types";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className="toggle"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
    />
  );
}

const NOTIF_LABELS: { key: keyof NotificationPreference; label: string }[] = [
  { key: "dailyReminder", label: "Ежедневное напоминание" },
  { key: "unfinishedTest", label: "Незавершённый тест" },
  { key: "newTestInSubject", label: "Новый тест по предмету" },
  { key: "streakWarning", label: "Риск потерять серию" },
  { key: "newTrialExam", label: "Новый пробный экзамен" },
];

export function Profile() {
  const {
    state,
    derived,
    logout,
    deleteAccount,
    updateProfile,
    updateNotifications,
    setTheme,
  } = useApp();
  const nav = useNavigate();
  const p = state.profile;
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDark = document.documentElement.dataset.theme === "dark";

  return (
    <>
      {/* шапка профиля */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <span className="avatar avatar--accent" style={{ width: 60, height: 60, fontSize: 24 }}>
          {initials(p.name || "У")}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: "var(--ink)" }}>
            {shortName(p.name || "Ученик")}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {derived.rank.current.title} · {p.grade} класс · {derived.totalXp} XP
          </div>
        </div>
        <button
          className="icon-btn"
          onClick={() => setEditOpen((v) => !v)}
          aria-label="Редактировать"
        >
          <Icon name={editOpen ? "close" : "plus"} size={20} />
        </button>
      </div>

      {/* редактирование профиля */}
      {editOpen && (
        <div className="card card-pad" style={{ marginBottom: 18, display: "grid", gap: 14 }}>
          <label className="field">
            <span className="field-label">Имя</span>
            <input
              className="input"
              value={p.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Никнейм</span>
            <input
              className="input"
              value={p.nickname}
              onChange={(e) => updateProfile({ nickname: e.target.value })}
            />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label className="field" style={{ flex: 1 }}>
              <span className="field-label">Класс</span>
              <input
                className="input"
                type="number"
                min={5}
                max={11}
                value={p.grade}
                onChange={(e) => updateProfile({ grade: Number(e.target.value) || 11 })}
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span className="field-label">Цель XP / день</span>
              <input
                className="input"
                type="number"
                min={10}
                step={5}
                value={p.dailyGoalXp}
                onChange={(e) => updateProfile({ dailyGoalXp: Number(e.target.value) || 45 })}
              />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Дата ЕГЭ</span>
            <input
              className="input"
              type="date"
              value={p.examDate}
              onChange={(e) => updateProfile({ examDate: e.target.value })}
            />
          </label>
        </div>
      )}

      {/* предметы */}
      <div className="eyebrow">Мои предметы</div>
      <div className="chip-scroller" style={{ flexWrap: "wrap", overflow: "visible" }}>
        {SUBJECTS.map((s) => {
          const on = p.subjectIds.includes(s.id);
          return (
            <button
              key={s.id}
              className={"chip" + (on ? " is-active" : "")}
              aria-pressed={on}
              onClick={() =>
                updateProfile({
                  subjectIds: on
                    ? p.subjectIds.filter((x) => x !== s.id)
                    : [...p.subjectIds, s.id],
                })
              }
            >
              {s.title}
            </button>
          );
        })}
      </div>

      {/* настройки */}
      <div className="eyebrow" style={{ marginTop: 8 }}>Настройки</div>
      <div className="list" style={{ marginBottom: 18 }}>
        <div className="list-row">
          <Icon name="moon" size={20} style={{ color: "var(--ink-2)" }} />
          <span className="row-title" style={{ flex: 1 }}>Тёмная тема</span>
          <Toggle on={isDark} onToggle={() => setTheme(isDark ? "light" : "dark")} />
        </div>
        <div className="list-row">
          <Icon name="target" size={20} style={{ color: "var(--ink-2)" }} />
          <span className="row-title" style={{ flex: 1 }}>Цель на день</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>
            {p.dailyGoalXp} XP · выполнено {derived.goalPercent}%
          </span>
        </div>
      </div>

      {/* уведомления */}
      <div className="eyebrow">Уведомления</div>
      <div className="list" style={{ marginBottom: 18 }}>
        {NOTIF_LABELS.map(({ key, label }) => (
          <div key={key} className="list-row">
            <Icon name="bell" size={20} style={{ color: "var(--ink-2)" }} />
            <span className="row-title" style={{ flex: 1 }}>{label}</span>
            <Toggle
              on={p.notifications[key]}
              onToggle={() => updateNotifications({ [key]: !p.notifications[key] })}
            />
          </div>
        ))}
      </div>

      {/* аккаунт */}
      <div className="eyebrow">Аккаунт</div>
      <div className="list" style={{ marginBottom: 18 }}>
        <button className="list-row" onClick={() => nav("/calendar")}>
          <span className="row-title" style={{ flex: 1 }}>Календарь подготовки</span>
          <Icon name="chevron-right" size={20} className="row-chev" />
        </button>
        <button className="list-row" onClick={() => nav("/mistakes")}>
          <span className="row-title" style={{ flex: 1 }}>Дневник ошибок</span>
          <Icon name="chevron-right" size={20} className="row-chev" />
        </button>
        <button className="list-row" onClick={logout}>
          <span className="row-title" style={{ flex: 1, color: "var(--danger)" }}>
            Выйти
          </span>
        </button>
      </div>

      {/* удаление */}
      {!confirmDelete ? (
        <button
          className="btn btn-danger btn-block"
          onClick={() => setConfirmDelete(true)}
        >
          <Icon name="trash" size={18} /> Удалить аккаунт
        </button>
      ) : (
        <div className="card card-pad" style={{ border: "1px solid var(--danger)" }}>
          <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
            Удалить аккаунт и весь прогресс?
          </div>
          <div className="row-sub" style={{ marginBottom: 14 }}>
            Это действие необратимо: XP, попытки, ошибки и настройки будут стёрты.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>
              Отмена
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => {
                deleteAccount();
                nav("/");
              }}
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </>
  );
}
