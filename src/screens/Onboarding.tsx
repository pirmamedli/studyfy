import { useState } from "react";
import { useApp } from "../state/AppProvider";

export function Onboarding() {
  const { supabaseEnabled } = useApp();
  return (
    <div className="app">
      <div className="viewport">
        <main className="screen screen--flush" style={{ display: "flex", flexDirection: "column" }}>
          <div className="brandmark" style={{ textAlign: "center", padding: "6px 0 0" }}>стадифай</div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div
              aria-hidden
              style={{ width: 104, height: 104, margin: "0 auto 22px", borderRadius: 28, background: "var(--accent-tint)", display: "grid", placeItems: "center", fontSize: 52 }}
            >
              🦉
            </div>
            {supabaseEnabled ? <SupabaseAuth /> : <LocalAuth />}
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", margin: 0 }}>
            Продолжая, ты принимаешь правила сервиса
          </p>
        </main>
      </div>
    </div>
  );
}

// ─── вход через Supabase (email + пароль) ─────────────────────────────────────

function SupabaseAuth() {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function submit() {
    setErr("");
    setInfo("");
    if (!email.includes("@")) return setErr("Введи корректный email");
    if (password.length < 6) return setErr("Пароль не короче 6 символов");
    setBusy(true);
    const res = isSignup ? await signUp(email, password, name) : await signIn(email, password);
    setBusy(false);
    if (res.error) {
      // сообщение о подтверждении почты — не ошибка входа
      if (res.error.startsWith("Проверь почту")) setInfo(res.error);
      else setErr(res.error);
    }
  }

  return (
    <>
      <h2 className="t-display" style={{ textAlign: "center", fontSize: 26, margin: "0 0 8px" }}>
        {isSignup ? "Создать аккаунт" : "С возвращением"}
      </h2>
      <p style={{ textAlign: "center", fontSize: 15, color: "var(--muted)", margin: "0 0 24px" }}>
        Подготовка к ЕГЭ · прогресс синхронизируется
      </p>

      {isSignup && (
        <label className="field" style={{ marginBottom: 14 }}>
          <span className="field-label">Как тебя зовут</span>
          <input className="input" placeholder="Мурад" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      )}

      <label className="field" style={{ marginBottom: 14 }}>
        <span className="field-label">Email</span>
        <input
          className="input"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(""); }}
        />
      </label>

      <label className="field">
        <span className="field-label">Пароль</span>
        <input
          className={"input" + (err ? " is-error" : "")}
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="Не короче 6 символов"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {err && <span className="field-hint is-error">{err}</span>}
        {info && <span className="field-hint" style={{ color: "var(--success)" }}>{info}</span>}
      </label>

      <button className={"btn btn-primary btn-block" + (busy ? " is-loading" : "")} style={{ marginTop: 16 }} onClick={submit} disabled={busy}>
        {isSignup ? "Зарегистрироваться" : "Войти"}
      </button>
      <button
        className="btn btn-ghost btn-block"
        style={{ marginTop: 10 }}
        onClick={() => { setMode(isSignup ? "signin" : "signup"); setErr(""); setInfo(""); }}
      >
        {isSignup ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
      </button>
    </>
  );
}

// ─── локальный режим без Supabase (код доступа) ───────────────────────────────

function LocalAuth() {
  const { state, login, updateProfile } = useApp();
  const [name, setName] = useState(state.profile.name);
  const [code, setCode] = useState("BETA-2026");
  const [err, setErr] = useState("");

  function submit() {
    if (code.trim().length < 4) return setErr("Проверь код доступа");
    const cleanName = name.trim() || "Ученик";
    updateProfile({ name: cleanName, nickname: state.profile.nickname || cleanName });
    login();
  }

  return (
    <>
      <h2 className="t-display" style={{ textAlign: "center", fontSize: 26, margin: "0 0 8px" }}>С возвращением</h2>
      <p style={{ textAlign: "center", fontSize: 15, color: "var(--muted)", margin: "0 0 28px" }}>Продолжим подготовку к ЕГЭ</p>

      <label className="field" style={{ marginBottom: 14 }}>
        <span className="field-label">Как тебя зовут</span>
        <input className="input" placeholder="Мурад" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="field">
        <span className="field-label">Код доступа</span>
        <input
          className={"input" + (err ? " is-error" : "")}
          value={code}
          onChange={(e) => { setCode(e.target.value); setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {err && <span className="field-hint is-error">{err}</span>}
      </label>

      <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={submit}>Войти</button>
    </>
  );
}
