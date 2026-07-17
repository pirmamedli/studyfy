import { NavLink, Outlet } from "react-router-dom";
import { Icon, type IconName } from "../lib/icons";
import { useApp } from "../state/AppProvider";
import { initials, shortName } from "../lib/format";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

// Порядок нижнего меню по методичке: Задания · Прогресс · Главная · Материалы · Профиль
const TAB_ITEMS: NavItem[] = [
  { to: "/tasks", label: "Задания", icon: "tasks" },
  { to: "/progress", label: "Прогресс", icon: "progress" },
  { to: "/", label: "Главная", icon: "home", end: true },
  { to: "/materials", label: "Материалы", icon: "materials" },
  { to: "/profile", label: "Профиль", icon: "profile" },
];

const SIDEBAR_ITEMS: NavItem[] = [
  { to: "/", label: "Главная", icon: "home", end: true },
  { to: "/tasks", label: "Задания", icon: "tasks" },
  { to: "/progress", label: "Прогресс", icon: "progress" },
  { to: "/materials", label: "Материалы", icon: "materials" },
  { to: "/calendar", label: "Календарь", icon: "calendar" },
];

function Sidebar() {
  const { state, derived } = useApp();
  const name = state.profile.name || "Ученик";
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">стадифай</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {SIDEBAR_ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " is-active" : "")
            }
          >
            <Icon name={it.icon} size={20} />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <NavLink to="/profile" className="sidebar-user">
        <span className="avatar avatar--accent" style={{ width: 38, height: 38 }}>
          {initials(name)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            {shortName(name)}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {derived.rank.current.title} · {derived.totalXp} XP
          </div>
        </div>
      </NavLink>
    </aside>
  );
}

function TabBar() {
  return (
    <nav className="tabbar">
      {TAB_ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) => (isActive ? "is-active" : undefined)}
        >
          <span className="tab-ico">
            <Icon name={it.icon} size={24} />
          </span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="app">
      <Sidebar />
      <div className="viewport">
        <main className="screen">
          <Outlet />
        </main>
        <TabBar />
      </div>
    </div>
  );
}

/** Полноэкранный режим без нижнего меню — для прохождения теста и результата. */
export function FullScreenLayout() {
  return (
    <div className="app">
      <div className="viewport">
        <main className="screen screen--flush">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
