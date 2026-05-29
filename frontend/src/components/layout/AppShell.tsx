import { Outlet } from "react-router-dom";
import { Bell, List, Sparkle } from "@phosphor-icons/react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppShell() {
  return (
    // overflow-x-hidden prevents horizontal page scroll so the fixed sidebar
    // can never be visually overlapped by content slid to the left.
    <div className="min-h-[100dvh] overflow-x-hidden bg-canvas">
      <Sidebar />

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-200 bg-surface px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
            <Sparkle size={14} weight="fill" />
          </div>
          <span className="text-base font-bold text-ink-900">MacroPlus</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900">
            <Bell size={18} />
          </button>
          <button className="rounded-md p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900">
            <List size={18} />
          </button>
        </div>
      </header>

      <main className="min-w-0 overflow-x-hidden lg:pl-64">
        <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          <Outlet />
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
