import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CalendarActivity,
  NotificationPreference,
  RetryMode,
  Test,
  TestDraft,
  TestResultData,
  UserProfile,
  UserState,
} from "../data/types";
import {
  LocalStorageRepository,
  canSolve as canSolveR,
  clearDraft as clearDraftR,
  completeTest,
  defaultState,
  login as loginR,
  logout as logoutR,
  saveDraft as saveDraftR,
  setActivityStatus,
  spendLife as spendLifeR,
  toggleFavorite as toggleFavoriteR,
  updateProfile as updateProfileR,
  wipe,
  type StateRepository,
} from "../data/store";
import { computeDerived, type Derived } from "../data/progress";
import { isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl } from "../lib/supabase";
import { deleteRemoteState, loadRemoteState, saveRemoteState } from "../data/remote";

export interface AuthResult {
  error?: string;
  info?: string;
  code?: string;
}

export interface SignUpInput {
  profile: Partial<UserProfile> & Pick<UserProfile, "name" | "grade" | "subjectIds">;
}

interface AppContextValue {
  state: UserState;
  derived: Derived;
  authed: boolean;
  authReady: boolean;
  syncing: boolean;
  supabaseEnabled: boolean;
  userEmail: string | null;
  // auth
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  login: () => void; // локальный режим без Supabase
  logout: () => void;
  // gameplay
  spendLife: () => void;
  canSolve: () => boolean;
  saveDraft: (testId: string, draft: TestDraft) => void;
  clearDraft: (testId: string) => void;
  finishTest: (input: {
    test: Test;
    answers: unknown[];
    questionIndices: number[];
    retryMode: RetryMode;
  }) => TestResultData;
  toggleFavorite: (testId: string) => void;
  isFavorite: (testId: string) => boolean;
  setActivity: (id: string, status: CalendarActivity["status"]) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateNotifications: (patch: Partial<NotificationPreference>) => void;
  setTheme: (theme: UserProfile["theme"]) => void;
  setUnlimitedLives: (on: boolean) => void;
  deleteAccount: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const repo: StateRepository = new LocalStorageRepository();

function applyTheme(theme: UserProfile["theme"]) {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.dataset.theme = resolved;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(() => repo.load() ?? defaultState());
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseEnabled);
  const [hydrated, setHydrated] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const pendingSignUpProfileRef = useRef<Partial<UserProfile> | null>(null);

  // локальный кэш (офлайн)
  useEffect(() => {
    repo.save(state);
  }, [state]);

  // тема
  useEffect(() => {
    applyTheme(state.profile.theme);
    if (state.profile.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [state.profile.theme]);

  // ── Supabase: отслеживание сессии ──
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
      setUserEmail(data.session?.user?.email ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setUserEmail(session?.user?.email ?? null);
      if (!session) setHydrated(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ── Supabase: загрузка/инициализация состояния при входе ──
  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    (async () => {
      const remote = await loadRemoteState(userId);
      if (cancelled) return;
      const pendingProfile = pendingSignUpProfileRef.current;
      const base =
        remote ??
        {
          ...stateRef.current,
          profile: { ...stateRef.current.profile, ...(pendingProfile ?? {}) },
          authed: true,
        };
      const next = loginR({ ...base, authed: true }); // серия/жизни/фокус на день
      setState(next);
      pendingSignUpProfileRef.current = null;
      setHydrated(true);
      await saveRemoteState(userId, next);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ── Supabase: отложенное сохранение изменений ──
  useEffect(() => {
    if (!supabase || !userId || !hydrated) return;
    const id = window.setTimeout(() => {
      saveRemoteState(userId, stateRef.current);
    }, 800);
    return () => window.clearTimeout(id);
  }, [state, userId, hydrated]);

  const derived = useMemo(() => computeDerived(state), [state]);

  // ── auth actions ──
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Supabase не настроен" };
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        "Supabase долго отвечает. Попробуй ещё раз.",
      );
      if (error && isInvalidPathError(error.message)) return directSignIn(email, password);
      return error ? authErrorToResult(error) : {};
    } catch (error) {
      if (isInvalidPathError(error instanceof Error ? error.message : "")) return directSignIn(email, password);
      return humanAuthError(error instanceof Error ? error.message : "Не удалось войти");
    }
  }, []);

  const signUp = useCallback(async ({ profile }: SignUpInput): Promise<AuthResult> => {
    if (!supabase) return { error: "Supabase не настроен" };
    const cleanName = profile.name.trim() || "Ученик";
    const cleanNickname = profile.nickname?.trim() || cleanName;
    const nextProfile: Partial<UserProfile> = {
      ...profile,
      name: cleanName,
      nickname: cleanNickname,
    };
    const metadata = {
      name: cleanName,
      nickname: cleanNickname,
      phone: profile.phone,
      telegram: profile.telegram,
      access_code: profile.accessCode,
      grade: profile.grade,
      subject_ids: profile.subjectIds,
    };
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInAnonymously({
          options: {
            data: metadata,
          },
        }),
        "Supabase долго отвечает. Попробуй ещё раз.",
      );
      if (error && isInvalidPathError(error.message)) {
        const fallback = await directAnonymousSignUp(metadata);
        if (fallback.error) return fallback;
        pendingSignUpProfileRef.current = nextProfile;
        setState((s) => updateProfileR(s, nextProfile));
        return fallback;
      } else if (error) {
        return authErrorToResult(error);
      }
      pendingSignUpProfileRef.current = nextProfile;
      setState((s) => updateProfileR(s, nextProfile));
      if (!data.session) return { error: "Supabase не вернул сессию. Проверь, включены ли Anonymous sign-ins." };
      return { info: "Аккаунт создан. Загружаем профиль..." };
    } catch (error) {
      if (isInvalidPathError(error instanceof Error ? error.message : "")) {
        const fallback = await directAnonymousSignUp(metadata);
        if (fallback.error) return fallback;
        pendingSignUpProfileRef.current = nextProfile;
        setState((s) => updateProfileR(s, nextProfile));
        return fallback;
      }
      return authErrorToResult(error);
    }
  }, []);

