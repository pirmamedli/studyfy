import { useState } from "react";
import { useApp } from "../state/AppProvider";
import { SUBJECTS } from "../data/content";
import { examDateForGrade } from "../data/store";

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [grade, setGrade] = useState(11);
  const [subjectIds, setSubjectIds] = useState(["russian", "basic-math", "history"]);
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setStep(1);
    setErr("");
    setInfo("");
  }

  function validateAccount() {
    if (!email.includes("@")) return "Введи корректный email";
    if (isSignup && phone.trim().length < 5) return "Введи номер телефона";
    if (isSignup && !telegram.trim()) return "Введи Telegram";
    if (isSignup && accessCode.trim().length < 4) return "Введи код доступа";
    if (password.length < 6) return "Пароль не короче 6 символов";
    if (isSignup && password !== passwordRepeat) return "Пароли не совпадают";
    return "";
  }

  function nextStep() {
    setErr("");
    setInfo("");
    if (step === 1) {
      if (!name.trim()) return setErr("Введи имя");
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      if (subjectIds.length === 0) return setErr("Выбери хотя бы один предмет");
      setStep(4);
    }
  }

  async function submit() {
    setErr("");
    setInfo("");
    const accountError = validateAccount();
    if (accountError) return setErr(accountError);
    if (isSignup && !name.trim()) return setErr("Введи имя");
    if (isSignup && subjectIds.length === 0) return setErr("Выбери хотя бы один предмет");
    setBusy(true);
    const res = isSignup
      ? await signUp({
          email,
          password,
          profile: {
            name,
            nickname: nickname || name,
            phone,
            telegram,
            accessCode: accessCode.trim().toUpperCase(),
            grade,
            subjectIds,
            examDate: examDateForGrade(grade),
          },
        })
      : await signIn(email, password);
    setBusy(false);
    if (res.error) setErr(res.error);
    if (res.info) setInfo(res.info);
  }

  function toggleSubject(id: string) {
    setErr("");
    setSubjectIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  return (
    <>
      <h2 className="t-display" style={{ textAlign: "center", fontSize: 26, margin: "0 0 8px" }}>
        {isSignup ? "Создать аккаунт" : "С возвращением"}
      </h2>
      <p style={{ textAlign: "center", fontSize: 15, color: "var(--muted)", margin: "0 0 24px" }}>
        {isSignup ? `Шаг ${step} из 4 · профиль и доступ` : "Подготовка к ЕГЭ · прогресс синхронизируется"}
      </p>

      {isSignup && (
        <div className="progress-track" style={{ marginBottom: 18 }}>
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      )}

      {!isSignup && (
        <>
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

          <label className="field" style={{ marginBottom: isSignup ? 14 : 0 }}>
            <span className="field-label">Пароль</span>
            <input
              className={"input" + (err ? " is-error" : "")}
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="Не короче 6 символов"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && (isSignup ? nextStep() : submit())}
            />
          </label>
        </>
      )}

      {isSignup && step === 1 && (
        <>
          <label className="field" style={{ marginBottom: 14 }}>
            <span className="field-label">Как тебя зовут</span>
            <input className="input" placeholder="Мурад" value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} />
          </label>
          <label className="field">
            <span className="field-label">Никнейм</span>
            <input className="input" placeholder="Можно оставить пустым" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </label>
        </>
      )}

      {isSignup && step === 2 && (
        <>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Класс</div>
          <div className="chip-scroller" style={{ flexWrap: "wrap", overflow: "visible", marginBottom: 6 }}>
            {[10, 11].map((value) => {
              const on = grade === value;
              return (
                <button
                  key={value}
                  className={"chip" + (on ? " is-active" : "")}
                  aria-pressed={on}
                  onClick={() => setGrade(value)}
                >
                  {value} класс
                </button>
              );
            })}
          </div>
          <p className="row-sub" style={{ margin: "6px 0 0" }}>
            Дату ЕГЭ подставим автоматически для обратного отсчёта.
          </p>
        </>
      )}

      {isSignup && step === 3 && (
        <>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Предметы ЕГЭ</div>
          <div className="chip-scroller" style={{ flexWrap: "wrap", overflow: "visible", marginBottom: 6 }}>
            {SUBJECTS.map((subject) => {
              const on = subjectIds.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  className={"chip" + (on ? " is-active" : "")}
                  aria-pressed={on}
                  onClick={() => toggleSubject(subject.id)}
                >
                  {subject.title}
                </button>
              );
            })}
          </div>
          <p className="row-sub" style={{ margin: "6px 0 0" }}>
            По этим предметам соберём план на сегодня и следующие тесты.
          </p>
        </>
      )}

      {isSignup && step === 4 && (
        <>
          <label className="field" style={{ marginBottom: 12 }}>
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
          <label className="field" style={{ marginBottom: 12 }}>
            <span className="field-label">Телефон</span>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 (999) 000-00-00"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErr(""); }}
            />
          </label>
          <label className="field" style={{ marginBottom: 12 }}>
            <span className="field-label">Telegram</span>
            <input
              className="input"
              autoComplete="off"
              placeholder="@username"
              value={telegram}
              onChange={(e) => { setTelegram(e.target.value); setErr(""); }}
            />
          </label>
          <label className="field" style={{ marginBottom: 12 }}>
            <span className="field-label">Код доступа</span>
            <input
              className="input"
              autoComplete="off"
              placeholder="например, BETA01"
              value={accessCode}
              onChange={(e) => { setAccessCode(e.target.value.toUpperCase()); setErr(""); }}
              style={{ textTransform: "uppercase", letterSpacing: ".06em" }}
            />
          </label>
          <label className="field" style={{ marginBottom: 14 }}>
            <span className="field-label">Пароль</span>
            <input
              className={"input" + (err ? " is-error" : "")}
              type="password"
              autoComplete="new-password"
              placeholder="Не короче 6 символов"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </label>
          <label className="field">
            <span className="field-label">Повтори пароль</span>
            <input
              className={"input" + (err ? " is-error" : "")}
              type="password"
              autoComplete="new-password"
              placeholder="Ещё раз пароль"
              value={passwordRepeat}
              onChange={(e) => { setPasswordRepeat(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </label>
        </>
      )}

      {err && <div className="field-hint is-error" style={{ marginTop: 10 }}>{err}</div>}
      {info && <div className="field-hint" style={{ color: "var(--success)", marginTop: 10 }}>{info}</div>}

      <button
        className={"btn btn-primary btn-block" + (busy ? " is-loading" : "")}
        style={{ marginTop: 16 }}
        onClick={isSignup && step < 4 ? nextStep : submit}
        disabled={busy}
      >
        {isSignup ? (step < 4 ? "Продолжить" : "Зарегистрироваться") : "Войти"}
      </button>
      {isSignup && step > 1 && (
        <button className="btn btn-secondary btn-block" style={{ marginTop: 10 }} onClick={() => setStep((s) => (s === 4 ? 3 : s === 3 ? 2 : 1))}>
          Назад
        </button>
      )}
      <button
        className="btn btn-ghost btn-block"
        style={{ marginTop: 10 }}
        onClick={() => switchMode(isSignup ? "signin" : "signup")}
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
