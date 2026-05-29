import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkle } from "@phosphor-icons/react";

interface Props {
  current: "science" | "docs";
  children: ReactNode;
}

export function PublicShell({ current, children }: Props) {
  return (
    <div className="min-h-[100dvh] bg-canvas">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Sparkle size={18} weight="fill" />
            </div>
            <span className="text-lg font-bold tracking-tight text-ink-900">MacroPlus</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link to="/" className="text-sm font-medium text-ink-700 hover:text-ink-900">Home</Link>
            <Link
              to="/science"
              className={`text-sm font-medium ${current === "science" ? "text-brand-700" : "text-ink-700 hover:text-ink-900"}`}
            >
              Scientific Basis
            </Link>
            <Link
              to="/docs"
              className={`text-sm font-medium ${current === "docs" ? "text-brand-700" : "text-ink-700 hover:text-ink-900"}`}
            >
              Documentation
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-ink-700 hover:text-ink-900">Log in</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-ink-200 bg-surface">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="text-xs text-ink-400">© {new Date().getFullYear()} MacroPlus — IF3211 Kelompok 07, ITB</span>
          <div className="flex items-center gap-4 text-xs text-ink-500">
            <Link to="/science" className="hover:text-ink-900">Scientific Basis</Link>
            <Link to="/docs" className="hover:text-ink-900">Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