  async function directSignIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase || !supabaseUrl || !supabaseAnonKey) return { error: "Supabase не настроен" };
    const data = await authFetch<{ access_token?: string; refresh_token?: string }>(
      "/auth/v1/token?grant_type=password",
      { email: email.trim(), password },
    );
    if (data.error) return data;
    if (!data.access_token || !data.refresh_token) return { error: "Supabase не вернул сессию. Попробуй ещё раз." };
    const { error } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    return error ? authErrorToResult(error) : {};
  }

  async function directAnonymousSignUp(data: Record<string, unknown>): Promise<AuthResult> {
    if (!supabaseUrl || !supabaseAnonKey) return { error: "Supabase не настроен" };
    const result = await authFetch<{ access_token?: string; refresh_token?: string; session?: { access_token?: string; refresh_token?: string } }>(
      "/auth/v1/signup",
      {
        data,
      },
    );
    if (result.error) return result;
    const accessToken = result.access_token ?? result.session?.access_token;
    const refreshToken = result.refresh_token ?? result.session?.refresh_token;
    if (supabase && accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      return { info: "Аккаунт создан. Загружаем профиль..." };
    }
    return { error: "Supabase не вернул сессию. Проверь, включены ли Anonymous sign-ins." };
  }

  async function authFetch<T>(path: string, body: Record<string, unknown>): Promise<T & AuthResult> {
    if (!supabaseUrl || !supabaseAnonKey) return { error: "Supabase не настроен" } as T & AuthResult;
    const response = await withTimeout(
      fetch(`${supabaseUrl}${path}`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }),
      "Supabase долго отвечает. Попробуй ещё раз.",
    );
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok) {
      return authErrorToResult(payload) as T & AuthResult;
    }
    return payload as T & AuthResult;
  }

  async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
    let timer = 0;
    const timeout = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(message)), 12_000);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      window.clearTimeout(timer);
    }
  }

  const login = useCallback(() => setState((s) => loginR(s)), []); // локальный режим
  const logout = useCallback(() => {
    if (supabase) {
      supabase.auth.signOut();
      setHydrated(false);
    } else {
      setState((s) => logoutR(s));
    }
  }, []);

  // ── gameplay actions ──
  const spendLife = useCallback(() => setState((s) => spendLifeR(s)), []);
  const canSolve = useCallback(() => canSolveR(stateRef.current), []);
  const saveDraft = useCallback(
    (testId: string, draft: TestDraft) => setState((s) => saveDraftR(s, testId, draft)),
    [],
  );
  const clearDraft = useCallback((testId: string) => setState((s) => clearDraftR(s, testId)), []);
  const finishTest = useCallback(
    (input: { test: Test; answers: unknown[]; questionIndices: number[]; retryMode: RetryMode }) => {
      const { state: next, result } = completeTest(stateRef.current, input);
      setState(next);
      return result;
    },
    [],
  );
  const toggleFavorite = useCallback((testId: string) => setState((s) => toggleFavoriteR(s, testId)), []);
  const isFavorite = useCallback((testId: string) => stateRef.current.favorites.includes(testId), []);
  const setActivity = useCallback(
    (id: string, status: CalendarActivity["status"]) => setState((s) => setActivityStatus(s, id, status)),
    [],
  );
  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => setState((s) => updateProfileR(s, patch)),
    [],
  );
  const updateNotifications = useCallback(
    (patch: Partial<NotificationPreference>) =>
      setState((s) => updateProfileR(s, { notifications: { ...s.profile.notifications, ...patch } })),
    [],
  );
  const setTheme = useCallback(
    (theme: UserProfile["theme"]) => setState((s) => updateProfileR(s, { theme })),
    [],
  );
  const setUnlimitedLives = useCallback((on: boolean) => setState((s) => ({ ...s, unlimitedLives: on })), []);
  const deleteAccount = useCallback(() => {
    if (supabase && userId) {
      deleteRemoteState(userId);
      supabase.auth.signOut();
      setHydrated(false);
    }
    repo.clear();
    setState(wipe());
  }, [userId]);

  const authed = isSupabaseEnabled ? Boolean(userId) && hydrated : state.authed;
  const syncing = isSupabaseEnabled && Boolean(userId) && !hydrated;

  const value: AppContextValue = {
    state,
    derived,
    authed,
    authReady,
    syncing,
    supabaseEnabled: isSupabaseEnabled,
    userEmail,
    signIn,
    signUp,
    login,
    logout,
    spendLife,
    canSolve,
    saveDraft,
    clearDraft,
    finishTest,
    toggleFavorite,
    isFavorite,
    setActivity,
    updateProfile,
    updateNotifications,
    setTheme,
    setUnlimitedLives,
    deleteAccount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function authErrorToResult(error: unknown): AuthResult {
  if (typeof error === "string") return humanAuthError(error);
  if (error && typeof error === "object") {
    const payload = error as {
      code?: string | number;
      error_code?: string;
      error?: string;
      message?: string;
      msg?: string;
      error_description?: string;
      status?: number;
    };
    const code = String(payload.error_code ?? payload.code ?? payload.error ?? "").trim();
    const message = String(
      payload.msg ??
        payload.message ??
        payload.error_description ??
        payload.error ??
        "Не удалось выполнить запрос",
    );
    return humanAuthError(message, code || undefined, payload.status);
  }
  return humanAuthError(error instanceof Error ? error.message : "Не удалось выполнить запрос");
}

function humanAuthError(message: string, code?: string, status?: number): AuthResult {
  const m = message.toLowerCase();
  const c = (code ?? "").toLowerCase();
  if (m.includes("invalid login")) return { error: "Неверный email или пароль", code };
  if (c === "email_not_confirmed" || m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
    return { error: "Почта ещё не подтверждена. Проверь письмо от Supabase и затем войди.", code };
  }
  if (c === "email_address_invalid" || m.includes("email address") && m.includes("invalid")) {
    return {
      error: "Supabase отклонил этот email как недействительный. Используй реальный существующий адрес или отключи Email address validation в Supabase Auth.",
      code: code ?? "email_address_invalid",
    };
  }
  if (c.includes("over_email_send_rate_limit") || m.includes("rate limit")) {
    return { error: "Supabase временно ограничил отправку писем. Подожди пару минут или настрой SMTP.", code };
  }
  if (c.includes("email_provider_disabled") || m.includes("email provider")) {
    return { error: "Email-регистрация выключена в Supabase. Включи Email provider в Authentication.", code };
  }
  if (c.includes("anonymous") || m.includes("anonymous")) {
    return { error: "Anonymous sign-ins выключены в Supabase. Включи их в Authentication, чтобы регистрироваться без email.", code };
  }
  if (m.includes("invalid path")) return { error: "Supabase вернул некорректный Auth URL. Попробуй ещё раз.", code };
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already registered")) {
    return { error: "Такой email уже зарегистрирован. Попробуй войти.", code };
  }
  if (m.includes("signup") && m.includes("disabled")) return { error: "Регистрация временно отключена в Supabase", code };
  if (m.includes("password")) return { error: "Пароль должен быть не короче 6 символов", code };
  if (m.includes("email")) return { error: `Supabase отклонил email: ${message}${code ? ` (${code})` : ""}`, code };
  return { error: `${message}${code ? ` (${code})` : ""}${status ? ` [${status}]` : ""}`, code };
}

function isInvalidPathError(message: string): boolean {
  return message.toLowerCase().includes("invalid path");
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
