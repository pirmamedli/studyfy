import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/AppProvider";
import { Icon } from "../lib/icons";
import { getMaterial, getSubject, testsForTopic } from "../data/content";

function Flashcards({ cards }: { cards: { front: string; back: string }[] }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {cards.map((c, i) => {
        const isBack = flipped[i];
        return (
          <button
            key={i}
            className="card card-pad"
            style={{ textAlign: "center", minHeight: 88, display: "grid", placeItems: "center", cursor: "pointer" }}
            onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
          >
            <div>
              <div className={isBack ? "t-body" : "t-display"} style={{ fontSize: isBack ? 16 : 28, color: "var(--ink)" }}>
                {isBack ? c.back : c.front}
              </div>
              <div className="row-sub" style={{ marginTop: 8 }}>
                {isBack ? "нажми, чтобы вернуть" : "нажми, чтобы перевернуть"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const SECTION_LABEL: Record<string, string> = {
  notes: "Конспект",
  flashcards: "Карточки",
  trials: "Пробник",
};

export function MaterialDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  useApp(); // держим экран в дереве провайдера
  const m = getMaterial(id);

  if (!m) {
    return <div className="empty" style={{ paddingTop: 80 }}>Материал не найден</div>;
  }

  const subject = getSubject(m.subjectId);
  const relatedTest = m.topicId ? testsForTopic(m.topicId)[0] : undefined;

  return (
    <>
      <div className="page-head">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Назад">
          <Icon name="chevron-left" size={20} />
        </button>
        <h1 className="page-title" style={{ flex: 1, fontSize: 20 }}>Материал</h1>
      </div>

      <div className="eyebrow eyebrow--accent">
        {subject?.title} · {SECTION_LABEL[m.section] ?? "Материал"}
        {m.minutes ? ` · ${m.minutes} мин` : ""}
      </div>
      <h2 className="t-h1" style={{ fontSize: 24, margin: "0 0 8px" }}>{m.title}</h2>
      {m.description && (
        <p style={{ color: "var(--muted)", fontSize: 15, margin: "0 0 20px" }}>{m.description}</p>
      )}

      {m.section === "flashcards" && m.cards && m.cards.length > 0 && (
        <Flashcards cards={m.cards} />
      )}

      {(m.section !== "flashcards" || !m.cards) && (
      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(m.blocks ?? []).map((block, i) => {
          if (block.type === "heading")
            return <h3 key={i} className="t-h3" style={{ margin: 0 }}>{block.text}</h3>;
          if (block.type === "paragraph")
            return <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "var(--ink-2)" }}>{block.text}</p>;
          if (block.type === "list")
            return (
              <ul key={i} style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {block.items.map((it, j) => (
                  <li key={j} style={{ fontSize: 16, color: "var(--ink-2)" }}>{it}</li>
                ))}
              </ul>
            );
          if (block.type === "quote")
            return (
              <div key={i} className="card-inset" style={{ padding: 14, borderLeft: "3px solid var(--accent)", fontSize: 15, color: "var(--ink-2)" }}>
                {block.text}
              </div>
            );
          return null;
        })}
        {(!m.blocks || m.blocks.length === 0) && (
          <p style={{ color: "var(--muted)", margin: 0 }}>Содержимое появится позже.</p>
        )}
      </div>
      )}

      {relatedTest && (
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
          onClick={() => nav(`/test/${relatedTest.id}`)}
        >
          Пройти тест по теме
        </button>
      )}
    </>
  );
}
