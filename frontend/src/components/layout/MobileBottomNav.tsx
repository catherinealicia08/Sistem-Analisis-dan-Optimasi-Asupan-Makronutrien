import { useLocation, useNavigate } from "react-router-dom";
import {
  ChartPieSlice,
  DotsThree,
  ForkKnife,
  House,
  Lightbulb,
} from "@phosphor-icons/react";

const TABS = [
  { label: "Dashboard", path: "/dashboard",       Icon: House },
  { label: "Food",      path: "/food-logger",     Icon: ForkKnife },
  { label: "Analytics", path: "/analytics",       Icon: ChartPieSlice },
  { label: "Recs",      path: "/recommendations", Icon: Lightbulb },
  { label: "More",      path: "/settings",        Icon: DotsThree },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ label, path, Icon }) => {
          const active = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-brand-600" : "text-ink-500 hover:text-ink-900"
              }`}
            >
              <Icon size={20} weight={active ? "fill" : "regular"} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
