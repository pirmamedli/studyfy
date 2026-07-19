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

interface AppContextValue {
  state: UserState;
  derived: Derived;
  login: () => void;
  logout: () => void;
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
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    repo.save(state);
  }, [state]);

  useEffect(() => {
    applyTheme(state.profile.theme);
    if (state.profile.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [state.profile.theme]);

  const derived = useMemo(() => computeDerived(state), [state]);

  const login = useCallback(() => setState((s) => loginR(s)), []);
  const logout = useCallback(() => setState((s) => logoutR(s)), []);
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

  const toggleFavorite = useCallback(
    (testId: string) => setState((s) => toggleFavoriteR(s, testId)),
    [],
  );
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
  const setUnlimitedLives = useCallback(
    (on: boolean) => setState((s) => ({ ...s, unlimitedLives: on })),
    [],
  );
  const deleteAccount = useCallback(() => setState(wipe()), []);

  const value: AppContextValue = {
    state,
    derived,
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

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
