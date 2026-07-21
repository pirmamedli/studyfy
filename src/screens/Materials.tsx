import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { SubjectTile } from "../lib/subjectIcons";
import {
  MATERIALS,
  SUBJECTS,
  getSubject,
  getTest,
  materialsForSubject,
} from "../data/content";
import type { MaterialSection } from "../data/types";

function materialIcon(section: MaterialSection) {
  if (section === "flashcards") return "cards";
  if (section === "trials") return "calendar";
  if (section === "errorReview") return "refresh";
  return "book";
}

export function Materials() {
  const { state, derived } = useApp();
  const nav = useNavigate();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? MATERIALS.filter(
            (m) =>
              m.title.toLowerCase().includes(q) ||
              (m.subtitle ?? "").toLowerCase().includes(q),
          )
        : MATERIALS,
    [q],
  );

  const favTests = state.favorites
    .map((tid) => getTest(tid))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const subjectsWithMaterials = SUBJECTS.filter(
    (s) => materialsForSubject(s.id).length > 0,
  );

  return (
    <>
      <h1 className="page-title" style={{ margin: "4px 0 16px" }}>
        Материалы
      </h1>

      <div className="search" style={{ marginBottom: 20 }}>
        <Icon name="search" size={18} />
        <input
          placeholder="Поиск по конспектам"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* автоблок слабых тем */}
      {!q && derived.weakTopics.length > 0 && (
        <>
          <div className="eyebrow eyebrow--accent">Мои слабые темы</div>
          <div className="list" style={{ marginBottom: 22 }}>
            {derived.weakTopics.map((w) => (
              <button
                key={`${w.subjectId}:${w.topic}`}
                className="list-row"
                onClick={() =>
                  w.testId ? nav(`/test/${w.testId}?mode=mistakes`) : nav(`/subject/${w.subjectId}`)
                }
              >
                <SubjectTile icon={w.icon} active />
                <div style={{ flex: 1 }}>
                  <div className="row-title">{w.topic}</div>
                  <div className="row-sub">
                    {w.subjectTitle} · ошибок {w.count}
                  </div>
                </div>
                <Icon name="refresh" size={20} className="row-chev" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* избранное */}
      {!q && favTests.length > 0 && (
        <>
          <div className="eyebrow">Избранное</div>
          <div className="list" style={{ marginBottom: 22 }}>
            {favTests.map((t) => (
              <button key={t.id} className="list-row" onClick={() => nav(`/test/${t.id}`)}>
                <span className="row-lead">
                  <Icon name="star-fill" size={20} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className="row-title">{t.title}</div>
                  <div className="row-sub">{getSubject(t.subjectId)?.title}</div>
                </div>
                <Icon name="chevron-right" size={20} className="row-chev" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* по предметам */}
      {!q ? (
        <>
          <div className="eyebrow">По предметам</div>
          <div className="list">
            {subjectsWithMaterials.map((s) => {
              const count = materialsForSubject(s.id).length;
              return (
                <Link key={s.id} to={`/subject/${s.id}`} className="list-row">
                  <SubjectTile icon={s.icon} />
                  <div style={{ flex: 1 }}>
                    <div className="row-title">{s.title}</div>
                    <div className="row-sub">{count} материалов</div>
                  </div>
                  <Icon name="chevron-right" size={20} className="row-chev" />
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <div className="list">
          {filtered.map((m) => (
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
          {filtered.length === 0 && (
            <div className="list-row empty" style={{ justifyContent: "center" }}>
              Ничего не найдено
            </div>
          )}
        </div>
      )}
    </>
  );
}
