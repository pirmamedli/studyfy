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
  Test,
  TestAttempt,
  UserAnswer,
  UserProfile,
  UserState,
} from "../data/types";
import {
  LocalStorageRepository,
  completeTest,
  defaultState,
  login as loginR,
  logout as logoutR,
  setActivityStatus,
  toggleFavorite as toggleFavoriteR,
  updateProfile as updateProfileR,
  wipe,
  type StateRepository,
} from "../data/store";
import { computeDerived, type Derived } from "../data/progress";

interface AppContextValue {
  state: UserState;
  derived: Derived;
  // actions
  login: () => void;
  logout: () => void;
  finishTest: (input: {
    test: Test;
    answers: UserAnswer[];
    startedAt: string;
  }) => TestAttempt;
  toggleFavorite: (testId: string) => void;
  isFavorite: (testId: string) => boolean;
  setActivity: (id: string, status: CalendarActivity["status"]) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateNotifications: (patch: Partial<NotificationPreference>) => void;
  setTheme: (theme: UserProfile["theme"]) => void;
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

  // персистентность
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

  const derived = useMemo(() => computeDerived(state), [state]);

  const login = useCallback(() => setState((s) => loginR(s)), []);
  const logout = useCallback(() => setState((s) => logoutR(s)), []);

  const finishTest = useCallback(
    (input: { test: Test; answers: UserAnswer[]; startedAt: string }) => {
      const { state: next, attempt } = completeTest(stateRef.current, input);
      setState(next);
      return attempt;
    },
    [],
  );

  const toggleFavorite = useCallback(
    (testId: string) => setState((s) => toggleFavoriteR(s, testId)),
    [],
  );
  const isFavorite = useCallback(
    (testId: string) => stateRef.current.favorites.some((f) => f.testId === testId),
    [],
  );
  const setActivity = useCallback(
    (id: string, status: CalendarActivity["status"]) =>
      setState((s) => setActivityStatus(s, id, status)),
    [],
  );
  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => setState((s) => updateProfileR(s, patch)),
    [],
  );
  const updateNotifications = useCallback(
    (patch: Partial<NotificationPreference>) =>
      setState((s) =>
        updateProfileR(s, {
          notifications: { ...s.profile.notifications, ...patch },
        }),
      ),
    [],
  );
  const setTheme = useCallback(
    (theme: UserProfile["theme"]) => setState((s) => updateProfileR(s, { theme })),
    [],
  );
  const deleteAccount = useCallback(() => setState(wipe()), []);

  const value: AppContextValue = {
    state,
    derived,
    login,
    logout,
    finishTest,
    toggleFavorite,
    isFavorite,
    setActivity,
    updateProfile,
    updateNotifications,
    setTheme,
    deleteAccount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
