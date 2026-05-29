import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  ChartLineUp,
  ChartPieSlice,
  ForkKnife,
  Gauge,
  House,
  Lightbulb,
  Question,
  SignOut,
  Sparkle,
  UserCircle,
} from "@phosphor-icons/react";
import { useAuth } from "../../auth/AuthContext";

export type PageKey =
  | "dashboard"
  | "food-logger"
  | "analytics"
  | "recommendations"
  | "meal-planner"
  | "progress"
  | "settings";

const NAV: { key: PageKey; label: string; path: string; Icon: typeof House }[] = [
  { key: "dashboard",       label: "Dashboard",        path: "/dashboard",        Icon: House },
  { key: "food-logger",     label: "Food Logger",      path: "/food-logger",      Icon: ForkKnife },
  { key: "analytics",       label: "Analytics",        path: "/analytics",        Icon: ChartPieSlice },
  { key: "recommendations", label: "Recommendations",  path: "/recommendations",  Icon: Lightbulb },
  { key: "meal-planner",    label: "Meal Planner",     path: "/meal-planner",     Icon: CalendarCheck },
  { key: "progress",        label: "Progress",         path: "/progress",         Icon: ChartLineUp },
  { key: "settings",        label: "Settings",         path: "/settings",         Icon: Gauge },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:border-r lg:border-ink-200 lg:bg-surface">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
          <Sparkle size={18} weight="fill" />
        </div>
        <span className="text-lg font-bold tracking-tight text-ink-900">MacroPlus</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ key, label, path, Icon }) => {
          const active = location.pathname.startsWith(path);
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`nav-item w-full text-left ${active ? "nav-item-active" : ""}`}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-ink-200 px-3 py-4">
        <button className="nav-item w-full text-left">
          <Question size={18} />
          <span>Help &amp; Support</span>
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="flex w-full items-center gap-3 rounded-lg bg-ink-50 px-3 py-2.5 text-left transition hover:bg-ink-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <UserCircle size={22} weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink-900">
                {user?.name?.trim() || user?.email || "Account"}
              </div>
              <div className="truncate text-[11px] text-ink-500">{user?.email ?? "Premium Plan"}</div>
            </div>
            <SignOut size={16} className="text-ink-400" />
          </button>
          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 z-30 mb-2 overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-lift">
              <button
                onClick={() => { setMenuOpen(false); navigate("/settings"); }}
                className="block w-full px-3 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50"
              >
                View profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); logout(); navigate("/", { replace: true }); }}
                className="flex w-full items-center gap-2 border-t border-ink-200 px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <SignOut size={14} weight="bold" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
