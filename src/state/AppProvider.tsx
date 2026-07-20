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
import { isSupabaseEnabled, supabase } from "../lib/supabase";
import { deleteRemoteState, loadRemoteState, saveRemoteState } from "../data/remote";

export interface AuthResult {
  error?: string;
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
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
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
      const base = remote ?? { ...stateRef.current, authed: true };
      const next = loginR({ ...base, authed: true }); // серия/жизни/фокус на день
      setState(next);
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
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { error: humanAuthError(error.message) } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Supabase не настроен" };
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return { error: humanAuthError(error.message) };
    // сохранить имя в состоянии; если подтверждение email включено — сессии ещё нет
    const cleanName = name.trim() || "Ученик";
    setState((s) => updateProfileR(s, { name: cleanName, nickname: s.profile.nickname || cleanName }));
    if (!data.session) return { error: "Проверь почту и подтверди адрес, затем войди." };
    return {};
  }, []);

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

function humanAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Неверный email или пароль";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Такой email уже зарегистрирован";
  if (m.includes("password")) return "Пароль должен быть не короче 6 символов";
  if (m.includes("email")) return "Проверь адрес электронной почты";
  return message;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
