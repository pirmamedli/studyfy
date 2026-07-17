import { useState } from "react";
import { useApp } from "../state/AppProvider";

export function Onboarding() {
  const { state, login, updateProfile } = useApp();
  const [name, setName] = useState(state.profile.name);
  const [code, setCode] = useState("BETA-2026");
  const [err, setErr] = useState("");

  function submit() {
    if (code.trim().length < 4) {
      setErr("Проверь код доступа");
      return;
    }
    const cleanName = name.trim() || "Ученик";
    updateProfile({ name: cleanName, nickname: state.profile.nickname || cleanName });
    login();
  }

  return (
    <div className="app">
      <div className="viewport">
        <main
          className="screen screen--flush"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div className="brandmark" style={{ textAlign: "center", padding: "6px 0 0" }}>
            стадифай
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              aria-hidden
              style={{
                width: 104,
                height: 104,
                margin: "0 auto 22px",
                borderRadius: 28,
                background: "var(--accent-tint)",
                display: "grid",
                placeItems: "center",
                fontSize: 52,
              }}
            >
              🦉
            </div>
            <h2
              className="t-display"
              style={{ textAlign: "center", fontSize: 26, margin: "0 0 8px" }}
            >
              С возвращением
            </h2>
            <p
              style={{
                textAlign: "center",
                fontSize: 15,
                color: "var(--muted)",
                margin: "0 0 28px",
              }}
            >
              Продолжим подготовку к ЕГЭ
            </p>

            <label className="field" style={{ marginBottom: 14 }}>
              <span className="field-label">Как тебя зовут</span>
              <input
                className="input"
                placeholder="Мурад"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field-label">Код доступа</span>
              <input
                className={"input" + (err ? " is-error" : "")}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setErr("");
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              {err && <span className="field-hint is-error">{err}</span>}
            </label>

            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 16 }}
              onClick={submit}
            >
              Войти
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }}>
              Оставить заявку
            </button>
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "var(--muted)",
              margin: 0,
            }}
          >
            Нажимая «Войти», ты принимаешь правила сервиса
          </p>
        </main>
      </div>
    </div>
  );
}
